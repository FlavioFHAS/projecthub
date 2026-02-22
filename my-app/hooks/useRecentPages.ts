"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "projecthub:recent-pages"
const MAX_RECENT_PAGES = 5

interface RecentPage {
  id: string
  title: string
  href: string
  type: string
  timestamp: number
}

interface UseRecentPagesReturn {
  recentPages: RecentPage[]
  addRecentPage: (page: Omit<RecentPage, "timestamp">) => void
  clearRecentPages: () => void
}

export function useRecentPages(): UseRecentPagesReturn {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentPage[]
        // Filter out pages older than 7 days
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const validPages = parsed.filter((p) => p.timestamp > oneWeekAgo)
        setRecentPages(validPages)
      }
    } catch (error) {
      console.error("Erro ao carregar páginas recentes:", error)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when recentPages changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentPages))
      } catch (error) {
        console.error("Erro ao salvar páginas recentes:", error)
      }
    }
  }, [recentPages, isHydrated])

  const addRecentPage = useCallback(
    (page: Omit<RecentPage, "timestamp">) => {
      setRecentPages((prev) => {
        // Remove existing entry with same id
        const filtered = prev.filter((p) => p.id !== page.id)

        // Add new page at the beginning
        const newPage: RecentPage = {
          ...page,
          timestamp: Date.now(),
        }

        // Keep only MAX_RECENT_PAGES
        return [newPage, ...filtered].slice(0, MAX_RECENT_PAGES)
      })
    },
    []
  )

  const clearRecentPages = useCallback(() => {
    setRecentPages([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Erro ao limpar páginas recentes:", error)
    }
  }, [])

  return {
    recentPages,
    addRecentPage,
    clearRecentPages,
  }
}
