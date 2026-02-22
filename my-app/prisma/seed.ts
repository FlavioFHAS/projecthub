import { PrismaClient, Role, ProjectStatus, TaskStatus, TaskPriority } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Usuários ───────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "super@projecthub.com" },
    update: {},
    create: {
      email: "super@projecthub.com",
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      password: await hash("password123", 12),
      jobTitle: "Platform Administrator",
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@projecthub.com" },
    update: {},
    create: {
      email: "admin@projecthub.com",
      name: "Ana Gerente",
      role: Role.ADMIN,
      password: await hash("password123", 12),
      jobTitle: "Project Manager",
      isActive: true,
    },
  });

  const collaborator = await prisma.user.upsert({
    where: { email: "dev@projecthub.com" },
    update: {},
    create: {
      email: "dev@projecthub.com",
      name: "Felipe Desenvolvedor",
      role: Role.COLLABORATOR,
      password: await hash("password123", 12),
      jobTitle: "Senior Developer",
      isActive: true,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@techcorp.com" },
    update: {},
    create: {
      email: "client@techcorp.com",
      name: "João Silva",
      role: Role.CLIENT,
      password: await hash("password123", 12),
      jobTitle: "CTO",
      isActive: true,
    },
  });

  // ─── Configurações do Sistema ────────────────────────
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformName: "ProjectHub",
      allowSelfRegistration: false,
      maintenanceMode: false,
    },
  });

  // ─── Cliente ──────────────────────────────────────────
  const techCorp = await prisma.client.upsert({
    where: { slug: "techcorp" },
    update: {},
    create: {
      name: "TechCorp Ltda",
      slug: "techcorp",
      email: "contato@techcorp.com",
      phone: "+55 11 9999-0000",
      website: "https://techcorp.com",
      adminId: admin.id,
    },
  });

  // ─── Projeto ──────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { slug: "plataforma-ecommerce" },
    update: {},
    create: {
      name: "Plataforma E-commerce",
      slug: "plataforma-ecommerce",
      description: "Desenvolvimento de plataforma de e-commerce B2B",
      status: ProjectStatus.ACTIVE,
      clientId: techCorp.id,
      createdById: admin.id,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-07-31"),
      budget: 180000,
      color: "#6366f1",
      progress: 45,
    },
  });

  // ─── Membros do Projeto ───────────────────────────────
  await prisma.projectMember.createMany({
    skipDuplicates: true,
    data: [
      { projectId: project.id, userId: admin.id, projectRole: "Gerente", isActive: true },
      { projectId: project.id, userId: collaborator.id, projectRole: "Desenvolvedor", isActive: true },
      { projectId: project.id, userId: client.id, projectRole: "Cliente", isActive: true },
    ],
  });

  // ─── Seções padrão ───────────────────────────────────
  const defaultSections = [
    { type: "MEETINGS", name: "Reuniões" },
    { type: "PROPOSALS", name: "Propostas" },
    { type: "GANTT", name: "Cronograma" },
    { type: "TASKS", name: "Tarefas" },
    { type: "TEAM", name: "Equipe" },
    { type: "COSTS", name: "Custos" },
    { type: "NOTES", name: "Notas" },
  ];

  for (let i = 0; i < defaultSections.length; i++) {
    const section = defaultSections[i];
    await prisma.section.upsert({
      where: { 
        projectId_type: { 
          projectId: project.id, 
          type: section.type as any 
        } 
      },
      update: {},
      create: {
        projectId: project.id,
        type: section.type as any,
        name: section.name,
        order: i,
        isArchived: false,
        visibleToRoles: ["SUPER_ADMIN", "ADMIN", "COLLABORATOR", "CLIENT"],
      },
    });
  }

  // ─── Tarefas de exemplo ───────────────────────────────
  const tasks = [
    {
      title: "Configurar ambiente de desenvolvimento",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2024-01-20"),
    },
    {
      title: "Implementar autenticação OAuth",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: new Date("2024-04-30"),
    },
    {
      title: "Desenvolver módulo de pagamentos",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2024-05-31"),
    },
    {
      title: "Criar wireframes da interface",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date("2024-02-15"),
    },
    {
      title: "Configurar CI/CD",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2024-03-15"),
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { 
        projectId_title: { 
          projectId: project.id, 
          title: task.title 
        } 
      },
      update: {},
      create: {
        projectId: project.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdById: admin.id,
      },
    });
  }

  // ─── Notas de exemplo ─────────────────────────────────
  await prisma.note.upsert({
    where: { id: "note-1" },
    update: {},
    create: {
      id: "note-1",
      projectId: project.id,
      title: "Requisitos do Sistema",
      content: "## Requisitos Funcionais\n\n1. Autenticação OAuth\n2. Dashboard de métricas\n3. Gestão de tarefas Kanban\n4. Relatórios financeiros",
      createdById: admin.id,
      isInternal: false,
    },
  });

  // ─── Reunião de exemplo ───────────────────────────────
  await prisma.meeting.upsert({
    where: { id: "meeting-1" },
    update: {},
    create: {
      id: "meeting-1",
      projectId: project.id,
      title: "Kickoff do Projeto",
      description: "Reunião inicial para alinhamento do projeto",
      startTime: new Date("2024-01-15T10:00:00"),
      endTime: new Date("2024-01-15T11:30:00"),
      createdById: admin.id,
      status: "COMPLETED",
    },
  });

  // ─── Logs de Auditoria de exemplo ─────────────────────
  await prisma.auditLog.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: admin.id,
        projectId: project.id,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
        description: "Projeto criado",
      },
      {
        userId: admin.id,
        projectId: project.id,
        action: "CREATE",
        entity: "Task",
        description: "Tarefas iniciais criadas",
      },
      {
        userId: collaborator.id,
        projectId: project.id,
        action: "UPDATE",
        entity: "Task",
        description: "Tarefa atualizada",
      },
    ],
  });

  console.log("✅ Seed concluído!");
  console.log("─────────────────────────────────");
  console.log("📧 super@projecthub.com  → SUPER_ADMIN");
  console.log("📧 admin@projecthub.com  → ADMIN");
  console.log("📧 dev@projecthub.com    → COLLABORATOR");
  console.log("📧 client@techcorp.com   → CLIENT");
  console.log("🔑 Senha de todos: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
