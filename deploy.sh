#!/bin/bash

echo "🚀 Iniciando processo de deploy..."

# Limpar builds antigos
echo "🧹 Limpando builds antigos..."
rm -rf .next
rm -rf node_modules/.cache

# Instalar dependências limpas
echo "📦 Instalando dependências..."
npm ci

# Build otimizado para produção
echo "🏗️  Construindo aplicação..."
NODE_ENV=production npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos prontos em .next/"
    echo ""
    echo "🔧 Para iniciar o servidor de produção:"
    echo "   npm run start"
    echo ""
    echo "🌐 Acesse: http://localhost:3000"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi