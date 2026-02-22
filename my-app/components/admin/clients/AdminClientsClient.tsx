"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Building,
  MoreHorizontal,
  User,
  Archive,
  Trash2,
  ArrowRightLeft,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Client {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  company: string | null
  createdAt: Date
  admin: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  projects: {
    id: string
    status: string
    budget: number | null
  }[]
  _count: {
    projects: number
  }
}

interface Admin {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface AdminClientsClientProps {
  initialClients: Client[]
  admins: Admin[]
}

export function AdminClientsClient({
  initialClients,
  admins,
}: AdminClientsClientProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState("")
  const [clientToReassign, setClientToReassign] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [newAdminId, setNewAdminId] = useState<string>("")

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTotalBudget = (projects: Client["projects"]) =>
    projects.reduce((sum, p) => sum + (p.budget || 0), 0)

  const handleReassign = async () => {
    if (!clientToReassign || !newAdminId) return
    try {
      const res = await fetch(`/api/admin/clients/${clientToReassign.id}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: newAdminId }),
      })
      if (res.ok) {
        const newAdmin = admins.find((a) => a.id === newAdminId)
        setClients(
          clients.map((c) =>
            c.id === clientToReassign.id
              ? { ...c, admin: newAdmin || c.admin }
              : c
          )
        )
        setClientToReassign(null)
        setNewAdminId("")
      }
    } catch (error) {
      console.error("Erro ao reatribuir:", error)
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      const res = await fetch(`/api/admin/clients/${clientToDelete.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setClients(clients.filter((c) => c.id !== clientToDelete.id))
        setClientToDelete(null)
      }
    } catch (error) {
      console.error("Erro ao excluir:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-muted-foreground">
            Gerencie todos os clientes da plataforma
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Admin Responsável</TableHead>
              <TableHead>Projetos</TableHead>
              <TableHead>Orçamento Total</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.company && (
                        <p className="text-sm text-muted-foreground">
                          {client.company}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={client.admin.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {client.admin.name?.charAt(0).toUpperCase() ||
                          client.admin.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{client.admin.name || client.admin.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{client._count.projects}</Badge>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(getTotalBudget(client.projects))}
                </TableCell>
                <TableCell>
                  {format(new Date(client.createdAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setClientToReassign(client)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Reatribuir Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar Cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setClientToDelete(client)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reassign Dialog */}
      <Dialog
        open={!!clientToReassign}
        onOpenChange={() => {
          setClientToReassign(null)
          setNewAdminId("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reatribuir Admin</DialogTitle>
            <DialogDescription>
              Selecione um novo admin responsável para{" "}
              <strong>{clientToReassign?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Select value={newAdminId} onValueChange={setNewAdminId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um admin" />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={admin.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {admin.name?.charAt(0).toUpperCase() ||
                          admin.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {admin.name || admin.email}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClientToReassign(null)
                setNewAdminId("")
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleReassign} disabled={!newAdminId}>
              Reatribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente{" "}
              <strong>{clientToDelete?.name}</strong>?
              {clientToDelete && clientToDelete._count.projects > 0 && (
                <span className="block mt-2 text-destructive">
                  Este cliente possui {clientToDelete._count.projects} projeto(s).
                  Não é possível excluir clientes com projetos ativos.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={clientToDelete ? clientToDelete._count.projects > 0 : false}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
