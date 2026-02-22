# ProjectHub

Plataforma SaaS de gestão de projetos para consultorias e agências.
Multi-tenant, com controle de acesso por role e módulos completos.

## Stack

| Camada       | Tecnologia                           |
|-------------|--------------------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript  |
| Estilo      | Tailwind CSS + Shadcn/UI             |
| Banco       | MySQL (PlanetScale) ou PostgreSQL    |
| ORM         | Prisma                               |
| Auth        | NextAuth.js v5                       |
| State       | TanStack Query + Zustand             |
| Animações   | Framer Motion                        |
| Gráficos    | Recharts                             |
| Rich Text   | TipTap                               |
| Realtime    | Server-Sent Events (SSE)             |
| Deploy      | Vercel                               |

## Roles e Permissões

| Role         | Descrição                                      |
|-------------|------------------------------------------------|
| SUPER_ADMIN | Acesso total à plataforma e painel admin       |
| ADMIN       | Gerencia seus clientes e projetos              |
| COLLABORATOR| Trabalha nos projetos onde é membro            |
| CLIENT      | Acompanha o progresso dos seus projetos        |

## Módulos

- **Projetos**: Board drag-and-drop, filtros, múltiplas visões
- **Tarefas**: Kanban configurável, prioridades, assignees, checklists
- **Reuniões**: Agenda, pauta, ata, próximos passos
- **Propostas**: Versionamento, aprovação, itens com valores
- **Gantt**: Cronograma interativo com dependências
- **Custos**: Lançamentos, aprovações, dashboard financeiro
- **Notas**: Editor rico com auto-save e histórico de versões
- **Seções Extras**: Links, Documentos, Riscos, Feedback, Relatórios
- **Dashboards**: Personalizado por role
- **Notificações**: Tempo real via SSE
- **Busca Global**: Command Palette (Cmd+K)
- **Auditoria**: Log completo de todas as ações
- **Painel Admin**: Gestão de usuários, clientes e configurações

## Pré-requisitos

- Node.js 18+
- MySQL 8+ ou PostgreSQL 14+
- (Opcional) Redis para produção multi-instância

## Instalação

```bash
# 1. Clonar e instalar
git clone https://github.com/seu-org/projecthub
cd projecthub
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Banco de dados
npx prisma generate
npx prisma db push         # desenvolvimento
# ou
npx prisma migrate deploy  # produção

# 4. Seed inicial
npx prisma db seed

# 5. Rodar em desenvolvimento
npm run dev
```

## Deploy na Vercel

```bash
# 1. Instalar CLI da Vercel
npm i -g vercel

# 2. Login e link
vercel login
vercel link

# 3. Configurar variáveis de ambiente na Vercel
# Dashboard Vercel → Settings → Environment Variables
# Copiar todas as variáveis do .env.example

# 4. Deploy
vercel --prod
```

### Banco de Dados em Produção

#### PlanetScale (MySQL serverless)
```bash
# Criar banco no dashboard PlanetScale
# Copiar DATABASE_URL para a Vercel
npx prisma db push  # sem migrations no PlanetScale
```

#### Supabase (PostgreSQL)
```bash
# Criar projeto no Supabase
# Usar Connection Pooling URL para DATABASE_URL
# Usar Direct URL para migrations
npx prisma migrate deploy
```

### Redis (Opcional mas Recomendado)

Para notificações SSE em produção com múltiplas instâncias:

```bash
# Criar instância no Upstash (serverless Redis)
# Copiar UPSTASH_REDIS_REST_URL e TOKEN para Vercel
```

## Estrutura de Pastas

```
projecthub/
├── app/
│   ├── (auth)/           # Login, registro, recuperação
│   ├── (dashboard)/      # App principal (auth required)
│   │   ├── dashboard/    # Dashboards por role
│   │   ├── projects/     # Gestão de projetos
│   │   ├── clients/      # Gestão de clientes
│   │   ├── admin/        # Painel super admin
│   │   └── notifications/# Histórico de notificações
│   ├── api/              # API Routes
│   └── maintenance/      # Página de manutenção
├── components/
│   ├── admin/            # Componentes do painel admin
│   ├── auth/             # Componentes de autenticação
│   ├── clients/          # Componentes de clientes
│   ├── dashboard/        # Componentes dos dashboards
│   ├── gantt/            # Gráfico de Gantt
│   ├── costs/            # Controle de custos
│   ├── notifications/    # Sistema de notificações
│   ├── project/          # Layout e componentes do projeto
│   ├── search/           # Command Palette e busca
│   ├── sections/         # Seções adicionais
│   └── shared/           # Componentes compartilhados
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e lógica de negócio
├── prisma/               # Schema e migrations
├── public/               # Assets estáticos
├── scripts/              # Scripts utilitários
├── store/                # Zustand stores
└── types/                # TypeScript types globais
```

## Variáveis de Ambiente Obrigatórias

| Variável          | Descrição                          |
|------------------|-----------------------------------|
| DATABASE_URL     | String de conexão do banco         |
| NEXTAUTH_URL     | URL base da aplicação              |
| NEXTAUTH_SECRET  | Secret do NextAuth (32+ chars)     |

## Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run lint         # ESLint
npx prisma studio    # GUI do banco de dados
npx prisma db seed   # Seed de dados iniciais
npx ts-node scripts/health-check.ts  # Verificar configuração
ANALYZE=true npm run build  # Analisar bundle
```

## Usuários de Teste (após seed)

| Email                    | Senha       | Role         |
|--------------------------|-------------|--------------|
| super@projecthub.com     | password123 | SUPER_ADMIN  |
| admin@projecthub.com     | password123 | ADMIN        |
| dev@projecthub.com       | password123 | COLLABORATOR |
| client@techcorp.com      | password123 | CLIENT       |

## Segurança

- Todas as rotas API verificam autenticação e autorização
- Rate limiting nas rotas públicas e de auth
- Headers de segurança configurados no next.config.js
- Senhas com bcrypt (12 rounds)
- Sessões com JWT assinado (NEXTAUTH_SECRET)
- Logs de auditoria para todas as ações críticas
- Modo de manutenção com bloqueio de acesso

## Health Check

Antes do deploy, execute:

```bash
npx ts-node scripts/health-check.ts
```

Isso verifica:
- Variáveis de ambiente obrigatórias
- Conexão com o banco de dados
- Existência do usuário SUPER_ADMIN
- Tabelas essenciais
- Configurações do sistema

## Roadmap

- [ ] Email transacional (convites, alertas de prazo)
- [ ] Integração com Google Calendar
- [ ] App mobile (React Native)
- [ ] Webhooks para integrações externas
- [ ] SSO com SAML/LDAP
- [ ] Relatórios em PDF com layout customizável
- [ ] API pública documentada (OpenAPI)
- [ ] Multi-idioma (i18n)

## Licença

MIT
