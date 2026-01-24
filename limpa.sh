#!/bin/bash
# macos_cleanup.sh — Limpeza de espaço no macOS 12 (Monterey)
# Execute como root: sudo bash macos_cleanup.sh --dry-run
# Opções:
#   --dry-run        Mostra o que faria, não apaga nada
#   --aggressive     Inclui limpezas mais pesadas (Xcode simulators, etc.)
#   --paths "A;B;C"  Lista de caminhos (separados por ;) para buscar node_modules
#   --days N         Remove node_modules apenas se não modificados há N dias (padrão 14)
#   --no-nodemodules Não remove node_modules
#   --no-user-caches Não limpa caches/Logs de usuários
#   --no-brew        Não roda limpezas do Homebrew
#   --no-dev-caches  Não limpa caches npm/yarn/pnpm/bun
#
# Observação: macOS 12 vem com bash 3.2 — evite recursos muito modernos.

set -u

LOG_FILE="/var/log/disk-cleanup-macos.log"
DRY_RUN=0
AGGRESSIVE=0
NO_NODEMODULES=0
NO_USER_CACHES=0
NO_BREW=0
NO_DEV_CACHES=0
NODE_DAYS=14
CUSTOM_PATHS=""

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

log() {
  echo "[$(timestamp)] $*" | tee -a "$LOG_FILE"
}

run_cmd() {
  # Executa comando respeitando dry-run
  if [ "$DRY_RUN" -eq 1 ]; then
    log "[DRY-RUN] $*"
    return 0
  fi
  log "[RUN] $*"
  eval "$@"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Este script precisa ser executado como root (use sudo)." >&2
    exit 1
  fi
}

human_df() {
  df -h / 2>/dev/null | tail -n 1
}

banner() {
  echo "============================================================"
  echo " macOS Cleanup (Monterey) — Liberação de Espaço em Disco"
  echo " Log: $LOG_FILE"
  echo "============================================================"
}

usage() {
  cat <<EOF
Uso:
  sudo bash macos_cleanup.sh [opções]

Opções:
  --dry-run
  --aggressive
  --paths "A;B;C"
  --days N
  --no-nodemodules
  --no-user-caches
  --no-brew
  --no-dev-caches
EOF
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run) DRY_RUN=1; shift ;;
      --aggressive) AGGRESSIVE=1; shift ;;
      --paths) CUSTOM_PATHS="${2:-}"; shift 2 ;;
      --days) NODE_DAYS="${2:-14}"; shift 2 ;;
      --no-nodemodules) NO_NODEMODULES=1; shift ;;
      --no-user-caches) NO_USER_CACHES=1; shift ;;
      --no-brew) NO_BREW=1; shift ;;
      --no-dev-caches) NO_DEV_CACHES=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) echo "Opção desconhecida: $1" >&2; usage; exit 1 ;;
    esac
  done
}

confirm() {
  local msg="$1"
  echo ""
  echo "$msg"
  echo "Digite: YES (maiúsculo) para continuar."
  read -r ans
  if [ "$ans" != "YES" ]; then
    echo "Abortado."
    exit 1
  fi
}

safe_rm_dir() {
  # Remove diretório se existir
  local target="$1"
  if [ -z "$target" ]; then return 0; fi
  if [ -d "$target" ]; then
    run_cmd "rm -rf \"$target\""
  fi
}

safe_rm_glob() {
  # Remove via glob se houver match
  local pattern="$1"
  if [ -z "$pattern" ]; then return 0; fi
  # Expansão controlada
  local matches
  matches=$(ls -d $pattern 2>/dev/null || true)
  if [ -n "$matches" ]; then
    run_cmd "rm -rf $pattern"
  fi
}

list_console_users() {
  # Lista usuários humanos (uid >= 501), exclui contas de sistema comuns
  dscl . -list /Users UniqueID | awk '$2 >= 501 {print $1}' \
    | grep -vE '^(nobody|Guest)$' || true
}

home_of_user() {
  local u="$1"
  dscl . -read "/Users/$u" NFSHomeDirectory 2>/dev/null | awk '{print $2}'
}

