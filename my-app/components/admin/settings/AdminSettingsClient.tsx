"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Save,
  Globe,
  Users,
  Bell,
  Shield,
  Wrench,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SystemSettings {
  id: string
  platformName: string
  platformLogo: string | null
  allowSelfRegistration: boolean
  maxUsersPerClient: number
  maxProjectsPerAdmin: number
  notificationsEnabled: boolean
  budgetAlertThreshold: number
  deadlineAlertDays: number
  sessionExpiryHours: number
  maxConcurrentSessions: number
  auditLogRetentionDays: number
  maintenanceMode: boolean
  maintenanceMessage: string
  timezone: string
  language: string
}

interface AdminSettingsClientProps {
  initialSettings: SystemSettings
}

export function AdminSettingsClient({
  initialSettings,
}: AdminSettingsClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success("Configurações salvas com sucesso!")
        router.refresh()
      } else {
        toast.error("Erro ao salvar configurações")
      }
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações da Plataforma</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            Manutenção
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Nome da Plataforma</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) =>
                    updateSetting("platformName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário Padrão</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(v) => updateSetting("timezone", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">
                      América/São Paulo (GMT-3)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      América/Nova York (GMT-5)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Europa/Londres (GMT+0)
                    </SelectItem>
                    <SelectItem value="Europe/Paris">
                      Europa/Paris (GMT+1)
                    </SelectItem>
                    <SelectItem value="Asia/Tokyo">
                      Ásia/Tóquio (GMT+9)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma Padrão</Label>
                <Select
                  value={settings.language}
                  onValueChange={(v) => updateSetting("language", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Usuários</CardTitle>
              <CardDescription>
                Controle o comportamento de cadastro e limites de usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Permitir Auto-cadastro</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem criar contas sem convite
                  </p>
                </div>
                <Switch
                  checked={settings.allowSelfRegistration}
                  onCheckedChange={(v) =>
                    updateSetting("allowSelfRegistration", v)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Limite de Usuários por Cliente</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.maxUsersPerClient]}
                    onValueChange={([v]) =>
                      updateSetting("maxUsersPerClient", v)
                    }
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">
                    {settings.maxUsersPerClient}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Limite de Projetos por Admin</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.maxProjectsPerAdmin]}
                    onValueChange={([v]) =>
                      updateSetting("maxProjectsPerAdmin", v)
                    }
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">
                    {settings.maxProjectsPerAdmin}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure os alertas e notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações Habilitadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch para todas as notificações
                  </p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(v) =>
                    updateSetting("notificationsEnabled", v)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Alerta de Orçamento (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.budgetAlertThreshold]}
                    onValueChange={([v]) =>
                      updateSetting("budgetAlertThreshold", v)
                    }
                    min={50}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">
                    {settings.budgetAlertThreshold}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadlineAlertDays">
                  Alerta de Deadline (dias antes)
                </Label>
                <Select
                  value={String(settings.deadlineAlertDays)}
                  onValueChange={(v) =>
                    updateSetting("deadlineAlertDays", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure sessões e retenção de logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sessionExpiryHours">
                  Expiração de Sessão
                </Label>
                <Select
                  value={String(settings.sessionExpiryHours)}
                  onValueChange={(v) =>
                    updateSetting("sessionExpiryHours", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="8">8 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="168">7 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Máximo de Sessões Simultâneas</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.maxConcurrentSessions]}
                    onValueChange={([v]) =>
                      updateSetting("maxConcurrentSessions", v)
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right">
                    {settings.maxConcurrentSessions}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auditLogRetentionDays">
                  Retenção de Logs de Auditoria
                </Label>
                <Select
                  value={String(settings.auditLogRetentionDays)}
                  onValueChange={(v) =>
                    updateSetting("auditLogRetentionDays", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="180">180 dias</SelectItem>
                    <SelectItem value="365">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modo de Manutenção</CardTitle>
              <CardDescription>
                Controle o acesso à plataforma durante manutenções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Modo Manutenção
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Bloqueia o acesso para todos exceto SUPER_ADMIN
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(v) => {
                    if (v) {
                      setShowMaintenanceDialog(true)
                    } else {
                      updateSetting("maintenanceMode", false)
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">
                  Mensagem de Manutenção
                </Label>
                <textarea
                  id="maintenanceMessage"
                  value={settings.maintenanceMessage}
                  onChange={(e) =>
                    updateSetting("maintenanceMessage", e.target.value)
                  }
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-y"
                  placeholder="Mensagem exibida aos usuários durante a manutenção"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Ativar Modo Manutenção
            </DialogTitle>
            <DialogDescription>
              Isso bloqueará o acesso de todos os usuários exceto SUPER_ADMIN.
              Eles serão redirecionados para a página de manutenção.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateSetting("maintenanceMode", true)
                setShowMaintenanceDialog(false)
              }}
            >
              Ativar Manutenção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
