"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  createProject,
  fetchProject,
  fetchProjects,
  fetchTranscript,
  isAuthenticationError,
  updatePhaseFour,
  updateProject,
  uploadProjectVideo,
} from "@/lib/api";
import { DashboardSection, HomePanel, useDashboardStore } from "@/lib/dashboard-store";
import {
  overlayFromProject,
  shouldSyncUploadOverlay,
  uploadOverlayForFailure,
  uploadOverlayForFile,
} from "@/lib/upload-progress";
import {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  TranscriptResponse,
  UpdatePhaseFourInput,
} from "@/lib/types";
import {
  initialUploadOverlayState,
  UploadOverlayState,
} from "@/components/upload-progress-modal";

const initialForm: CreateProjectInput = {
  project_name: "",
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
type PendingCreateProject = {
  id: string;
} | null;

export function useProjectsWorkspace(initialProjectId = "") {
  const workspaceState = useWorkspaceState(initialProjectId);
  const { selectedProjectId, setPendingCreateProject, setProjectForm, setSelectedProjectId, setUploadFile, setUploadOverlay, uploadOverlay } = workspaceState;
  const { createMutation, phaseFourMutation, uploadMutation } = useWorkspaceMutations({
    ...workspaceState,
  });
  const { projectQuery, projectsQuery, transcriptQuery } = useWorkspaceQueries(selectedProjectId);
  const authError = getWorkspaceAuthError(projectsQuery.error, projectQuery.error, transcriptQuery.error);
  useUploadOverlaySync(projectQuery, projectsQuery, transcriptQuery, selectedProjectId, setUploadOverlay, uploadOverlay);
  const createFlowControls = buildCreateFlowControls(
    createMutation.error,
    setPendingCreateProject,
    setProjectForm,
    setUploadFile,
  );
  useProjectSelectionSync(initialProjectId, selectedProjectId, setSelectedProjectId);
  return buildWorkspaceResult(
    authError,
    createMutation,
    createFlowControls,
    phaseFourMutation,
    projectQuery.data,
    projectsQuery.data ?? [],
    transcriptQuery.data?.transcript ?? [],
    uploadMutation,
    workspaceState,
  );
}

function useWorkspaceState(initialProjectId: string) {
  const queryClient = useQueryClient();
  const { setActiveHomePanel, setActiveSection, setCreateProjectOpen } = useDashboardStore();
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [projectForm, setProjectForm] = useState<CreateProjectInput>(initialForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadOverlay, setUploadOverlay] = useState<UploadOverlayState>(initialUploadOverlayState);
  const [pendingCreateProject, setPendingCreateProject] = useState<PendingCreateProject>(null);

  return {
    pendingCreateProject,
    projectForm,
    queryClient,
    selectedProjectId,
    setActiveHomePanel,
    setActiveSection,
    setCreateProjectOpen,
    setPendingCreateProject,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
    setUploadOverlay,
    uploadFile,
    uploadOverlay,
  };
}

function buildWorkspaceResult(
  authError: string,
  createMutation: ReturnType<typeof useMutation<ProjectDetail, Error, { file: File; project: CreateProjectInput }>>,
  createFlowControls: ReturnType<typeof buildCreateFlowControls>,
  phaseFourMutation: ReturnType<typeof useMutation<ProjectDetail, Error, { input: UpdatePhaseFourInput; projectId: string }>>,
  selectedProject: ProjectDetail | undefined,
  projects: ProjectSummary[],
  transcript: TranscriptResponse["transcript"],
  uploadMutation: ReturnType<typeof useUploadMutation>,
  workspaceState: ReturnType<typeof useWorkspaceState>,
) {
  return {
    authError,
    createError: createMutation.error instanceof Error ? createMutation.error.message : "",
    createMutation,
    dismissCreateFlow: createFlowControls.dismissCreateFlow,
    phaseFourMutation,
    projectForm: workspaceState.projectForm,
    projects,
    resetCreateFlow: createFlowControls.resetCreateFlow,
    selectedProject,
    selectedProjectId: workspaceState.selectedProjectId,
    setProjectForm: workspaceState.setProjectForm,
    setSelectedProjectId: workspaceState.setSelectedProjectId,
    setUploadFile: workspaceState.setUploadFile,
    setUploadOverlay: workspaceState.setUploadOverlay,
    transcript,
    uploadFile: workspaceState.uploadFile,
    uploadMutation,
    uploadOverlay: workspaceState.uploadOverlay,
  };
}

function buildCreateFlowControls(
  createError: unknown,
  setPendingCreateProject: (project: PendingCreateProject) => void,
  setProjectForm: (input: CreateProjectInput) => void,
  setUploadFile: (file: File | null) => void,
) {
  const clearFormState = () => {
    setProjectForm(initialForm);
    setUploadFile(null);
  };
  return {
    dismissCreateFlow: () => {
      setPendingCreateProject(null);
      clearFormState();
    },
    resetCreateFlow: () => {
      setPendingCreateProject(null);
      clearFormState();
    },
  };
}

function useProjectSelectionSync(
  initialProjectId: string,
  selectedProjectId: string,
  setSelectedProjectId: (projectId: string) => void,
) {
  useEffect(() => {
    if (!initialProjectId || selectedProjectId === initialProjectId) {
      return;
    }
    setSelectedProjectId(initialProjectId);
  }, [initialProjectId, selectedProjectId, setSelectedProjectId]);
}

function useUploadOverlaySync(
  projectQuery: { data: ProjectDetail | undefined; error: unknown; failureCount: number },
  projectsQuery: { error: unknown; failureCount: number },
  transcriptQuery: { error: unknown; failureCount: number },
  selectedProjectId: string,
  setUploadOverlay: (value: UploadOverlayState) => void,
  uploadOverlay: UploadOverlayState,
) {
  const project = projectQuery.data;

  useEffect(() => {
    if (!project || !shouldSyncUploadOverlay(project, selectedProjectId, uploadOverlay.active, uploadOverlay.phase)) {
      return;
    }
    setUploadOverlay(overlayFromProject(project, uploadOverlay.fileName));
  }, [project, selectedProjectId, setUploadOverlay, uploadOverlay.active, uploadOverlay.fileName, uploadOverlay.phase]);
  usePollingFailureOverlay(projectQuery, projectsQuery, transcriptQuery, setUploadOverlay, uploadOverlay);

  useEffect(() => {
    if (!uploadOverlay.active || (uploadOverlay.phase !== "complete" && uploadOverlay.phase !== "failed")) {
      return;
    }
    const timeoutId = window.setTimeout(() => setUploadOverlay(initialUploadOverlayState), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [setUploadOverlay, uploadOverlay.active, uploadOverlay.phase]);
}

function useWorkspaceQueries(selectedProjectId: string) {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchInterval: (query) => {
      if (isAuthenticationError(query.state.error)) {
        return false;
      }
      const processingProject = (query.state.data ?? []).some((project) =>
        ["queued", "uploading", "transcribing", "scripting", "planning", "rendering"].includes(project.status),
      );
      return processingProject ? 10000 : 15000;
    },
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });

  const projectQuery = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: () => fetchProject(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: (query) => {
      if (isAuthenticationError(query.state.error)) {
        return false;
      }
      const status = query.state.data?.status;
      if (status && ["queued", "uploading", "transcribing", "scripting", "planning", "rendering"].includes(status)) {
        return 6000;
      }
      return 12000;
    },
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });

  const transcriptQuery = useQuery({
    queryKey: ["transcript", selectedProjectId],
    queryFn: () => fetchTranscript(selectedProjectId),
    enabled: Boolean(selectedProjectId) && projectQuery.data?.status !== "queued" && projectQuery.data?.status !== "uploading",
    refetchInterval: (query) => {
      if (isAuthenticationError(query.state.error)) {
        return false;
      }
      return projectQuery.data?.status === "ready" ? false : 15000;
    },
    retry: (failureCount, error) => !isAuthenticationError(error) && failureCount < 2,
  });

  return { projectQuery, projectsQuery, transcriptQuery };
}

