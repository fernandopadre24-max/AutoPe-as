#!/bin/bash

# Script para executar o aplicativo Loja2026 PDV com Tauri
# Este script inicializa o Next.js em background e depois executa o Tauri

echo "🚀 Iniciando Loja2026 PDV com Tauri..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    echo "❌ Execute este script do diretório raiz do projeto"
    exit 1
fi

# Verificar se o banco está inicializado
if [ ! -f ".database/loja2026.db" ]; then
    echo "📊 Banco de dados não encontrado. Inicializando..."
    npm run db:init
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao inicializar banco de dados"
        exit 1
    fi
fi

# Copiar banco para o diretório do Tauri (para desenvolvimento)
echo "📋 Copiando banco de dados para aplicação desktop..."
cp .database/loja2026.db src-tauri/loja2026.db
echo "✅ Banco de dados sincronizado"

# Verificar se Tauri CLI está instalado
if ! command -v tauri &> /dev/null; then
    echo "⚠️ Tauri CLI não encontrado. Instalando..."
    npm install -g @tauri-apps/cli
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Iniciar Next.js em background
echo "🌐 Iniciando servidor Next.js..."
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!

# Aguardar Next.js inicializar
echo "⏳ Aguardando servidor Next.js iniciar..."
sleep 8

# Verificar se Next.js está rodando (tentar múltiplas vezes)
MAX_ATTEMPTS=5
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:9002/api/health > /dev/null; then
        break
    fi
    echo "Tentativa $ATTEMPT de $MAX_ATTEMPTS..."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "❌ Servidor Next.js não iniciou corretamente após $MAX_ATTEMPTS tentativas"
    kill $NEXTJS_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Servidor Next.js iniciado com sucesso"

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Encerrando aplicação..."
    kill $NEXTJS_PID 2>/dev/null || true
    exit 0
}

# Capturar sinais de interrupção
trap cleanup INT TERM

# Executar Tauri
echo "🖥️ Iniciando aplicação Tauri..."
cd src-tauri && tauri dev

# Cleanup quando Tauri terminar
cleanup