cleanup_brew() {
  if [ "$NO_BREW" -eq 1 ]; then
    log "Homebrew: pulando (NO_BREW=1)."
    return 0
  fi

  if ! command -v brew >/dev/null 2>&1; then
    log "Homebrew não encontrado: pulando."
    return 0
  fi

  log "=== Homebrew: limpeza e remoção de obsoletos ==="
  # Evita problemas de permissões do brew com root: tenta executar como owner do brew (normalmente o usuário)
  # Mas como não sabemos o usuário certo, executaremos de modo robusto:
  # 1) brew cleanup / autoremove
  # 2) apaga caches conhecidos

  run_cmd "brew update >/dev/null 2>&1 || true"
  run_cmd "brew cleanup -s || true"
  run_cmd "brew autoremove || true"
  # Prune geral (pode remover muitas versões antigas)
  run_cmd "brew cleanup --prune=all || true"

  # Caches do Homebrew (tendem a ser grandes)
  safe_rm_dir "/Library/Caches/Homebrew"
  safe_rm_dir "/opt/homebrew/var/homebrew/cache"        # Apple Silicon comum
  safe_rm_dir "/usr/local/var/homebrew/cache"           # Intel comum
  safe_rm_glob "/opt/homebrew/Library/Taps/*/*/.git/objects/pack/*.pack"
  safe_rm_glob "/usr/local/Homebrew/Library/Taps/*/*/.git/objects/pack/*.pack"
}

cleanup_system_temp() {
  log "=== Sistema: temporários e logs conhecidos ==="
  # Cuidado com /private/var/vm (swap) — não mexer.
  # /private/var/log pode ser grande; removemos apenas arquivos rotacionados/antigos via padrão seguro.

  # Alguns caches temporários seguros:
  safe_rm_glob "/private/var/folders/*/*/*/com.apple.Safari/*"   # pode variar
  safe_rm_glob "/private/var/folders/*/*/*/TemporaryItems/*"
  safe_rm_glob "/private/var/folders/*/*/*/C/*"

  # Logs rotacionados (não remove logs atuais)
  safe_rm_glob "/private/var/log/*.0.gz"
  safe_rm_glob "/private/var/log/*.1.gz"
  safe_rm_glob "/private/var/log/*.2.gz"
  safe_rm_glob "/private/var/log/*.3.gz"
  safe_rm_glob "/private/var/log/*.[0-9].bz2"
}

cleanup_user_caches_for_user() {
  local u="$1"
  local home
  home="$(home_of_user "$u")"
  if [ -z "$home" ] || [ ! -d "$home" ]; then
    return 0
  fi

  log "--- Usuário: $u | Home: $home ---"

  # Limpeza geral de caches e logs (pode recuperar muito espaço, mas alguns apps podem ficar mais lentos no 1º start)
  safe_rm_glob "$home/Library/Caches/*"
  safe_rm_glob "$home/Library/Logs/*"

  # Caches específicos que costumam ser enormes (opcional e relativamente seguro)
  safe_rm_dir "$home/Library/Caches/Google/Chrome"
  safe_rm_dir "$home/Library/Caches/com.google.Chrome"
  safe_rm_dir "$home/Library/Caches/Slack"
  safe_rm_dir "$home/Library/Caches/discord"
  safe_rm_dir "$home/Library/Caches/com.microsoft.VSCode"
  safe_rm_dir "$home/Library/Caches/com.apple.Safari"
  safe_rm_dir "$home/Library/Caches/BraveSoftware"
  safe_rm_dir "$home/Library/Caches/org.whispersystems.signal-desktop" 2>/dev/null || true

  # Lixeira do usuário (muitas vezes é onde está o “espaço perdido”)
  # ATENÇÃO: isso apaga definitivamente.
  safe_rm_glob "$home/.Trash/*"

  # Downloads do Xcode: DerivedData e Archives (muito grande em dev)
  safe_rm_dir "$home/Library/Developer/Xcode/DerivedData"
  safe_rm_dir "$home/Library/Developer/Xcode/Archives"

  if [ "$AGGRESSIVE" -eq 1 ]; then
    # Simuladores iOS (pode ser gigante; reconstruído quando necessário)
    safe_rm_dir "$home/Library/Developer/CoreSimulator/Caches"
    safe_rm_dir "$home/Library/Developer/CoreSimulator/Devices"
    # iOS DeviceSupport (downloads por versão de iOS)
    safe_rm_dir "$home/Library/Developer/Xcode/iOS DeviceSupport"
  fi
}

cleanup_user_caches_all() {
  if [ "$NO_USER_CACHES" -eq 1 ]; then
    log "Caches de usuários: pulando (NO_USER_CACHES=1)."
    return 0
  fi

  log "=== Usuários: limpeza de caches e logs ==="
  local users
  users="$(list_console_users)"
  if [ -z "$users" ]; then
    log "Nenhum usuário humano encontrado (uid>=501)."
    return 0
  fi

  echo "$users" | while read -r u; do
    cleanup_user_caches_for_user "$u"
  done
}