function getWorkspaceAuthError(...errors: Array<unknown>) {
  const authFailure = errors.find(isAuthenticationError);
  if (!(authFailure instanceof Error)) {
    return "";
  }
  return authFailure.message;
}

function useWorkspaceMutations({
  pendingCreateProject,
  queryClient,
  selectedProjectId,
  setActiveHomePanel,
  setPendingCreateProject,
  setActiveSection,
  setCreateProjectOpen,
  setProjectForm,
  setSelectedProjectId,
  setUploadFile,
  setUploadOverlay,
}: {
  pendingCreateProject: PendingCreateProject;
  queryClient: ReturnType<typeof useQueryClient>;
  selectedProjectId: string;
  setActiveHomePanel: (panel: HomePanel) => void;
  setPendingCreateProject: (project: PendingCreateProject) => void;
  setActiveSection: (section: DashboardSection) => void;
  setCreateProjectOpen: (open: boolean) => void;
  setProjectForm: (input: CreateProjectInput) => void;
  setSelectedProjectId: (projectId: string) => void;
  setUploadFile: (file: File | null) => void;
  setUploadOverlay: (value: UploadOverlayState) => void;
}) {
  const createMutation = useCreateProjectMutation(
    pendingCreateProject,
    queryClient,
    setActiveHomePanel,
    setPendingCreateProject,
    setActiveSection,
    setCreateProjectOpen,
    setSelectedProjectId,
    setProjectForm,
    setUploadFile,
    setUploadOverlay,
  );
  const uploadMutation = useUploadMutation(selectedProjectId, queryClient, setUploadFile, setUploadOverlay);
  const phaseFourMutation = useMutation({
    mutationFn: ({ input, projectId }: { input: UpdatePhaseFourInput; projectId: string }) =>
      updatePhaseFour(projectId, input),
    onSuccess: (project) => handlePhaseFourSuccess(project, queryClient),
  });
  return { createMutation, phaseFourMutation, uploadMutation };
}

