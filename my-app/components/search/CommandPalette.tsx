"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Clock, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSearch } from "@/hooks/useSearch"
import { useRecentPages } from "@/hooks/useRecentPages"
import { SearchResults } from "./SearchResults"
import { QuickActions } from "./QuickActions"
import { Highlight } from "./Highlight"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const { query, setQuery, results, isLoading, clearSearch } = useSearch(200)
  const { recentPages, addRecentPage, clearRecentPages } = useRecentPages()

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, results])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query ? results : recentPages
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % items.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case "Enter":
          e.preventDefault()
          if (items[selectedIndex]) {
            const item = items[selectedIndex]
            router.push(item.href || item.link)
            addRecentPage({
              id: item.id,
              title: item.title,
              href: item.href || item.link,
              type: item.type,
            })
            onClose()
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    },
    [query, results, recentPages, selectedIndex, router, addRecentPage, onClose]
  )

  const handleClose = () => {
    clearSearch()
    onClose()
  }

  const hasResults = results.length > 0
  const hasRecentPages = recentPages.length > 0
  const showRecentPages = !query && hasRecentPages
  const showQuickActions = !query
  const showResults = query && hasResults
  const showEmpty = query && !hasResults && !isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 gap-0 max-w-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Busca Global</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar projetos, tarefas, clientes, notas..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 rounded hover:bg-accent"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-7 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[60vh]">
          {/* Recent Pages */}
          {showRecentPages && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Páginas Recentes
                </p>
                <button
                  onClick={clearRecentPages}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              </div>
              <div className="space-y-0.5">
                {recentPages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      router.push(page.href)
                      onClose()
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2",
                      "hover:bg-accent hover:text-accent-foreground",
                      "rounded-sm transition-colors text-left",
                      selectedIndex === index && "bg-accent"
                    )}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{page.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {page.type}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && <QuickActions onSelect={onClose} />}

          {/* Search Results */}
          {showResults && (
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              onSelect={onClose}
            />
          )}

          {/* Empty State */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">Nenhum resultado encontrado</p>
              <p className="text-xs mt-1 text-center max-w-xs">
                Tente buscar com termos diferentes ou verifique a ortografia
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="h-5 items-center gap-1 rounded border bg-background px-1 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="h-5 items-center gap-1 rounded border bg-background px-1 font-mono text-[10px]">
                ↓
              </kbd>
              <span className="ml-1">navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="h-5 items-center gap-1 rounded border bg-background px-1 font-mono text-[10px]">
                ↵
              </kbd>
              <span className="ml-1">selecionar</span>
            </span>
          </div>
          {results.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {results.length} resultado{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
