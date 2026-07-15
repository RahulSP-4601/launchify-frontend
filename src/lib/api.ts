import { CreateProjectInput, ProjectDetail, ProjectSummary, TranscriptResponse, UpdatePhaseFourInput, UsageSummary } from "@/lib/types";
import { clearAuthSession, getAccessToken, refreshAccessToken } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const response = await apiFetch("/api/projects", { cache: "no-store" });
  return handleResponse<ProjectSummary[]>(response);
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  const response = await apiFetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ProjectDetail>(response);
}

export async function uploadProjectVideo(projectId: string, file: File): Promise<ProjectDetail> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("filename", file.name);
  const response = await apiFetch(`/api/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<ProjectDetail>(response);
}

export async function fetchProject(projectId: string): Promise<ProjectDetail> {
  const response = await apiFetch(`/api/projects/${projectId}`, { cache: "no-store" });
  return handleResponse<ProjectDetail>(response);
}

export async function updatePhaseFour(projectId: string, input: UpdatePhaseFourInput): Promise<ProjectDetail> {
  const response = await apiFetch(`/api/projects/${projectId}/phase4`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ProjectDetail>(response);
}

export async function fetchTranscript(projectId: string): Promise<TranscriptResponse> {
  const response = await apiFetch(`/api/projects/${projectId}/transcript`, { cache: "no-store" });
  return handleResponse<TranscriptResponse>(response);
}

export async function fetchRenderOutput(projectId: string, variant: "preview" | "final"): Promise<Blob> {
  const response = await apiFetch(`/api/projects/${projectId}/renders/${variant}`, { cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Render output request failed");
  }
  return response.blob();
}

export async function fetchUsageSummary(): Promise<UsageSummary> {
  const response = await apiFetch("/api/usage", { cache: "no-store" });
  return handleResponse<UsageSummary>(response);
}

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes("Authentication required") ||
    error.message.includes("Invalid Supabase access token") ||
    error.message.includes("session is no longer valid") ||
    error.message.includes("Sign in again")
  );
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new Error(detail || "Request failed");
  }
  return (await response.json()) as T;
}

async function requestHeaders(): Promise<HeadersInit> {
  return {
    Authorization: `Bearer ${await getAccessToken()}`,
  };
}

async function apiFetch(path: string, init: RequestInit = {}, allowRetry = true): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(await requestHeaders()),
      ...(init.headers ?? {}),
    },
  });
  if (response.status !== 401 || !allowRetry) {
    if (response.status === 401 && !allowRetry) {
      await clearAuthSession();
    }
    return response;
  }
  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    await clearAuthSession();
    throw new Error("Your session is no longer valid. Please sign in again.");
  }
  return apiFetch(path, init, false);
}

async function parseErrorDetail(response: Response): Promise<string> {
  const detail = await response.text();
  if (!detail) {
    return "";
  }
  try {
    const parsed = JSON.parse(detail) as { detail?: unknown };
    return typeof parsed.detail === "string" ? parsed.detail : detail;
  } catch {
    return detail;
  }
}
