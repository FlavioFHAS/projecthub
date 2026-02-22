"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface ClientProposalsPanelProps {
  proposals: any[];
}

export function ClientProposalsPanel({ proposals }: ClientProposalsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Propostas Aprovadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{proposal.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {proposal.project?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aprovada em{" "}
                    {format(new Date(proposal.updatedAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <Link href={`/projects/${proposal.projectId}/proposals`}>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          ))}

          {proposals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p>Nenhuma proposta aprovada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
