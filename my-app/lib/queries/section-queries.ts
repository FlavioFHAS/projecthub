import { prisma } from "@/lib/prisma";
import { userSelectMin } from "./user-queries";

// ============================================
// MEETING QUERIES
// ============================================

export const meetingListSelect = {
  id: true,
  title: true,
  date: true,
  duration: true,
  type: true,
  status: true,
  meetingUrl: true,
  location: true,
  isVisibleToClient: true,
  createdAt: true,
  createdBy: {
    select: userSelectMin,
  },
  _count: {
    select: {
      participants: true,
    },
  },
} as const;

export const meetingFullInclude = {
  createdBy: {
    select: userSelectMin,
  },
  participants: {
    include: {
      user: {
        select: userSelectMin,
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  attachments: true,
} as const;

// ============================================
// PROPOSAL QUERIES
// ============================================

export const proposalListSelect = {
  id: true,
  code: true,
  version: true,
  title: true,
  status: true,
  totalValue: true,
  validUntil: true,
  isVisibleToClient: true,
  createdAt: true,
  approvedAt: true,
  createdBy: {
    select: userSelectMin,
  },
  approvedBy: {
    select: userSelectMin,
  },
} as const;

export const proposalFullSelect = {
  id: true,
  code: true,
  version: true,
  title: true,
  status: true,
  scope: true,
  items: true,
  paymentTerms: true,
  internalNotes: true,
  totalValue: true,
  validUntil: true,
  isVisibleToClient: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  createdBy: {
    select: userSelectMin,
  },
  approvedBy: {
    select: userSelectMin,
  },
  parentProposal: {
    select: {
      id: true,
      code: true,
      version: true,
    },
  },
  childProposals: {
    select: {
      id: true,
      code: true,
      version: true,
      status: true,
    },
  },
} as const;

// ============================================
// GANTT QUERIES
// ============================================

export const ganttItemInclude = {
  responsible: {
    select: userSelectMin,
  },
  dependencies: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  },
  linkedTasks: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} as const;

// Recursively build Gantt tree
export async function buildGanttTree(
  projectId: string,
  parentId: string | null = null
): Promise<any[]> {
  const items = await prisma.ganttItem.findMany({
    where: {
      projectId,
      parentId,
      isActive: true,
    },
    include: ganttItemInclude,
    orderBy: { order: "asc" },
  });

  const result = [];
  for (const item of items) {
    const children = await buildGanttTree(projectId, item.id);
    result.push({
      ...item,
      children,
    });
  }

  return result;
}

// Calculate progress for parent items
export function calculateParentProgress(children: any[]): number {
  if (!children || children.length === 0) return 0;

  const totalDuration = children.reduce((sum, child) => {
    const start = new Date(child.startDate).getTime();
    const end = new Date(child.endDate).getTime();
    return sum + (end - start);
  }, 0);

  if (totalDuration === 0) {
    return Math.round(
      children.reduce((sum, child) => sum + (child.progress || 0), 0) /
        children.length
    );
  }

  const weightedProgress = children.reduce((sum, child) => {
    const start = new Date(child.startDate).getTime();
    const end = new Date(child.endDate).getTime();
    const duration = end - start;
    const weight = duration / totalDuration;
    return sum + (child.progress || 0) * weight;
  }, 0);

  return Math.round(weightedProgress);
}

// ============================================
// TASK QUERIES
// ============================================

export const taskListInclude = {
  assignees: {
    include: {
      user: {
        select: userSelectMin,
      },
    },
  },
  column: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  _count: {
    select: {
      comments: true,
      logs: true,
    },
  },
} as const;

export const taskFullInclude = {
  assignees: {
    include: {
      user: {
        select: userSelectMin,
      },
    },
  },
  column: {
    select: {
      id: true,
      name: true,
      color: true,
      taskStatus: true,
    },
  },
  comments: {
    include: {
      user: {
        select: userSelectMin,
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  logs: {
    include: {
      user: {
        select: userSelectMin,
      },
    },
    orderBy: { date: "desc" as const },
  },
  ganttItem: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      progress: true,
    },
  },
  createdBy: {
    select: userSelectMin,
  },
} as const;

// Get tasks grouped by kanban column
export async function getTasksByColumn(projectId: string) {
  const columns = await prisma.kanbanColumn.findMany({
    where: { projectId, isActive: true },
    orderBy: { order: "asc" },
  });

  const tasksByColumn: Record<string, any[]> = {};

  for (const column of columns) {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        columnId: column.id,
        isArchived: false,
        isActive: true,
      },
      include: taskListInclude,
      orderBy: { order: "asc" },
    });

    // Calculate derived fields
    tasksByColumn[column.id] = tasks.map((task) => ({
      ...task,
      isOverdue:
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "DONE",
      totalHoursLogged: task.logs.reduce(
        (sum, log) => sum + log.hoursLogged,
        0
      ),
    }));
  }

  return { columns, tasksByColumn };
}

