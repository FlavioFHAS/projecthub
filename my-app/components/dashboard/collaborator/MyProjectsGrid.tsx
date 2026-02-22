"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";

interface MyProjectsGridProps {
  projects: any[];
}

export function MyProjectsGrid({ projects }: MyProjectsGridProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Meus Projetos</CardTitle>
        <Link href="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ scale: 1.02 }}
              className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Link href={`/projects/${project.id}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: project.color || "#3b82f6" }}
                  >
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.client?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={project.progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {project._count?.tasks || 0} minhas tarefas
                    </Badge>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Você não está em nenhum projeto ativo
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
