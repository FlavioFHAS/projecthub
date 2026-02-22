"use client";

import { motion } from "framer-motion";
import { StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <StickyNote className="h-6 w-6" />
            Notas
          </h1>
          <p className="text-muted-foreground">
            Anotações e documentação do projeto
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Nota
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma nota</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          As notas do projeto aparecerão aqui. Crie sua primeira nota.
        </p>
      </div>
    </motion.div>
  );
}
