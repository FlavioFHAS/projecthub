"use client"

import { cn } from "@/lib/utils"

interface HighlightProps {
  text: string
  query: string
  className?: string
  highlightClassName?: string
}

export function Highlight({
  text,
  query,
  className,
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900/50 font-medium",
}: HighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>
  }

  // Escape caracteres especiais do regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escapedQuery})`, "gi")
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === query.toLowerCase()
        return isMatch ? (
          <mark
            key={index}
            className={cn(
              "rounded px-0.5",
              highlightClassName
            )}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}
