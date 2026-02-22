# Parte 14 — Notificações em Tempo Real e Busca Global

## Resumo da Implementação

### 1. Sistema de Notificações em Tempo Real (SSE)

#### Arquivos Criados:

**API Routes:**
- `app/api/notifications/stream/route.ts` — Endpoint SSE com heartbeat (30s)
- `app/api/notifications/route.ts` — Listagem de notificações com paginação

**Hooks:**
- `hooks/notifications/useNotifications.ts` — Hook principal com conexão SSE
- Inclui som de notificação via Web Audio API
- Atualização otimista do cache TanStack Query

**Components:**
- `components/notifications/NotificationBell.tsx` — Sino com badge animado
- `components/notifications/NotificationPanel.tsx` — Painel com tabs (Todas/Não lidas)
- `components/notifications/NotificationItem.tsx` — Item de notificação com ícones por tipo

**Pages:**
- `app/(dashboard)/notifications/page.tsx` — Página completa de notificações
- `app/(dashboard)/notifications/settings/page.tsx` — Configurações de notificações

**Lib:**
- `lib/notifications/create-notification.ts` — Funções para criar e broadcast de notificações

#### Funcionalidades:
- ✅ Conexão SSE unidirecional (servidor → cliente)
- ✅ Heartbeat de 30 segundos para manter conexão viva
- ✅ Global Map para streams ativos (com nota para Redis Pub/Sub em produção)
- ✅ Badge animado com contador de não lidas
- ✅ Indicador de conexão (verde/vermelho)
- ✅ Tabs para filtrar (Todas/Não lidas)
- ✅ Toast notifications com Sonner
- ✅ Som de notificação via Web Audio API (programático)
- ✅ Marcar como lida (individual ou todas)
- ✅ Paginação na página completa
- ✅ Configurações de notificações por canal (Email/Push/In-App)

---

### 2. Busca Global com Command Palette (Cmd+K)

#### Arquivos Criados:

**API Routes:**
- `app/api/search/route.ts` — Busca global com filtros por role

**Hooks:**
- `hooks/useSearch.ts` — Hook de busca com debounce (200ms)
- `hooks/useCommandPalette.ts` — Hook para atalhos de teclado (Cmd+K)
- `hooks/useRecentPages.ts` — Persistência de páginas recentes no localStorage

**Components:**
- `components/search/CommandPalette.tsx` — Palette principal (implementação customizada)
- `components/search/SearchResults.tsx` — Resultados agrupados por categoria
- `components/search/QuickActions.tsx` — Ações rápidas no estado vazio
- `components/search/Highlight.tsx` — Destaque de texto na busca

**UI Components:**
- `components/ui/scroll-area.tsx` — Componente ScrollArea do Radix

**Integração:**
- `components/layout/Header.tsx` — Atualizado com Command Palette e NotificationPanel

#### Funcionalidades:
- ✅ Command Palette acessível via Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
- ✅ Debounce de 200ms na busca
- ✅ Busca em múltiplas entidades:
  - Projetos
  - Tarefas
  - Clientes
  - Usuários
  - Notas
  - Reuniões
  - Propostas
- ✅ Filtros por role (CLIENT não vê custos, usuários internos, notas internas)
- ✅ Resultados agrupados por categoria
- ✅ Highlight de termos buscados
- ✅ Páginas recentes (persistidas no localStorage)
- ✅ Ações rápidas (atalhos de teclado)
- ✅ Navegação por teclado (↑↓ + Enter)
- ✅ Atalhos de navegação (G+H = Home, G+D = Dashboard, etc.)

---

### 3. Estrutura de Arquivos

```
app/
├── api/
│   ├── notifications/
│   │   ├── route.ts              # Listagem de notificações
│   │   └── stream/
│   │       └── route.ts          # SSE endpoint
│   └── search/
│       └── route.ts              # Busca global
├── (dashboard)/
│   └── notifications/
│       ├── page.tsx              # Página de notificações
│       └── settings/
│           └── page.tsx          # Configurações

components/
├── notifications/
│   ├── NotificationBell.tsx      # Sino com badge
│   ├── NotificationItem.tsx      # Item de notificação
│   └── NotificationPanel.tsx     # Painel popover
├── search/
│   ├── CommandPalette.tsx        # Palette Cmd+K
│   ├── Highlight.tsx             # Destaque de texto
│   ├── QuickActions.tsx          # Ações rápidas
│   └── SearchResults.tsx         # Resultados da busca
└── ui/
    └── scroll-area.tsx           # ScrollArea component

hooks/
├── notifications/
│   └── useNotifications.ts       # Hook SSE
├── useCommandPalette.ts          # Hook Cmd+K
├── useRecentPages.ts             # Hook localStorage
└── useSearch.ts                  # Hook de busca

lib/
└── notifications/
    └── create-notification.ts    # Helpers de notificação
```

---

### 4. Tipos de Notificação Suportados

```typescript
enum NotificationType {
  TASK_ASSIGNED      // Tarefa atribuída
  TASK_COMPLETED     // Tarefa concluída
  TASK_COMMENT       // Comentário em tarefa
  PROJECT_INVITE     // Convite para projeto
  MEETING_SCHEDULED  // Reunião agendada
  PROPOSAL_APPROVED  // Proposta aprovada
  PROPOSAL_REJECTED  // Proposta rejeitada
  NOTE_MENTION       // Menção em nota
  COST_ALERT         // Alerta de custo
  SYSTEM             // Notificação do sistema
}
```

---

### 5. Uso das Funções de Notificação

```typescript
import { 
  createNotification,
  notifyTaskAssigned,
  notifyProjectMembers 
} from "@/lib/notifications/create-notification"

// Notificação simples
await createNotification({
  userId: "user-id",
  type: NotificationType.TASK_ASSIGNED,
  title: "Nova tarefa",
  message: "Você foi atribuído a uma tarefa",
  link: "/projects/123/tasks",
  actorId: "actor-id"
})

// Notificação de tarefa atribuída
await notifyTaskAssigned({
  taskId: "task-id",
  assigneeId: "user-id",
  assignerId: "actor-id",
  taskTitle: "Nome da tarefa",
  projectName: "Nome do projeto",
  projectId: "project-id"
})

// Notificar todos os membros do projeto
await notifyProjectMembers({
  projectId: "project-id",
  excludeUserId: "actor-id", // opcional
  type: NotificationType.MEETING_SCHEDULED,
  title: "Reunião agendada",
  message: "Nova reunião às 15h",
  link: "/projects/123/meetings"
})
```

---

### 6. Próximos Passos (Opcional)

1. **Escalar SSE**: Substituir o Map global por Redis Pub/Sub para múltiplas instâncias
2. **Notificações Push**: Implementar Service Workers para notificações push
3. **Email**: Integrar com serviço de email (SendGrid, AWS SES)
4. **Busca Avançada**: Adicionar filtros por data, status, etc.
5. **Search Index**: Considerar Elasticsearch/Typesense para grandes volumes

---

### 7. Dependências Adicionadas

```json
{
  "@radix-ui/react-scroll-area": "^1.0.5",
  "cmdk": "^0.2.0"
}
```

> Nota: O cmdk foi adicionado mas não utilizado diretamente. A implementação do Command Palette foi feita de forma customizada usando componentes do Radix UI para maior controle. O cmdk pode ser usado em refatorações futuras se desejado.
