"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, User, Briefcase } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAddMember } from "@/hooks/team/useTeamMembers";
import { cn } from "@/lib/utils";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  availableUsers: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  }[];
}

const roleSuggestions = [
  "Gerente de Projeto",
  "Desenvolvedor",
  "Designer",
  "Analista",
  "QA",
  "DevOps",
  "Consultor",
  "Scrum Master",
];

export function AddMemberModal({
  isOpen,
  onClose,
  projectId,
  availableUsers,
}: AddMemberModalProps) {
  const addMemberMutation = useAddMember(projectId);

  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<(typeof availableUsers)[0] | null>(null);
  const [projectRole, setProjectRole] = useState("");

  // Filter users
  const filteredUsers = availableUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleSelectUser = (user: (typeof availableUsers)[0]) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !projectRole.trim()) return;

    await addMemberMutation.mutateAsync({
      userId: selectedUser.id,
      role: projectRole.trim(),
    });

    // Reset and close
    setStep(1);
    setSelectedUser(null);
    setProjectRole("");
    setSearchQuery("");
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedUser(null);
    setProjectRole("");
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 1 ? "Adicionar Membro" : "Configurar Membro"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          {user.name?.charAt(0).toUpperCase() ||
                            user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.name || "Usuário"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role === "SUPER_ADMIN"
                          ? "Super Admin"
                          : user.role === "ADMIN"
                          ? "Admin"
                          : user.role === "COLLABORATOR"
                          ? "Colaborador"
                          : "Cliente"}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Selected User */}
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.image || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      {selectedUser.name?.charAt(0).toUpperCase() ||
                        selectedUser.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name || "Usuário"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Project Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Papel no projeto *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={projectRole}
                    onChange={(e) => setProjectRole(e.target.value)}
                    placeholder="Ex: Desenvolvedor Frontend"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Como este membro será identificado no projeto
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <Label>Sugestões</Label>
                <div className="flex flex-wrap gap-2">
                  {roleSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setProjectRole(suggestion)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        projectRole === suggestion
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted border-transparent hover:bg-muted/80"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!projectRole.trim() || addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
