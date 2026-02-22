"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Plus,
  Moon,
  Sun,
  Command,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationPanel } from "@/components/notifications/NotificationPanel"
import { CommandPalette } from "@/components/search/CommandPalette"
import { useCommandPalette } from "@/hooks/useCommandPalette"
import { signOut } from "next-auth/react"

interface HeaderProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const { isOpen, open, close } = useCommandPalette()

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname.split("/")[1]
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      projects: "Projetos",
      clients: "Clientes",
      team: "Equipe",
      notifications: "Notificações",
      settings: "Configurações",
    }
    return titles[path] || "ProjectHub"
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side - Title and Search */}
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-semibold hidden sm:block">{getPageTitle()}</h1>
            
            {/* Search Trigger */}
            <button
              onClick={open}
              className={cn(
                "relative max-w-md flex-1 hidden md:flex items-center gap-2",
                "h-10 w-full rounded-md border border-input bg-background px-3",
                "text-sm text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />
                <span>K</span>
              </kbd>
            </button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* New Project Button */}
            <Button asChild className="hidden sm:flex">
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Link>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <NotificationPanel />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Configurações</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleSignOut}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </>
  )
}
