import { ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: string;
  color: string | null;
  coverUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  tags: string[];
  isPublic: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  clientId: string | null;
  client: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  members: ProjectMember[];
  _count: {
    tasks: number;
    members: number;
  };
  tasks: { status: TaskStatus }[];
  progress: number;
}

export interface ProjectMember {
  id: string;
  role: string;
  permissions: any;
  joinedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  createdById: string;
  assignees: TaskAssignee[];
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: string[];
  clientId?: string[];
  tags?: string[];
  search?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface Client {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}
