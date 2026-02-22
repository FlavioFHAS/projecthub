import { prisma } from "@/lib/prisma"
import { Briefcase, Wrench } from "lucide-react"

export default async function MaintenancePage() {
  const settings = await prisma.systemSettings.findFirst({
    select: {
      platformName: true,
      maintenanceMessage: true,
      platformLogo: true,
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        {/* Logo */}
        {settings?.platformLogo ? (
          <img
            src={settings.platformLogo}
            alt="Logo"
            className="h-16 mx-auto mb-8"
          />
        ) : (
          <div className="h-16 w-16 bg-primary rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
        )}

        {/* Icon */}
        <div className="h-24 w-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-12 w-12 text-amber-500 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold mb-3">Sistema em Manutenção</h1>
        <p className="text-muted-foreground">
          {settings?.maintenanceMessage ||
            "Estamos realizando melhorias. Voltamos em breve!"}
        </p>

        {/* Status page link (opcional) */}
        <p className="mt-6 text-sm text-muted-foreground">
          Acompanhe o status em{" "}
          <a href="#" className="text-primary hover:underline">
            status.projecthub.com
          </a>
        </p>
      </div>
    </div>
  )
}
