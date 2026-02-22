"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Users,
  LayoutGrid,
  Shield,
  AlertTriangle,
  Archive,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProject, useProjectId, useCurrentMember } from "@/contexts/ProjectContext";
import { canManageProject, canDeleteProject, canArchiveProject } from "@/lib/permissions";
import { apiClient } from "@/lib/api-client";
import { DestructiveConfirmDialog } from "@/components/shared/DestructiveConfirmDialog";

export default function ProjectSettingsPage() {
  const router = useRouter();
  const projectId = useProjectId();
  const { project, userRole } = useProject();
  const currentMember = useCurrentMember();
  
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = canManageProject(userRole);
  const canDelete = canDeleteProject(userRole);
  const canArchive = canArchiveProject(userRole);

  // Redirect if user doesn't have permission
  if (!canManage) {
    router.push(`/projects/${projectId}`);
    return null;
  }

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await apiClient.patch(`/projects/${projectId}`, { status: "ARCHIVED" });
      toast.success("Projeto arquivado com sucesso");
      router.push("/projects");
    } catch {
      toast.error("Erro ao arquivar projeto");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success("Projeto excluído com sucesso");
      router.push("/projects");
    } catch {
      toast.error("Erro ao excluir projeto");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Projeto</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações e permissões do projeto
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Seções
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Perigo
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general">
          <GeneralSettings project={project} />
        </TabsContent>

        {/* Aba Seções */}
        <TabsContent value="sections">
          <SectionsSettings />
        </TabsContent>

        {/* Aba Membros */}
        <TabsContent value="members">
          <MembersSettings />
        </TabsContent>

        {/* Aba Permissões */}
        <TabsContent value="permissions">
          <PermissionsSettings />
        </TabsContent>

        {/* Aba Perigo */}
        <TabsContent value="danger">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Ações Destrutivas
              </CardTitle>
              <CardDescription>
                Estas ações não podem ser desfeitas. Tenha certeza antes de prosseguir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canArchive && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      Arquivar Projeto
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      O projeto será arquivado e não aparecerá na lista principal.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsArchiveDialogOpen(true)}
                  >
                    Arquivar
                  </Button>
                </div>
              )}

              {canDelete && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Excluir Projeto
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todos os dados do projeto serão permanentemente excluídos.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Excluir
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DestructiveConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleArchive}
        isLoading={isLoading}
        title="Arquivar Projeto"
        description="Tem certeza que deseja arquivar este projeto? Ele não aparecerá mais na lista principal, mas poderá ser restaurado posteriormente."
        confirmText={project.name}
        confirmLabel="Arquivar"
        variant="warning"
      />

      <DestructiveConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        title="Excluir Projeto"
        description="Esta ação não pode ser desfeita. Todos os dados do projeto, incluindo tarefas, reuniões, notas e membros serão permanentemente excluídos."
        confirmText={project.name}
        confirmLabel="Excluir Permanentemente"
        variant="danger"
      />
    </motion.div>
  );
}

// Sub-components for each tab
function GeneralSettings({ project }: { project: any }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const projectId = useProjectId();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch(`/projects/${projectId}`, {
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("Configurações salvas");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Gerais</CardTitle>
        <CardDescription>
          Configure as informações básicas do projeto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SectionsSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Seções</CardTitle>
        <CardDescription>
          Configure a visibilidade e ordem das seções do projeto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento...
        </p>
      </CardContent>
    </Card>
  );
}

function MembersSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros do Projeto</CardTitle>
        <CardDescription>
          Gerencie os membros e suas permissões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento...
        </p>
      </CardContent>
    </Card>
  );
}

function PermissionsSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões por Papel</CardTitle>
        <CardDescription>
          Configure quais roles podem acessar cada seção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento...
        </p>
      </CardContent>
    </Card>
  );
}
