"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BoardHeaderProps {
  totalProjects: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onSearch: (query: string) => void;
  onFilterOpen: () => void;
  onCreateClick: () => void;
  activeFiltersCount: number;
  searchQuery: string;
  canCreate: boolean;
}

export function BoardHeader({
  totalProjects,
  viewMode,
  onViewModeChange,
  onSearch,
  onFilterOpen,
  onCreateClick,
  activeFiltersCount,
  searchQuery,
  canCreate,
}: BoardHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value);
    },
    [onSearch]
  );

  const clearSearch = useCallback(() => {
    onSearch("");
    searchInputRef.current?.focus();
  }, [onSearch]);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
            <Badge variant="secondary" className="h-6">
              {totalProjects} ativo{totalProjects !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Mobile: Create button */}
          {canCreate && (
            <Button
              onClick={onCreateClick}
              className="sm:hidden w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>F
            </kbd>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterOpen}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* View Toggle */}
            <div className="flex items-center border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => onViewModeChange("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>

            {/* Create Button (Desktop) */}
            {canCreate && (
              <Button
                onClick={onCreateClick}
                className="hidden sm:flex"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
