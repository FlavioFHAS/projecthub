import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import {
  SectionType,
  getSectionDefinition,
  getSectionTypeFromUrl,
  canViewSection,
} from "@/lib/sections/section-registry";
import { checkProjectPermissions } from "@/lib/permissions";

// Import section components
import { LinksPage } from "@/components/sections/links/LinksPage";
import { DocumentsPage } from "@/components/sections/documents/DocumentsPage";
import { RisksPage } from "@/components/sections/risks/RisksPage";
import { FeedbackPage } from "@/components/sections/feedback/FeedbackPage";
import { ReportsPage } from "@/components/sections/reports/ReportsPage";
import { CustomSectionPage } from "@/components/sections/custom/CustomSectionPage";

// Map section types to components
const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  LINKS: LinksPage,
  DOCUMENTS: DocumentsPage,
  RISKS: RisksPage,
  FEEDBACK: FeedbackPage,
  REPORTS: ReportsPage,
  CUSTOM: CustomSectionPage,
};

interface DynamicSectionPageProps {
  params: { projectId: string; sectionId: string };
}

async function getSection(projectId: string, sectionId: string) {
  // Try to find by ID first
  let section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      projectId,
    },
  });

  // If not found, try to find by type/slug
  if (!section) {
    const sectionType = getSectionTypeFromUrl(sectionId);
    if (sectionType) {
      section = await prisma.section.findFirst({
        where: {
          type: sectionType,
          projectId,
        },
      });
    }
  }

  return section;
}

export async function generateMetadata({
  params,
}: DynamicSectionPageProps): Promise<Metadata> {
  const section = await getSection(params.projectId, params.sectionId);

  if (!section) {
    return { title: "Seção não encontrada" };
  }

  const definition = getSectionDefinition(section.type as SectionType);

  return {
    title: `${definition.name}`,
    description: definition.description,
  };
}

export default async function DynamicSectionPage({
  params,
}: DynamicSectionPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { canView } = await checkProjectPermissions(
    params.projectId,
    session.user.id
  );

  if (!canView) {
    notFound();
  }

  const section = await getSection(params.projectId, params.sectionId);

  if (!section) {
    notFound();
  }

  // Check visibility for user role
  const userRole = session.user.role as any;
  const visibleToRoles = (section.visibleToRoles as any[]) || [];

  if (!canViewSection(section.type as SectionType, userRole, visibleToRoles)) {
    redirect(`/projects/${params.projectId}`);
  }

  const SectionComponent = SECTION_COMPONENTS[section.type];

  if (!SectionComponent) {
    notFound();
  }

  const canEdit = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  return (
    <div className="space-y-6">
      <SectionComponent
        projectId={params.projectId}
        section={{
          ...section,
          config: (section.config as Record<string, unknown>) || {},
        }}
        userRole={userRole}
        canEdit={canEdit}
      />
    </div>
  );
}
