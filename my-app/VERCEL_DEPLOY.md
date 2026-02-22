# Deploy do ProjectHub na Vercel

## Pré-requisitos

1. Conta na Vercel: https://vercel.com/signup
2. Conta no GitHub (recomendado): https://github.com/signup
3. Banco de dados (escolha uma opção):
   - **PlanetScale** (MySQL): https://planetscale.com
   - **Supabase** (PostgreSQL): https://supabase.com
   - **Neon** (PostgreSQL): https://neon.tech

---

## Passo 1: Preparar o Banco de Dados

### Opção A: PlanetScale (MySQL)

1. Crie uma conta em https://planetscale.com
2. Clique em "New Database"
3. Escolha um nome (ex: `projecthub`)
4. Região: `US East` (mais próxima do Brasil)
5. Após criar, vá em "Connect" → "Prisma"
6. Copie a `DATABASE_URL`

### Opção B: Supabase (PostgreSQL)

1. Crie uma conta em https://supabase.com
2. Novo projeto → nome `projecthub`
3. Vá em "Settings" → "Database"
4. Copie a "Connection string" (URI format)

---

## Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="sua-string-de-conexao-aqui"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-aqui-minimo-32-caracteres"
# Gerar: openssl rand -base64 32

# Configurações da Plataforma
NEXT_PUBLIC_APP_NAME="ProjectHub"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Passo 3: Preparar o Projeto

### 3.1 Instalar dependências

```bash
cd /mnt/okcomputer/output/my-app
npm install
```

### 3.2 Gerar Prisma Client

```bash
npx prisma generate
```

### 3.3 Executar migrations (desenvolvimento local)

```bash
npx prisma migrate dev --name init
```

### 3.4 Seed do banco de dados

```bash
npx prisma db seed
```

---

## Passo 4: Deploy na Vercel

### Opção A: Via CLI (Recomendado)

1. Instale a Vercel CLI:
```bash
npm i -g vercel
```

2. Login na Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Configure as variáveis de ambiente no dashboard da Vercel:
   - Acesse https://vercel.com/dashboard
   - Selecione seu projeto
   - Vá em "Settings" → "Environment Variables"
   - Adicione:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (use a URL do deploy)

### Opção B: Via GitHub

1. Crie um repositório no GitHub
2. Envie o código:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/projecthub.git
git push -u origin main
```

3. Na Vercel:
   - "Add New Project"
   - Importe do GitHub
   - Selecione o repositório
   - Framework: Next.js
   - Configure as variáveis de ambiente
   - Deploy

---

## Passo 5: Configurar Banco de Dados na Vercel

Após o deploy, execute as migrations no banco de produção:

```bash
# Usando a CLI do Prisma com a DATABASE_URL de produção
DATABASE_URL="sua-url-de-producao" npx prisma migrate deploy

# Ou execute o seed
DATABASE_URL="sua-url-de-producao" npx prisma db seed
```

---

## Passo 6: Verificar Deploy

1. Acesse a URL do deploy (ex: `https://projecthub.vercel.app`)
2. Teste o login com:
   - Email: `super@projecthub.com`
   - Senha: `password123`

---

## Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Confirme se o IP da Vercel está liberado no banco

### Erro: "NEXTAUTH_SECRET missing"
- Gere uma nova chave: `openssl rand -base64 32`
- Adicione às variáveis de ambiente da Vercel

---

## Configurações Importantes

### next.config.js

Já configurado com:
- Headers de segurança
- Redirecionamentos
- Configuração de imagens

### vercel.json

Já configurado com:
- Timeout de 300s para SSE (notificações em tempo real)
- Headers para streaming

---

## Comandos Úteis

```bash
# Build local
npm run build

# Testar build
npm start

# Health check
npm run health-check

# Prisma Studio (GUI do banco)
npx prisma studio
```

---

## Suporte

Em caso de problemas:
1. Verifique os logs na Vercel Dashboard
2. Execute `vercel logs` na CLI
3. Consulte a documentação: https://nextjs.org/docs/deployment
