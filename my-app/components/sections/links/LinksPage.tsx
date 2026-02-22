"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Link,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Plus,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionHeader } from "@/components/sections/shared/SectionHeader";
import { SectionEmptyState } from "@/components/sections/shared/SectionEmptyState";
import { SectionSkeleton } from "@/components/sections/shared/SectionSkeleton";
import { useSectionConfig } from "@/hooks/sections/useSectionConfig";
import { LinksConfig, LinkItem, getFaviconUrl } from "@/lib/sections/section-config";
import { generateConfigItemId } from "@/lib/sections/section-config";
import { toast } from "sonner";
import { AddLinkModal } from "./AddLinkModal";
import { cn } from "@/lib/utils";

interface LinksPageProps {
  projectId: string;
  section: {
    id: string;
    config: LinksConfig;
  };
  userRole: string;
  canEdit: boolean;
}

export function LinksPage({ projectId, section, userRole, canEdit }: LinksPageProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  const { config, isLoading, isUpdating, addItem, updateItem, removeItem } =
    useSectionConfig<LinksConfig>({
      projectId,
      sectionId: section.id,
      initialConfig: section.config,
    });

  const links = config?.links || [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    links.forEach((link) => cats.add(link.category || "Sem categoria"));
    return Array.from(cats).sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesCategory = !selectedCategory || link.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [links, selectedCategory, searchQuery]);

  const linksByCategory = useMemo(() => {
    const grouped: Record<string, LinkItem[]> = {};
    filteredLinks.forEach((link) => {
      const cat = link.category || "Sem categoria";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(link);
    });
    return grouped;
  }, [filteredLinks]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para a área de transferência");
  };

  const handleDelete = (linkId: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      removeItem("links", linkId);
    }
  };

  const togglePasswordReveal = (linkId: string) => {
    setRevealedPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) {
        next.delete(linkId);
      } else {
        next.add(linkId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <SectionSkeleton type="list" count={6} />;
  }

  if (links.length === 0 && !searchQuery) {
    return (
      <SectionEmptyState
        sectionType="LINKS"
        canCreate={canEdit}
        onAction={() => setIsAddModalOpen(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Links & Recursos"
        count={links.length}
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        actions={
          canEdit && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          )
        }
        filters={
          categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                Todas
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )
        }
      />

      <div className="space-y-6">
        {Object.entries(linksByCategory).map(([category, categoryLinks]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {category} ({categoryLinks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryLinks.map((link) => (
                <div
                  key={link.id}
                  className="group flex items-start gap-3 p-3 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <img
                    src={getFaviconUrl(link.url)}
                    alt=""
                    className="w-6 h-6 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/favicon.ico";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary truncate"
                      >
                        {link.title}
                      </a>
                      {link.username && (
                        <Lock className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {link.url}
                    </p>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {link.description}
                      </p>
                    )}
                    {link.username && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-muted-foreground">Usuário: {link.username}</span>
                        {link.password && (
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">Senha:</span>
                            <code className="bg-muted px-1 rounded">
                              {revealedPasswords.has(link.id) ? link.password : "••••••"}
                            </code>
                            <button
                              onClick={() => togglePasswordReveal(link.id)}
                              className="text-primary hover:underline"
                            >
                              {revealedPasswords.has(link.id) ? "Ocultar" : "Revelar"}
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyUrl(link.url)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingLink(link)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(link.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AddLinkModal
        isOpen={isAddModalOpen || !!editingLink}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLink(null);
        }}
        onSubmit={(link) => {
          if (editingLink) {
            updateItem("links", editingLink.id, link);
          } else {
            addItem("links", { ...link, id: generateConfigItemId() });
          }
          setIsAddModalOpen(false);
          setEditingLink(null);
        }}
        initialData={editingLink}
        existingCategories={categories}
      />
    </div>
  );
}
