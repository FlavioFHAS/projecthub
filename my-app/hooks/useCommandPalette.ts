"use client"

import { useState, useEffect, useCallback } from "react"

interface UseCommandPaletteOptions {
  shortcut?: string
  onOpen?: () => void
  onClose?: () => void
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const { shortcut = "k", onOpen, onClose } = options
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) onOpen?.()
      else onClose?.()
      return next
    })
  }, [onOpen, onClose])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault()
        toggle()
      }

      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        close()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcut, isOpen, toggle, close])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}

// Hook for navigation shortcuts
export function useNavigationShortcuts() {
  const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null

  useEffect(() => {
    if (!router) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // G + H = Home
      if (e.key.toLowerCase() === "h" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const lastKey = sessionStorage.getItem("lastKey")
        if (lastKey === "g") {
          e.preventDefault()
          router.push("/")
        }
        sessionStorage.setItem("lastKey", "h")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }

      // G + D = Dashboard
      if (e.key.toLowerCase() === "d" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const lastKey = sessionStorage.getItem("lastKey")
        if (lastKey === "g") {
          e.preventDefault()
          router.push("/dashboard")
        }
        sessionStorage.setItem("lastKey", "d")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }

      // G + P = Projects
      if (e.key.toLowerCase() === "p" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const lastKey = sessionStorage.getItem("lastKey")
        if (lastKey === "g") {
          e.preventDefault()
          router.push("/projects")
        }
        sessionStorage.setItem("lastKey", "p")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }

      // G + T = Tasks
      if (e.key.toLowerCase() === "t" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const lastKey = sessionStorage.getItem("lastKey")
        if (lastKey === "g") {
          e.preventDefault()
          router.push("/tasks")
        }
        sessionStorage.setItem("lastKey", "t")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }

      // G + S = Settings
      if (e.key.toLowerCase() === "s" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const lastKey = sessionStorage.getItem("lastKey")
        if (lastKey === "g") {
          e.preventDefault()
          router.push("/settings")
        }
        sessionStorage.setItem("lastKey", "s")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }

      // Track "g" key
      if (e.key.toLowerCase() === "g" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        sessionStorage.setItem("lastKey", "g")
        setTimeout(() => sessionStorage.removeItem("lastKey"), 500)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [router])
}
