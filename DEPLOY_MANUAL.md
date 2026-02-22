# Deploy Manual do ProjectHub na Vercel

## ⚡ Opção Rápida (2 minutos)

### Passo 1: Copie o projeto para sua máquina

O projeto está em: `/mnt/okcomputer/output/my-app/`

Copie esta pasta para sua máquina local.

---

### Passo 2: Execute o script de deploy

```bash
cd my-app
chmod +x DEPLOY_VERCEL.sh
./DEPLOY_VERCEL.sh
```

O script vai:
1. ✅ Verificar Node.js
2. ✅ Instalar Vercel CLI
3. ✅ Instalar dependências
4. ✅ Gerar Prisma Client
5. ✅ Fazer build
6. ✅ Fazer login na Vercel
7. 🚀 Fazer deploy

---

## 📋 Opção Manual (Passo a Passo)

### 1. Preparar Banco de Dados

**Opção A - PlanetScale (Recomendado):**
1. Acesse https://planetscale.com
2. Crie conta com GitHub
3. "New Database" → Nome: `projecthub`
4. Região: `US East`
5. Clique em "Connect" → "Prisma"
6. Copie a `DATABASE_URL`

**Opção B - Supabase:**
1. Acesse https://supabase.com
2. Novo projeto → `projecthub`
3. Settings → Database
4. Copie a Connection String

---

### 2. Configurar Variáveis de Ambiente

```bash
cd my-app
cp .env.example .env.local
```

Edite `.env.local`:
```env
DATABASE_URL="sua-url-do-banco-aqui"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-32-caracteres"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

### 3. Instalar Dependências

```bash
npm install
```

---

### 4. Gerar Prisma Client

```bash
npx prisma generate
```

---

### 5. Fazer Build

```bash
npm run build
```

---

### 6. Deploy na Vercel

**Instalar Vercel CLI:**
```bash
npm i -g vercel
```

**Login:**
```bash
vercel login
```

**Deploy:**
```bash
# Preview (teste)
vercel

# Produção
vercel --prod
```

---

### 7. Configurar Variáveis na Vercel

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Settings → Environment Variables
4. Adicione:
   - `DATABASE_URL` = sua URL do banco
   - `NEXTAUTH_SECRET` = chave gerada
   - `NEXTAUTH_URL` = URL do deploy (ex: https://projecthub.vercel.app)

---

### 8. Executar Migrations

```bash
# Usando a URL de produção
DATABASE_URL="sua-url-producao" npx prisma migrate deploy
```

---

### 9. Seed do Banco

```bash
DATABASE_URL="sua-url-producao" npx prisma db seed
```

---

## 🔑 Credenciais de Teste

Após o seed:

| Email | Senha | Role |
|-------|-------|------|
| super@projecthub.com | password123 | SUPER_ADMIN |
| admin@projecthub.com | password123 | ADMIN |
| dev@projecthub.com | password123 | COLLABORATOR |
| client@techcorp.com | password123 | CLIENT |

---

## 🆘 Troubleshooting

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
- Confirme se o IP está liberado no banco (PlanetScale: "Accept all IPs")

### Erro: "Build failed"
```bash
# Verificar TypeScript
npm run typecheck

# Tentar build novamente
npm run build
```

---

## 📞 Suporte

Em caso de problemas:
1. Logs na Vercel: https://vercel.com/dashboard → Seu projeto → "View Logs"
2. Documentação Next.js: https://nextjs.org/docs/deployment
3. Documentação Vercel: https://vercel.com/docs
