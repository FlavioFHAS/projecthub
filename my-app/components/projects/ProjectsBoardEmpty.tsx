"use client";

import { motion } from "framer-motion";
import { FolderOpen, SearchX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectsBoardEmptyProps {
  hasFilters: boolean;
  canCreate: boolean;
  onClearFilters: () => void;
  onCreateClick: () => void;
}

export function ProjectsBoardEmpty({
  hasFilters,
  canCreate,
  onClearFilters,
  onCreateClick,
}: ProjectsBoardEmptyProps) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Tente ajustar os filtros ou limpar a busca para ver mais resultados.
        </p>
        <Button onClick={onClearFilters} variant="outline">
          Limpar filtros
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        <FolderOpen className="h-10 w-10 text-muted-foreground" />
      </motion.div>

      <h3 className="text-lg font-semibold mb-2">Nenhum projeto ainda</h3>

      <p className="text-muted-foreground max-w-sm mb-6">
        {canCreate
          ? "Crie seu primeiro projeto para começar a gerenciar seus trabalhos."
          : "Você ainda não foi adicionado a nenhum projeto. Entre em contato com um administrador."}
      </p>

      {canCreate && (
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Criar primeiro projeto
        </Button>
      )}
    </motion.div>
  );
}
