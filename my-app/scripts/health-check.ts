import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface HealthCheckResult {
  name: string;
  status: "ok" | "fail" | "warn";
  detail?: string;
}

async function healthCheck() {
  const checks: HealthCheckResult[] = [];

  // 1. Variáveis de ambiente obrigatórias
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
  ];
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    checks.push({
      name: `ENV: ${envVar}`,
      status: value ? "ok" : "fail",
      detail: value
        ? envVar === "NEXTAUTH_SECRET" && value.length < 32
          ? "NEXTAUTH_SECRET deve ter pelo menos 32 caracteres"
          : undefined
        : `${envVar} não definida`,
    });
  }

  // Verificar comprimento do NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    checks.push({
      name: "ENV: NEXTAUTH_SECRET length",
      status: "fail",
      detail: `NEXTAUTH_SECRET tem ${nextAuthSecret.length} caracteres, mínimo é 32`,
    });
  }

  // 2. Conexão com o banco
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    checks.push({
      name: "Database: Conexão",
      status: responseTime < 200 ? "ok" : "warn",
      detail: `${responseTime}ms`,
    });
  } catch (e) {
    checks.push({
      name: "Database: Conexão",
      status: "fail",
      detail: String(e),
    });
  }

  // 3. Usuário SUPER_ADMIN existe
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    checks.push({
      name: "Database: SUPER_ADMIN",
      status: superAdmin ? "ok" : "warn",
      detail: superAdmin
        ? `Encontrado: ${superAdmin.email}`
        : "Nenhum SUPER_ADMIN encontrado — execute o seed",
    });
  } catch (e) {
    checks.push({
      name: "Database: SUPER_ADMIN",
      status: "fail",
      detail: String(e),
    });
  }

  // 4. Tabelas essenciais existem
  const tables = [
    "User",
    "Project",
    "Task",
    "AuditLog",
    "Notification",
    "SystemSettings",
  ];
  for (const table of tables) {
    try {
      // @ts-ignore
      await prisma[table.toLowerCase()].count();
      checks.push({
        name: `Table: ${table}`,
        status: "ok",
      });
    } catch {
      checks.push({
        name: `Table: ${table}`,
        status: "fail",
        detail: "Tabela não encontrada ou erro de acesso",
      });
    }
  }

  // 5. Configurações do sistema
  try {
    const settings = await prisma.systemSettings.findFirst();
    checks.push({
      name: "Database: SystemSettings",
      status: settings ? "ok" : "warn",
      detail: settings
        ? `Plataforma: ${settings.platformName}`
        : "Configurações padrão não encontradas — execute o seed",
    });
  } catch (e) {
    checks.push({
      name: "Database: SystemSettings",
      status: "fail",
      detail: String(e),
    });
  }

  // Exibir resultado
  console.log("\n🔍 ProjectHub — Health Check\n");

  const statusIcons = {
    ok: "✅",
    warn: "⚠️",
    fail: "❌",
  };

  for (const check of checks) {
    const icon = statusIcons[check.status];
    console.log(
      `${icon} ${check.name}${
        check.detail ? ` — ${check.detail}` : ""
      }`
    );
  }

  const failed = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");

  console.log(
    `\n${checks.length - failed.length}/${checks.length} verificações passaram`
  );

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} aviso(s)`);
  }

  if (failed.length > 0) {
    console.log("\n❌ Corrija os itens acima antes do deploy");
    process.exit(1);
  } else {
    console.log("\n🚀 Tudo certo! Pronto para deploy");
  }
}

healthCheck().finally(() => prisma.$disconnect());
