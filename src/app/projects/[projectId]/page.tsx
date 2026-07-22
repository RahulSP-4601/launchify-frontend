import { ProjectStudioApp } from "@/components/project-studio-app";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectStudioApp projectId={projectId} />;
}