// ============================================
// COST QUERIES
// ============================================

export const costListSelect = {
  id: true,
  date: true,
  category: true,
  description: true,
  amount: true,
  type: true,
  status: true,
  receiptUrl: true,
  costCenter: true,
  tags: true,
  notes: true,
  createdAt: true,
  responsible: {
    select: userSelectMin,
  },
  approvedBy: {
    select: userSelectMin,
  },
  approvedAt: true,
} as const;

export interface CostSummary {
  totalBudget: number;
  totalPlanned: number;
  totalActual: number;
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  remainingBudget: number;
  budgetUsagePercentage: number;
  byCategory: Record<string, { planned: number; actual: number }>;
}

export async function getProjectCostSummary(
  projectId: string
): Promise<CostSummary> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { budget: true },
  });

  const budget = project?.budget || 0;

  const costs = await prisma.costEntry.findMany({
    where: { projectId, isActive: true },
    select: {
      amount: true,
      type: true,
      status: true,
      category: true,
    },
  });

  let totalPlanned = 0;
  let totalActual = 0;
  let totalPending = 0;
  let totalApproved = 0;
  let totalPaid = 0;

  const byCategory: Record<string, { planned: number; actual: number }> = {};

  for (const cost of costs) {
    if (cost.type === "PLANNED") {
      totalPlanned += cost.amount;
    } else if (cost.type === "ACTUAL") {
      totalActual += cost.amount;
    }

    if (cost.status === "PENDING") {
      totalPending += cost.amount;
    } else if (cost.status === "APPROVED") {
      totalApproved += cost.amount;
    } else if (cost.status === "PAID") {
      totalPaid += cost.amount;
    }

    // Group by category
    if (!byCategory[cost.category]) {
      byCategory[cost.category] = { planned: 0, actual: 0 };
    }
    if (cost.type === "PLANNED") {
      byCategory[cost.category].planned += cost.amount;
    } else if (cost.type === "ACTUAL") {
      byCategory[cost.category].actual += cost.amount;
    }
  }

  const remainingBudget = budget - totalActual;
  const budgetUsagePercentage = budget > 0 ? (totalActual / budget) * 100 : 0;

  return {
    totalBudget: budget,
    totalPlanned,
    totalActual,
    totalPending,
    totalApproved,
    totalPaid,
    remainingBudget,
    budgetUsagePercentage,
    byCategory,
  };
}

// ============================================
// NOTE QUERIES
// ============================================

export const noteListSelect = {
  id: true,
  title: true,
  visibility: true,
  status: true,
  tags: true,
  folder: true,
  isPinned: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: userSelectMin,
  },
} as const;

export const noteFullSelect = {
  id: true,
  title: true,
  content: true,
  visibility: true,
  status: true,
  tags: true,
  folder: true,
  isPinned: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: userSelectMin,
  },
} as const;

// Extract plain text preview from TipTap JSON
export function extractPreviewFromContent(
  content: any,
  maxLength: number = 200
): string {
  if (!content || typeof content !== "object") return "";

  let text = "";

  function extractText(node: any) {
    if (node.text) {
      text += node.text + " ";
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractText);
    }
  }

  extractText(content);

  return text.trim().slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

export const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  isRead: true,
  readAt: true,
  metadata: true,
  createdAt: true,
} as const;

// ============================================
// AUDIT LOG QUERIES
// ============================================

export const auditLogSelect = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  description: true,
  changes: true,
  ipAddress: true,
  createdAt: true,
  user: {
    select: userSelectMin,
  },
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;
