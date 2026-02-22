"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"

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

interface SearchResponse {
  results: SearchResult[]
  query: string
  total: number
  categories: {
    projects: number
    tasks: number
    clients: number
    users: number
    notes: number
    meetings: number
    proposals: number
  }
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Busca na API
async function searchAPI(query: string, limit = 10): Promise<SearchResponse> {
  if (!query.trim()) {
    return { results: [], query: "", total: 0, categories: { projects: 0, tasks: 0, clients: 0, users: 0, notes: 0, meetings: 0, proposals: 0 } }
  }
  
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  })
  
  const res = await fetch(`/api/search?${params}`)
  if (!res.ok) throw new Error("Search failed")
  return res.json()
}

export function useSearch(debounceMs = 200) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, debounceMs)

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchAPI(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 60000, // Cache results for 1 minute
  })

  const clearSearch = useCallback(() => {
    setQuery("")
  }, [])

  return {
    query,
    setQuery,
    debouncedQuery,
    results: data?.results ?? [],
    categories: data?.categories,
    total: data?.total ?? 0,
    isLoading,
    error,
    clearSearch,
  }
}
