#!/bin/bash

# ============================================================
# ProjectHub - Script de Deploy na Vercel
# ============================================================
# Execute este script na sua máquina local para fazer deploy
# 
# Uso:
#   1. Copie este arquivo para a pasta do projeto
#   2. chmod +x DEPLOY_VERCEL.sh
#   3. ./DEPLOY_VERCEL.sh
# ============================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           ProjectHub - Deploy na Vercel                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar Node.js
echo -e "${BLUE}▶ Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado${NC}"
    echo "Instale o Node.js 18+: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ necessário. Versão atual: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Verificar npm
echo -e "${BLUE}▶ Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Instalar Vercel CLI
echo ""
echo -e "${BLUE}▶ Instalando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI instalado${NC}"
else
    echo -e "${GREEN}✓ Vercel CLI já instalado ($(vercel --version))${NC}"
fi

# Verificar pasta do projeto
echo ""
echo -e "${BLUE}▶ Verificando projeto...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na pasta raiz do ProjectHub${NC}"
    echo "   (onde está o arquivo package.json)"
    exit 1
fi
echo -e "${GREEN}✓ Projeto encontrado${NC}"

# Verificar .env.local
echo ""
echo -e "${BLUE}▶ Verificando variáveis de ambiente...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo ""
    echo -e "${BLUE}Criando .env.local...${NC}"
    
    # Gerar NEXTAUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    cat > .env.local << EOF
# Banco de Dados
DATABASE_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$AUTH_SECRET"

# Configurações
NEXT_PUBLIC_APP_NAME="ProjectHub"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
    
    echo -e "${GREEN}✓ Arquivo .env.local criado${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o .env.local e adicione sua DATABASE_URL${NC}"
    echo ""
    echo "Opções de banco de dados:"
    echo "  1. PlanetScale (MySQL): https://planetscale.com"
    echo "  2. Supabase (PostgreSQL): https://supabase.com"
    echo "  3. Neon (PostgreSQL): https://neon.tech"
    echo ""
    read -p "Pressione ENTER após configurar o .env.local..."
fi

# Verificar DATABASE_URL
if ! grep -q "DATABASE_URL=" .env.local 2>/dev/null || grep -q 'DATABASE_URL=""' .env.local 2>/dev/null; then
    echo -e "${RED}❌ DATABASE_URL não configurada no .env.local${NC}"
    echo "Por favor, edite o arquivo e adicione sua DATABASE_URL"
    exit 1
fi
echo -e "${GREEN}✓ Variáveis de ambiente configuradas${NC}"

# Instalar dependências
echo ""
echo -e "${BLUE}▶ Instalando dependências...${NC}"
npm install
echo -e "${GREEN}✓ Dependências instaladas${NC}"

# Gerar Prisma Client
echo ""
echo -e "${BLUE}▶ Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client gerado${NC}"

# Build do projeto
echo ""
echo -e "${BLUE}▶ Fazendo build do projeto...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build falhou${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build concluído${NC}"

# Login na Vercel
echo ""
echo -e "${BLUE}▶ Verificando login na Vercel...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você precisa fazer login na Vercel${NC}"
    echo ""
    vercel login
fi
echo -e "${GREEN}✓ Logado na Vercel como: $(vercel whoami)${NC}"

# Deploy
echo ""
echo -e "${BLUE}▶ Iniciando deploy...${NC}"
echo ""
echo "Escolha o tipo de deploy:"
echo ""
echo "  1) ${GREEN}Preview${NC} - Deploy de teste (URL temporária)"
echo "  2) ${GREEN}Produção${NC} - Deploy oficial (URL principal)"
echo ""
read -p "Opção (1 ou 2): " deploy_option

echo ""
if [ "$deploy_option" = "2" ]; then
    echo -e "${BLUE}🚀 Fazendo deploy em PRODUÇÃO...${NC}"
    vercel --prod
else
    echo -e "${BLUE}🚀 Fazendo deploy em PREVIEW...${NC}"
    vercel
fi

# Resultado
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              ✅ Deploy concluído!                        ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Configure as variáveis de ambiente no dashboard:"
echo "     https://vercel.com/dashboard"
echo ""
echo "  2. Adicione estas variáveis no projeto:"
echo "     - DATABASE_URL"
echo "     - NEXTAUTH_SECRET"
echo "     - NEXTAUTH_URL (use a URL do deploy)"
echo ""
echo "  3. Execute as migrations no banco:"
echo "     DATABASE_URL=\"sua-url\" npx prisma migrate deploy"
echo ""
echo "  4. Execute o seed (dados iniciais):"
echo "     DATABASE_URL=\"sua-url\" npx prisma db seed"
echo ""
echo "🔑 Credenciais de teste (após seed):"
echo "     super@projecthub.com / password123"
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