function useCreateProjectMutation(
  pendingCreateProject: PendingCreateProject,
  queryClient: ReturnType<typeof useQueryClient>,
  setActiveHomePanel: (panel: HomePanel) => void,
  setPendingCreateProject: (project: PendingCreateProject) => void,
  setActiveSection: (section: DashboardSection) => void,
  setCreateProjectOpen: (open: boolean) => void,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
  setUploadFile: (file: File | null) => void,
  setUploadOverlay: (value: UploadOverlayState) => void,
) {
  return useMutation({
    mutationFn: ({ file, project }: { file: File; project: CreateProjectInput }) =>
      createProjectWithUpload(file, project, pendingCreateProject, setPendingCreateProject, setUploadOverlay),
    onSuccess: (project) =>
      resetAfterCreate(
        project,
        queryClient,
        setActiveHomePanel,
        setPendingCreateProject,
        setActiveSection,
        setCreateProjectOpen,
        setSelectedProjectId,
        setProjectForm,
        setUploadFile,
      ),
  });
}

async function createProjectWithUpload(
  file: File,
  project: CreateProjectInput,
  pendingCreateProject: PendingCreateProject,
  setPendingCreateProject: (project: PendingCreateProject) => void,
  setUploadOverlay: (value: UploadOverlayState) => void,
) {
  const draftProject = await ensureDraftProject(project, pendingCreateProject, setPendingCreateProject);
  return uploadSelectedVideo(draftProject.id, file, setUploadOverlay);
}

function useUploadMutation(
  selectedProjectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setUploadFile: (file: File | null) => void,
  setUploadOverlay: (value: UploadOverlayState) => void,
) {
  return useMutation({
    mutationFn: ({ projectId, file }: { file: File; projectId: string }) =>
      uploadSelectedVideo(projectId, file, setUploadOverlay),
    onSuccess: (project) => resetAfterUpload(project, selectedProjectId, queryClient, setUploadFile, setUploadOverlay),
    onError: () => setUploadOverlay(initialUploadOverlayState),
  });
}

