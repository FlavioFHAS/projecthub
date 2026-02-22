"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardGreeting } from "../shared/DashboardGreeting";
import { ClientProjectCard } from "./ClientProjectCard";
import { ClientMeetingsPanel } from "./ClientMeetingsPanel";
import { ClientProposalsPanel } from "./ClientProposalsPanel";

interface ClientDashboardProps {
  user: any;
  myProjects: any[];
  upcomingMeetings: any[];
  recentProposals: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ClientDashboard({
  user,
  myProjects,
  upcomingMeetings,
  recentProposals,
}: ClientDashboardProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <DashboardGreeting
          user={user}
          summary="Acompanhe o progresso dos seus projetos"
        />
      </motion.div>

      {/* My Projects */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-4">Meus Projetos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.map((project) => (
            <ClientProjectCard key={project.id} project={project} />
          ))}
        </div>

        {myProjects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <p>Você não tem projetos ativos no momento</p>
          </div>
        )}
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ClientMeetingsPanel meetings={upcomingMeetings} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ClientProposalsPanel proposals={recentProposals} />
        </motion.div>
      </div>
    </motion.div>
  );
}
