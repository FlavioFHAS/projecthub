import { prisma } from "@/lib/prisma"
import { AdminSettingsClient } from "@/components/admin/settings/AdminSettingsClient"

const DEFAULT_SETTINGS = {
  id: "default",
  platformName: "ProjectHub",
  platformLogo: null,
  allowSelfRegistration: false,
  maxUsersPerClient: 10,
  maxProjectsPerAdmin: 50,
  notificationsEnabled: true,
  budgetAlertThreshold: 80,
  deadlineAlertDays: 7,
  sessionExpiryHours: 24,
  maxConcurrentSessions: 3,
  auditLogRetentionDays: 90,
  maintenanceMode: false,
  maintenanceMessage: "Sistema em manutenção. Voltamos em breve!",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
}

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSettings.findFirst()

  return <AdminSettingsClient initialSettings={settings || DEFAULT_SETTINGS} />
}
