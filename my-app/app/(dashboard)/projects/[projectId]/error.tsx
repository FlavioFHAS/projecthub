"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProjectErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Project error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">
        Algo deu errado
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Não foi possível carregar esta seção do projeto. 
        Isso pode ser um erro temporário.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para projetos
          </Link>
        </Button>
        
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>

      {error.digest && (
        <p className="text-xs text-muted-foreground mt-8">
          Código do erro: {error.digest}
        </p>
      )}
    </div>
  );
}
