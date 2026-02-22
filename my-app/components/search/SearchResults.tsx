"use client"

import { useRouter } from "next/navigation"
import {
  Folder,
  CheckSquare,
  Building2,
  User,
  FileText,
  Video,
  FileCheck,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Highlight } from "./Highlight"

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: "project" | "task" | "client" | "user" | "note" | "meeting" | "proposal"
  href: string
  icon?: string
  status?: string
  meta?: Record<string, unknown>
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  isLoading: boolean
  onSelect: () => void
}

const iconMap = {
  Folder,
  CheckSquare,
  Building2,
  User,
  FileText,
  Video,
  FileCheck,
}

const typeLabels: Record<string, string> = {
  project: "Projeto",
  task: "Tarefa",
  client: "Cliente",
  user: "Usuário",
  note: "Nota",
  meeting: "Reunião",
  proposal: "Proposta",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500",
  PENDING: "bg-yellow-500/10 text-yellow-500",
  COMPLETED: "bg-blue-500/10 text-blue-500",
  ARCHIVED: "bg-gray-500/10 text-gray-500",
  HIGH: "bg-red-500/10 text-red-500",
  MEDIUM: "bg-yellow-500/10 text-yellow-500",
  LOW: "bg-green-500/10 text-green-500",
  APPROVED: "bg-green-500/10 text-green-500",
  REJECTED: "bg-red-500/10 text-red-500",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-500",
}

export function SearchResults({
  results,
  query,
  isLoading,
  onSelect,
}: SearchResultsProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-lg">🔍</span>
        </div>
        <p className="text-sm font-medium">Nenhum resultado encontrado</p>
        <p className="text-xs mt-1">
          Tente buscar com termos diferentes
        </p>
      </div>
    )
  }

  // Agrupa resultados por tipo
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const typeOrder = ["project", "task", "client", "user", "note", "meeting", "proposal"]

  return (
    <div className="py-2">
      {typeOrder.map((type) => {
        const typeResults = groupedResults[type]
        if (!typeResults || typeResults.length === 0) return null

        return (
          <div key={type} className="mb-2">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {typeLabels[type]}
              <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                {typeResults.length}
              </span>
            </p>
            <div className="space-y-0.5">
              {typeResults.map((result) => {
                const Icon = iconMap[result.icon as keyof typeof iconMap] || Folder
                const statusColor = result.status
                  ? statusColors[result.status]
                  : null

                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      router.push(result.href)
                      onSelect()
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5",
                      "hover:bg-accent hover:text-accent-foreground",
                      "rounded-sm transition-colors text-left"
                    )}
                  >
                    <div className="mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Highlight
                          text={result.title}
                          query={query}
                          className="text-sm font-medium truncate"
                        />
                        {statusColor && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              statusColor
                            )}
                          >
                            {result.status}
                          </span>
                        )}
                      </div>
                      {result.subtitle && (
                        <Highlight
                          text={result.subtitle}
                          query={query}
                          className="text-xs text-muted-foreground truncate block"
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
