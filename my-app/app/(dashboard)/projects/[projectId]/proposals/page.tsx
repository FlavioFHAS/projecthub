"use client";

import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProposalsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Propostas
          </h1>
          <p className="text-muted-foreground">
            Gerencie as propostas do projeto
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma proposta</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          As propostas do projeto aparecerão aqui.
        </p>
      </div>
    </motion.div>
  );
}
