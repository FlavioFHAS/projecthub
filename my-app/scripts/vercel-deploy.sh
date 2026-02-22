#!/bin/bash

# Script de Deploy do ProjectHub na Vercel
# Uso: ./scripts/vercel-deploy.sh

set -e

echo "🚀 ProjectHub - Deploy na Vercel"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ necessário. Versão atual: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI não instalado. Instalando...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}✓ Vercel CLI instalado${NC}"

# Verificar variáveis de ambiente
echo ""
echo "📋 Verificando variáveis de ambiente..."

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ Arquivo .env.local encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo "   Criando arquivo de exemplo..."
    cat > .env.local << EOF
# Banco de Dados
DATABASE_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
EOF
    echo -e "${YELLOW}   ⚠️  Por favor, edite o arquivo .env.local com suas configurações${NC}"
fi

# Verificar se DATABASE_URL está configurada
if grep -q "DATABASE_URL=\"\"" .env.local 2>/dev/null || ! grep -q "DATABASE_URL" .env.local 2>/dev/null; then
    echo -e "${RED}❌ DATABASE_URL não configurada${NC}"
    echo "   Configure seu banco de dados:"
    echo "   - PlanetScale: https://planetscale.com"
    echo "   - Supabase: https://supabase.com"
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL configurada${NC}"

# Verificar Prisma
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Schema do Prisma não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Schema do Prisma encontrado${NC}"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Build do projeto
echo ""
echo "🏗️  Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build falhou. Corrija os erros acima.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído com sucesso${NC}"

# Health check
echo ""
echo "🔍 Executando health check..."
if [ -f "scripts/health-check.ts" ]; then
    npx tsx scripts/health-check.ts || true
fi

# Deploy na Vercel
echo ""
echo "🚀 Iniciando deploy na Vercel..."
echo ""
echo -e "${YELLOW}⚠️  Você será solicitado a fazer login na Vercel (se ainda não estiver logado)${NC}"
echo ""

# Verificar se já está logado
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Faça login na Vercel:"
    vercel login
fi

# Perguntar tipo de deploy
echo ""
echo "Escolha o tipo de deploy:"
echo "1) Preview (ambiente de teste)"
echo "2) Produção"
read -p "Opção (1 ou 2): " deploy_type

if [ "$deploy_type" = "2" ]; then
    echo ""
    echo "🚀 Deploy em PRODUÇÃO..."
    vercel --prod
else
    echo ""
    echo "🚀 Deploy em PREVIEW..."
    vercel
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse o dashboard da Vercel: https://vercel.com/dashboard"
echo "2. Configure as variáveis de ambiente no projeto"
echo "3. Execute as migrations no banco de produção"
echo ""
echo "🔗 Links úteis:"
echo "   - Dashboard: https://vercel.com/dashboard"
echo "   - Documentação: https://nextjs.org/docs/deployment"
echo ""
