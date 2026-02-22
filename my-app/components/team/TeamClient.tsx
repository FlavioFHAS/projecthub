"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTeamMembers, ProjectMember } from "@/hooks/team/useTeamMembers";
import { useProjectId, useProjectRole } from "@/contexts/ProjectContext";
import { MemberCard } from "./MemberCard";
import { AddMemberModal } from "./AddMemberModal";
import { cn } from "@/lib/utils";

interface TeamClientProps {
  initialMembers: ProjectMember[];
  availableUsers: { id: string; name: string | null; email: string; image: string | null; role: string }[];
  projectId: string;
  currentUserId: string;
}

export function TeamClient({
  initialMembers,
  availableUsers,
  projectId,
  currentUserId,
}: TeamClientProps) {
  const { activeMembers, inactiveMembers, allMembers, isLoading } = useTeamMembers(
    projectId,
    initialMembers
  );

  const userRole = useProjectRole();
  const canManageMembers = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Filter members
  const filteredActive = activeMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.user.name?.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  });

  const filteredInactive = inactiveMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.user.name?.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Equipe
            <Badge variant="secondary" className="ml-2">
              {activeMembers.length}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros do projeto
          </p>
        </div>

        {canManageMembers && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Membro
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Active Members */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Membros Ativos ({filteredActive.length})
        </h2>

        {filteredActive.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum membro encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActive.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                canManage={canManageMembers}
                isCurrentUser={member.user.id === currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Inactive Members */}
      {filteredInactive.length > 0 && (
        <section>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 hover:text-foreground transition-colors"
          >
            Inativos ({filteredInactive.length})
            {showInactive ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence>
            {showInactive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInactive.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      canManage={canManageMembers}
                      isCurrentUser={member.user.id === currentUserId}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
        availableUsers={availableUsers}
      />
    </div>
  );
}
