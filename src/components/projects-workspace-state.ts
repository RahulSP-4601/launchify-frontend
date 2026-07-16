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
  UpdatePhaseFourInput,
} from "@/lib/types";
import {
  initialUploadOverlayState,
  UploadOverlayState,
} from "@/components/upload-progress-modal";

const initialForm: CreateProjectInput = {
  project_name: "",
  product_name: "",
  product_description: "",
  target_audience: "",
  video_goal: "launch_video",
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function useProjectsWorkspace() {
  const queryClient = useQueryClient();
  const { setActiveHomePanel, setActiveSection, setCreateProjectOpen } = useDashboardStore();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectForm, setProjectForm] = useState<CreateProjectInput>(initialForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadOverlay, setUploadOverlay] = useState<UploadOverlayState>(initialUploadOverlayState);
  const { createMutation, phaseFourMutation, uploadMutation } = useWorkspaceMutations({
    queryClient,
    selectedProjectId,
    setActiveHomePanel,
    setActiveSection,
    setCreateProjectOpen,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
    setUploadOverlay,
  });
  const { projectQuery, projectsQuery, transcriptQuery } = useWorkspaceQueries(selectedProjectId);
  const authError = getWorkspaceAuthError(projectsQuery.error, projectQuery.error, transcriptQuery.error);
  useUploadOverlaySync(projectQuery, projectsQuery, transcriptQuery, selectedProjectId, setUploadOverlay, uploadOverlay);

  return {
    authError,
    createError: createMutation.error instanceof Error ? createMutation.error.message : "",
    createMutation,
    phaseFourMutation,
    projectForm,
    projects: projectsQuery.data ?? [],
    selectedProject: projectQuery.data,
    selectedProjectId,
    setProjectForm,
    setSelectedProjectId,
    setUploadFile,
    setUploadOverlay,
    transcript: transcriptQuery.data?.transcript ?? [],
    uploadFile,
    uploadOverlay,
    uploadMutation,
  };
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
  queryClient,
  selectedProjectId,
  setActiveHomePanel,
  setActiveSection,
  setCreateProjectOpen,
  setProjectForm,
  setSelectedProjectId,
  setUploadFile,
  setUploadOverlay,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  selectedProjectId: string;
  setActiveHomePanel: (panel: HomePanel) => void;
  setActiveSection: (section: DashboardSection) => void;
  setCreateProjectOpen: (open: boolean) => void;
  setProjectForm: (input: CreateProjectInput) => void;
  setSelectedProjectId: (projectId: string) => void;
  setUploadFile: (file: File | null) => void;
  setUploadOverlay: (value: UploadOverlayState) => void;
}) {
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) =>
      resetAfterCreate(
        project,
        queryClient,
        setActiveHomePanel,
        setActiveSection,
        setCreateProjectOpen,
        setSelectedProjectId,
        setProjectForm,
      ),
  });
  const uploadMutation = useUploadMutation(selectedProjectId, queryClient, setUploadFile, setUploadOverlay);
  const phaseFourMutation = useMutation({
    mutationFn: ({ input, projectId }: { input: UpdatePhaseFourInput; projectId: string }) =>
      updatePhaseFour(projectId, input),
    onSuccess: (project) => handlePhaseFourSuccess(project, queryClient),
  });
  return { createMutation, phaseFourMutation, uploadMutation };
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
  setActiveSection: (section: DashboardSection) => void,
  setCreateProjectOpen: (open: boolean) => void,
  setSelectedProjectId: (projectId: string) => void,
  setProjectForm: (input: CreateProjectInput) => void,
) {
  void queryClient.invalidateQueries({ queryKey: ["projects"] });
  setActiveHomePanel("overview");
  setActiveSection("projects");
  setCreateProjectOpen(false);
  setSelectedProjectId(project.id);
  setProjectForm(initialForm);
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