function resetAfterCreate(
  project: ProjectDetail,
  queryClient: ReturnType<typeof useQueryClient>,
  setActiveHomePanel: (panel: HomePanel) => void,
  setPendingCreateProject: (project: PendingCreateProject) => void,
  setActiveSection: (section: DashboardSection) => void,
  setCreateProjectOpen: (open: boolean) => void,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
  setUploadFile: (file: File | null) => void,
) {
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  setActiveHomePanel("exports");
  setPendingCreateProject(null);
  setActiveSection("projects");
  setCreateProjectOpen(false);
  setSelectedProjectId(project.id);
  setProjectForm(initialForm);
  setUploadFile(null);
  openProjectStudio(project.id);
}

function resetAfterUpload(
  project: ProjectDetail,
  selectedProjectId: string,
  queryClient: ReturnType<typeof useQueryClient>,
  setUploadFile: (file: File | null) => void,
  setUploadOverlay: (value: UploadOverlayState) => void,
) {
  queryClient.setQueryData(["project", selectedProjectId], project);
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  void queryClient.invalidateQueries({ queryKey: ["project", selectedProjectId] });
  void queryClient.invalidateQueries({ queryKey: ["transcript", selectedProjectId] });
  setUploadFile(null);
  setUploadOverlay(overlayFromProject(project, project.asset?.filename ?? "Upload complete"));
}

function handlePhaseFourSuccess(
  project: ProjectDetail,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.setQueryData(["project", project.id], project);
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
}

function uploadSelectedVideo(
  projectId: string,
  file: File,
  setUploadOverlay: (value: UploadOverlayState) => void,
) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Uploaded file must be 50 MB or smaller.");
  }
  setUploadOverlay(uploadOverlayForFile(file.name, 0));
  return uploadProjectVideo(projectId, file, (progress) => setUploadOverlay(uploadOverlayForFile(file.name, progress)));
}

async function ensureDraftProject(
  project: CreateProjectInput,
  pendingCreateProject: PendingCreateProject,
  setPendingCreateProject: (project: PendingCreateProject) => void,
) {
  if (pendingCreateProject) {
    await updateProject(pendingCreateProject.id, project);
    return pendingCreateProject;
  }
  const createdProject = await createProject(project);
  const nextPendingProject = { id: createdProject.id };
  setPendingCreateProject(nextPendingProject);
  return nextPendingProject;
}

function openProjectStudio(projectId: string) {
  if (typeof window === "undefined") {
    return;
  }
  const href = `/projects/${projectId}`;
  const openedWindow = window.open(href, "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    window.location.assign(href);
  }
}

function usePollingFailureOverlay(
  projectQuery: { error: unknown; failureCount: number },
  projectsQuery: { error: unknown; failureCount: number },
  transcriptQuery: { error: unknown; failureCount: number },
  setUploadOverlay: (value: UploadOverlayState) => void,
  uploadOverlay: UploadOverlayState,
) {
  useEffect(() => {
    if (!uploadOverlay.active || uploadOverlay.phase !== "processing") {
      return;
    }
    if (
      !hasRepeatedPollingFailure(
        projectQuery.error,
        projectQuery.failureCount,
        projectsQuery.error,
        projectsQuery.failureCount,
        transcriptQuery.error,
        transcriptQuery.failureCount,
      )
    ) {
      return;
    }
    setUploadOverlay(
      uploadOverlayForFailure(
        uploadOverlay.fileName,
        "The backend stopped responding while building your video. Please refresh and retry after the backend recovers.",
      ),
    );
  }, [
    projectQuery.error,
    projectQuery.failureCount,
    projectsQuery.error,
    projectsQuery.failureCount,
    transcriptQuery.error,
    transcriptQuery.failureCount,
    setUploadOverlay,
    uploadOverlay.active,
    uploadOverlay.fileName,
    uploadOverlay.phase,
  ]);
}

function hasRepeatedPollingFailure(
  projectError: unknown,
  projectFailureCount: number,
  projectsError: unknown,
  projectsFailureCount: number,
  transcriptError: unknown,
  transcriptFailureCount: number,
) {
  return [
    [projectError, projectFailureCount],
    [projectsError, projectsFailureCount],
    [transcriptError, transcriptFailureCount],
  ].some(
    ([error, failureCount]) => error instanceof Error && typeof failureCount === "number" && failureCount >= 2,
  );
}
