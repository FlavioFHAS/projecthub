import Link from "next/link";
import { FolderX, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FolderX className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">
        Projeto não encontrado
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        O projeto que você está procurando não existe ou você não tem acesso a ele.
      </p>

      <Button asChild>
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para projetos
        </Link>
      </Button>
    </div>
  );
}
