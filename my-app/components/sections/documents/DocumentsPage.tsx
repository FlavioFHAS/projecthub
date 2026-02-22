"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  MoreHorizontal,
  Plus,
  Grid3X3,
  List,
  Search,
  ChevronRight,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SectionHeader } from "@/components/sections/shared/SectionHeader";
import { SectionEmptyState } from "@/components/sections/shared/SectionEmptyState";
import { SectionSkeleton } from "@/components/sections/shared/SectionSkeleton";
import { useSectionConfig } from "@/hooks/sections/useSectionConfig";
import {
  DocumentsConfig,
  FolderItem,
  DocumentItem,
  FileType,
  detectFileType,
  getFileTypeConfig,
  generateConfigItemId,
} from "@/lib/sections/section-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddDocumentModal } from "./AddDocumentModal";
import { AddFolderModal } from "./AddFolderModal";

interface DocumentsPageProps {
  projectId: string;
  section: {
    id: string;
    config: DocumentsConfig;
  };
  userRole: string;
  canEdit: boolean;
}

export function DocumentsPage({ projectId, section, userRole, canEdit }: DocumentsPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  const { config, isLoading, addItem, updateItem, removeItem } =
    useSectionConfig<DocumentsConfig>({
      projectId,
      sectionId: section.id,
      initialConfig: section.config,
    });

  const folders = config?.folders || [];
  const documents = config?.documents || [];

  const currentFolder = useMemo(() => {
    return folders.find((f) => f.id === currentFolderId);
  }, [folders, currentFolderId]);

  const folderPath = useMemo(() => {
    const path: FolderItem[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = folders.find((f) => f.id === current?.parentId);
    }
    return path;
  }, [currentFolder, folders]);

  const filteredItems = useMemo(() => {
    const subFolders = folders.filter(
      (f) => f.parentId === currentFolderId && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const folderDocs = documents.filter(
      (d) =>
        d.folderId === currentFolderId &&
        (!searchQuery ||
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    return { folders: subFolders, documents: folderDocs };
  }, [folders, documents, currentFolderId, searchQuery]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada para a área de transferência");
  };

  const handleDeleteDoc = (docId: string) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      removeItem("documents", docId);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    const hasChildren = folders.some((f) => f.parentId === folderId) || documents.some((d) => d.folderId === folderId);
    if (hasChildren) {
      toast.error("Não é possível excluir uma pasta que contém itens");
      return;
    }
    if (confirm("Tem certeza que deseja excluir esta pasta?")) {
      removeItem("folders", folderId);
    }
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case "PDF":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "DOCX":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "XLSX":
        return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
      case "PPTX":
        return <Presentation className="w-8 h-8 text-orange-500" />;
      case "IMAGE":
        return <Image className="w-8 h-8 text-purple-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <SectionSkeleton type={viewMode} count={8} />;
  }

  if (folders.length === 0 && documents.length === 0 && !searchQuery) {
    return (
      <SectionEmptyState
        sectionType="DOCUMENTS"
        canCreate={canEdit}
        onAction={() => setIsAddFolderModalOpen(true)}
      />
    );
  }

  const totalItems = filteredItems.folders.length + filteredItems.documents.length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Documentos"
        count={totalItems}
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => setIsAddFolderModalOpen(true)}>
                  <Folder className="w-4 h-4 mr-2" />
                  Nova Pasta
                </Button>
                <Button onClick={() => setIsAddDocModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </>
            )}
          </div>
        }
      />

      {currentFolderId && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => setCurrentFolderId(null)}
                className="cursor-pointer"
              >
                Documentos
              </BreadcrumbLink>
            </BreadcrumbItem>
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === folderPath.length - 1 ? (
                    <span className="font-medium">{folder.name}</span>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="cursor-pointer"
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.folders.map((folder) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative flex flex-col items-center p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <FolderOpen className="w-12 h-12 text-amber-500 mb-2" />
              <span className="text-sm font-medium text-center truncate w-full">
                {folder.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {folders.filter((f) => f.parentId === folder.id).length +
                  documents.filter((d) => d.folderId === folder.id).length}{" "}
                itens
              </span>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </motion.div>
          ))}

          {filteredItems.documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative flex flex-col items-center p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {getFileIcon(doc.type)}
              <span className="text-sm font-medium text-center truncate w-full mt-2">
                {doc.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {getFileTypeConfig(doc.type).label}
              </span>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyUrl(doc.url)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingDoc(doc)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Adicionado por</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.folders.map((folder) => (
                <tr
                  key={folder.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">{folder.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">Pasta</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.type)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {getFileTypeConfig(doc.type).label}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {doc.addedByName || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(doc.addedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(doc.url)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingDoc(doc)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={() => setIsAddFolderModalOpen(false)}
        onSubmit={(folder) => {
          addItem("folders", { ...folder, id: generateConfigItemId() });
          setIsAddFolderModalOpen(false);
        }}
        parentId={currentFolderId}
      />

      <AddDocumentModal
        isOpen={isAddDocModalOpen || !!editingDoc}
        onClose={() => {
          setIsAddDocModalOpen(false);
          setEditingDoc(null);
        }}
        onSubmit={(doc) => {
          if (editingDoc) {
            updateItem("documents", editingDoc.id, doc);
          } else {
            addItem("documents", { ...doc, id: generateConfigItemId() });
          }
          setIsAddDocModalOpen(false);
          setEditingDoc(null);
        }}
        initialData={editingDoc}
        folders={folders}
        currentFolderId={currentFolderId}
      />
    </div>
  );
}
