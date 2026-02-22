"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  CheckSquare,
  Calendar,
  FileCheck,
  AlertTriangle,
  Smartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: React.ElementType
  email: boolean
  push: boolean
  inApp: boolean
}

const defaultSettings: NotificationSetting[] = [
  {
    id: "task_assigned",
    label: "Tarefas atribuídas",
    description: "Quando uma nova tarefa é atribuída a você",
    icon: CheckSquare,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "task_completed",
    label: "Tarefas concluídas",
    description: "Quando uma tarefa é marcada como concluída",
    icon: CheckSquare,
    email: false,
    push: true,
    inApp: true,
  },
  {
    id: "task_comment",
    label: "Comentários em tarefas",
    description: "Quando alguém comenta em uma tarefa sua",
    icon: MessageSquare,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "meeting_scheduled",
    label: "Reuniões agendadas",
    description: "Quando uma nova reunião é agendada",
    icon: Calendar,
    email: true,
    push: true,
    inApp: true,
  },
  {
    id: "proposal_status",
    label: "Status de propostas",
    description: "Quando uma proposta é aprovada ou rejeitada",
    icon: FileCheck,
    email: true,
    push: false,
    inApp: true,
  },
  {
    id: "cost_alert",
    label: "Alertas de custo",
    description: "Quando um projeto ultrapassa o orçamento",
    icon: AlertTriangle,
    email: true,
    push: true,
    inApp: true,
  },
]

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState(defaultSettings)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)

  const updateSetting = (
    id: string,
    channel: "email" | "push" | "inApp",
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [channel]: value } : s))
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </h1>
              <p className="text-sm text-muted-foreground">
                Personalize como você recebe notificações
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Geral */}
        <Card>
          <CardHeader>
            <CardTitle>Geral</CardTitle>
            <CardDescription>
              Configurações gerais de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Som de notificação</p>
                  <p className="text-sm text-muted-foreground">
                    Tocar som quando receber uma nova notificação
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Resumo diário por email</p>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo diário das suas notificações
                  </p>
                </div>
              </div>
              <Switch
                checked={emailDigest}
                onCheckedChange={setEmailDigest}
              />
            </div>
          </CardContent>
        </Card>

        {/* Canais */}
        <Card>
          <CardHeader>
            <CardTitle>Canais de Notificação</CardTitle>
            <CardDescription>
              Escolha como deseja ser notificado para cada tipo de evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center text-sm font-medium text-muted-foreground">
                <span>Evento</span>
                <span className="w-16 text-center flex items-center justify-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="sr-only">Email</span>
                </span>
                <span className="w-16 text-center flex items-center justify-center gap-1">
                  <Smartphone className="h-4 w-4" />
                  <span className="sr-only">Push</span>
                </span>
                <span className="w-16 text-center flex items-center justify-center gap-1">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">In-App</span>
                </span>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center"
                  >
                    <div className="flex items-center gap-3">
                      <setting.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <div className="w-16 flex justify-center">
                      <Switch
                        checked={setting.email}
                        onCheckedChange={(v) =>
                          updateSetting(setting.id, "email", v)
                        }
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <Switch
                        checked={setting.push}
                        onCheckedChange={(v) =>
                          updateSetting(setting.id, "push", v)
                        }
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <Switch
                        checked={setting.inApp}
                        onCheckedChange={(v) =>
                          updateSetting(setting.id, "inApp", v)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={() => {
            // TODO: Save settings to API
            router.back()
          }}>
            Salvar Alterações
          </Button>
        </div>
      </main>
    </div>
  )
}