run_as_user_if_possible() {
  local user="$1"
  local cmd="$2"
  if id "$user" >/dev/null 2>&1; then
    if [ "$DRY_RUN" -eq 1 ]; then
      log "[DRY-RUN] su -l \"$user\" -c \"$cmd\""
      return 0
    fi
    log "[RUN] (as $user) $cmd"
    su -l "$user" -c "$cmd" >/dev/null 2>&1 || true
  fi
}

cleanup_dev_caches_all() {
  if [ "$NO_DEV_CACHES" -eq 1 ]; then
    log "Caches de dev (npm/yarn/pnpm/bun): pulando (NO_DEV_CACHES=1)."
    return 0
  fi

  log "=== Dev caches: npm/yarn/pnpm/bun (por usuário) ==="
  local users
  users="$(list_console_users)"
  if [ -z "$users" ]; then return 0; fi

  echo "$users" | while read -r u; do
    # npm
    run_as_user_if_possible "$u" "command -v npm >/dev/null 2>&1 && npm cache verify >/dev/null 2>&1 || true"
    run_as_user_if_possible "$u" "command -v npm >/dev/null 2>&1 && npm cache clean --force >/dev/null 2>&1 || true"

    # yarn (classic e berry)
    run_as_user_if_possible "$u" "command -v yarn >/dev/null 2>&1 && yarn cache clean >/dev/null 2>&1 || true"

    # pnpm
    run_as_user_if_possible "$u" "command -v pnpm >/dev/null 2>&1 && pnpm store prune >/dev/null 2>&1 || true"

    # bun
    run_as_user_if_possible "$u" "command -v bun >/dev/null 2>&1 && bun pm cache rm >/dev/null 2>&1 || true"
  done
}

default_project_paths_for_user() {
  local home="$1"
  # Diretórios comuns de projetos
  echo "$home/Projects
$home/projetos
$home/Dev
$home/Developer
$home/code
$home/Coding
$home/work
$home/repos"
}

cleanup_node_modules_in_paths() {
  local path_list="$1"
  if [ -z "$path_list" ]; then return 0; fi

  # Para cada caminho, remove node_modules não modificados há N dias
  # Obs: find com -mtime +N em diretórios é aproximado; serve como filtro de segurança.
  echo "$path_list" | while read -r base; do
    [ -z "$base" ] && continue
    [ ! -d "$base" ] && continue

    log "Buscando node_modules em: $base (mtime > $NODE_DAYS dias)"

    if [ "$DRY_RUN" -eq 1 ]; then
      # Apenas listar
      find "$base" -type d -name "node_modules" -prune -mtime +"$NODE_DAYS" 2>/dev/null | head -n 200 | while read -r d; do
        log "[DRY-RUN] removeria: $d"
      done
      # Nota: para não inundar log, limitamos listagem; a remoção real não tem esse limite.
    else
      find "$base" -type d -name "node_modules" -prune -mtime +"$NODE_DAYS" 2>/dev/null \
        -exec rm -rf {} + || true
    fi
  done
}

cleanup_node_modules_all() {
  if [ "$NO_NODEMODULES" -eq 1 ]; then
    log "node_modules: pulando (NO_NODEMODULES=1)."
    return 0
  fi

  log "=== Projetos: remoção de node_modules (com segurança) ==="

  # Caminhos base:
  # - se o usuário forneceu --paths, usamos só esses
  # - senão, usamos pastas comuns dentro de cada home de usuário humano
  if [ -n "$CUSTOM_PATHS" ]; then
    # separador ;
    local norm
    norm="$(echo "$CUSTOM_PATHS" | tr ';' '\n')"
    cleanup_node_modules_in_paths "$norm"
    return 0
  fi

  local users
  users="$(list_console_users)"
  if [ -z "$users" ]; then return 0; fi

  echo "$users" | while read -r u; do
    local home
    home="$(home_of_user "$u")"
    [ -z "$home" ] && continue
    [ ! -d "$home" ] && continue
    cleanup_node_modules_in_paths "$(default_project_paths_for_user "$home")"
  done
}

final_summary() {
  log "=== Resumo final ==="
  log "Disco (/): $(human_df)"
  log "Log salvo em: $LOG_FILE"
}

main() {
  require_root
  parse_args "$@"

  # Inicia log
  touch "$LOG_FILE" 2>/dev/null || true

  banner
  log "Iniciando limpeza. DRY_RUN=$DRY_RUN AGGRESSIVE=$AGGRESSIVE NODE_DAYS=$NODE_DAYS"

  log "Disco (/): $(human_df)"

  confirm "ATENÇÃO: Este script pode apagar caches, logs e node_modules permanentemente."

  cleanup_brew
  cleanup_system_temp
  cleanup_user_caches_all
  cleanup_dev_caches_all
  cleanup_node_modules_all

  final_summary
  log "Concluído."
}

main "$@"
