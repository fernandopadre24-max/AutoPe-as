#!/bin/bash

# Loja2026 - Setup Automático
# Script completo para inicialização do ambiente de desenvolvimento
# Inclui: validação de ambiente, instalação de dependências, criação do banco e dados demo

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REQUIRED_NODE_VERSION="22.0.0"
REQUIRED_NPM_VERSION="10.0.0"
DATABASE_DIR="./.database"
DATABASE_FILE="${DATABASE_DIR}/loja2026.db"
INIT_SCRIPT="./scripts/init-database.js"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_phase() {
    echo -e "${PURPLE}[PHASE]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare versions
version_compare() {
    local version=$1
    local required=$2

    if [[ "$(printf '%s\n' "$required" "$version" | sort -V | head -n1)" = "$required" ]]; then
        return 0  # version >= required
    else
        return 1  # version < required
    fi
}

# Function to get version number from command output
get_version() {
    local command=$1
    local version_output

    if ! version_output=$($command --version 2>&1); then
        echo "0.0.0"
        return 1
    fi

    # Extract version using regex - handles various formats
    echo "$version_output" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "0.0.0"
}

# Function to check available disk space (MB)
check_disk_space() {
    local required_mb=$1
    local available_mb

    # Get available space in MB for current directory
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        available_mb=$(df -m . | tail -1 | awk '{print $4}')
    else
        # Linux
        available_mb=$(df -m . | tail -1 | awk '{print $4}')
    fi

    if [ "$available_mb" -lt "$required_mb" ]; then
        log_error "Espaço insuficiente em disco. Necessário: ${required_mb}MB, Disponível: ${available_mb}MB"
        return 1
    fi

    return 0
}

# Function to check write permissions
check_write_permissions() {
    if [ ! -w "." ]; then
        log_error "Sem permissão de escrita no diretório atual"
        return 1
    fi

    # Try to create and remove a test file
    if ! touch .write_test 2>/dev/null; then
        log_error "Falha ao criar arquivos no diretório atual"
        return 1
    fi

    rm -f .write_test
    return 0
}

# Phase 1: Environment Validation
validate_environment() {
    log_phase "🔍 Fase 1: Validação do Ambiente"

    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js não encontrado. Instale Node.js ${REQUIRED_NODE_VERSION}+ primeiro."
        log_info "Download: https://nodejs.org/"
        exit 1
    fi

    local node_version
    node_version=$(get_version "node")

    if ! version_compare "$node_version" "$REQUIRED_NODE_VERSION"; then
        log_error "Node.js versão $node_version encontrada. Necessário: ${REQUIRED_NODE_VERSION}+"
        exit 1
    fi

    log_success "Node.js $node_version ✓"

    # Check npm
    if ! command_exists npm; then
        log_error "npm não encontrado"
        exit 1
    fi

    local npm_version
    npm_version=$(get_version "npm")

    if ! version_compare "$npm_version" "$REQUIRED_NPM_VERSION"; then
        log_error "npm versão $npm_version encontrada. Necessário: ${REQUIRED_NPM_VERSION}+"
        exit 1
    fi

    log_success "npm $npm_version ✓"

    # Check write permissions
    if ! check_write_permissions; then
        exit 1
    fi

    log_success "Permissões de escrita ✓"

    # Check disk space (require 500MB)
    if ! check_disk_space 500; then
        exit 1
    fi

    log_success "Espaço em disco suficiente ✓"

    log_success "Validação do ambiente concluída!"
}

# Phase 2: Dependencies Installation
install_dependencies() {
    log_phase "📦 Fase 2: Instalação de Dependências"

    log_info "Instalando dependências npm..."

    if ! npm install; then
        log_error "Falha na instalação das dependências"
        exit 1
    fi

    log_success "Dependências instaladas ✓"

    # Verify critical packages
    log_info "Verificando pacotes críticos..."

    if ! npm list better-sqlite3 >/dev/null 2>&1; then
        log_error "better-sqlite3 não foi instalado corretamente"
        exit 1
    fi

    log_success "better-sqlite3 ✓"

    # Test native module compilation
    log_info "Testando compilação de módulos nativos..."

    if ! node -e "require('better-sqlite3')" 2>/dev/null; then
        log_error "Falha ao carregar better-sqlite3. Possível problema de compilação nativa."
        log_info "Tente: npm rebuild better-sqlite3"
        exit 1
    fi

    log_success "Módulos nativos OK ✓"

    log_success "Instalação de dependências concluída!"
}

# Phase 3: Database Creation
create_database() {
    log_phase "🗄️ Fase 3: Criação do Banco de Dados"

    log_info "Criando diretório do banco: ${DATABASE_DIR}"

    if ! mkdir -p "$DATABASE_DIR"; then
        log_error "Falha ao criar diretório do banco"
        exit 1
    fi

    log_success "Diretório criado ✓"

    log_info "Executando script de inicialização do banco..."

    if [ ! -f "$INIT_SCRIPT" ]; then
        log_error "Script de inicialização não encontrado: ${INIT_SCRIPT}"
        exit 1
    fi

    if ! node "$INIT_SCRIPT"; then
        log_error "Falha na execução do script de inicialização do banco"
        exit 1
    fi

    # Verify database was created
    if [ ! -f "$DATABASE_FILE" ]; then
        log_error "Banco de dados não foi criado: ${DATABASE_FILE}"
        exit 1
    fi

    log_success "Banco criado com sucesso ✓"

    log_success "Criação do banco concluída!"
}

# Phase 4: Demo Data Population
populate_demo_data() {
    log_phase "📊 Fase 4: População com Dados Demo"

    log_info "Os dados demo são populados pelo script init-database.js"
    log_info "Verificando integridade dos dados..."

    # Quick verification - check if we can query the database
    if ! node -e "
        const Database = require('better-sqlite3');
        const db = new Database('${DATABASE_FILE}');
        try {
            const stores = db.prepare('SELECT COUNT(*) as count FROM stores').get();
            const products = db.prepare('SELECT COUNT(*) as count FROM products').get();
            const customers = db.prepare('SELECT COUNT(*) as count FROM customers').get();
            const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get();
            console.log('Lojas:', stores.count);
            console.log('Produtos:', products.count);
            console.log('Clientes:', customers.count);
            console.log('Vendas:', sales.count);
        } catch (error) {
            console.error('Erro na verificação:', error.message);
            process.exit(1);
        } finally {
            db.close();
        }
    "; then
        log_error "Falha na verificação dos dados demo"
        exit 1
    fi

    log_success "Dados demo verificados ✓"

    log_success "População de dados concluída!"
}

# Phase 5: System Verification
verify_system() {
    log_phase "✅ Fase 5: Verificação do Sistema"

    log_info "Testando queries no banco..."

    if ! node -e "
        const Database = require('better-sqlite3');
        const db = new Database('${DATABASE_FILE}');
        try {
            // Test basic queries
            const store = db.prepare('SELECT * FROM stores LIMIT 1').get();
            const product = db.prepare('SELECT * FROM products LIMIT 1').get();
            const customer = db.prepare('SELECT * FROM customers LIMIT 1').get();
            const sale = db.prepare('SELECT * FROM sales LIMIT 1').get();

            if (!store) throw new Error('Nenhuma loja configurada');
            if (!product) throw new Error('Nenhum produto encontrado');
            if (!customer) throw new Error('Nenhum cliente encontrado');
            if (!sale) throw new Error('Nenhuma venda encontrada');

            console.log('✓ Queries básicas funcionando');
        } catch (error) {
            console.error('Erro:', error.message);
            process.exit(1);
        } finally {
            db.close();
        }
    "; then
        log_error "Falha nos testes de queries"
        exit 1
    fi

    log_success "Queries no banco OK ✓"

    log_info "Verificando integridade dos dados..."

    if ! node -e "
        const Database = require('better-sqlite3');
        const db = new Database('${DATABASE_FILE}');
        try {
            // Check foreign key constraints
            const storeExists = db.prepare('SELECT COUNT(*) as count FROM stores').get().count > 0;
            const orphanedSales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE customer_id NOT IN (SELECT id FROM customers)').get();
            const orphanedItems = db.prepare('SELECT COUNT(*) as count FROM sale_items WHERE sale_id NOT IN (SELECT id FROM sales) OR product_id NOT IN (SELECT id FROM products)').get();

            if (!storeExists) throw new Error('Nenhuma loja configurada');
            if (orphanedSales.count > 0) throw new Error('Vendas com clientes inexistentes');
            if (orphanedItems.count > 0) throw new Error('Itens de venda com referências inválidas');

            console.log('✓ Integridade referencial OK');
        } catch (error) {
            console.error('Erro de integridade:', error.message);
            process.exit(1);
        } finally {
            db.close();
        }
    "; then
        log_error "Falha na verificação de integridade"
        exit 1
    fi

    log_success "Integridade dos dados OK ✓"

    log_info "Testando npm run dev..."

    # Quick syntax check by running build
    if ! npm run typecheck; then
        log_error "Falha na verificação de tipos TypeScript"
        exit 1
    fi

    log_success "TypeScript OK ✓"

    log_success "Verificação do sistema concluída!"
}

# Main function
main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║          🛍️  Loja2026 - Setup Automático       ║"
    echo "║     Ambiente de Desenvolvimento Completo     ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"

    log_info "Iniciando setup automático..."
    log_info "Este processo pode levar alguns minutos."
    echo ""

    # Execute phases
    validate_environment
    echo ""
    install_dependencies
    echo ""
    create_database
    echo ""
    populate_demo_data
    echo ""
    verify_system
    echo ""

    # Success message
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║              🎉 SETUP CONCLUÍDO!              ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"

    log_success "Sistema PDV 100% funcional!"
    echo ""
    log_info "📊 Dados Demo Incluídos:"
    echo "   • 1 Loja configurada (Fashion Store PDV) com PIX: telefone (16996509803)"
    echo "   • 5 Produtos (camisetas, calças, vestidos, tênis, jaquetas)"
    echo "   • 3 Clientes (João Silva, Maria Santos, Consumidor Final)"
    echo "   • 2 Funcionários (Carlos Pereira, Ana Oliveira)"
    echo "   • 2 Fornecedores (Distribuidora Têxtil, Jeans & Co.)"
    echo "   • 3 Vendas de demonstração (paga, pendente, prazo)"
    echo ""
    log_info "🚀 Para iniciar o sistema:"
    echo "   npm run dev"
    echo ""
    log_info "🌐 Acesse: http://localhost:9002"
    echo ""
    log_info "📁 Banco de dados: ${DATABASE_FILE}"
    echo ""
    log_success "Setup concluído com sucesso! 🎊"
}

# Handle script interruption
trap 'echo -e "\n${RED}[ERROR]${NC} Setup interrompido pelo usuário"; exit 1' INT TERM

# Run main function
main "$@"