import { CreateProjectInput, ProjectDetail, ProjectSummary, TranscriptResponse, UpdatePhaseFourInput, UsageSummary } from "@/lib/types";
import { getAccessToken } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const response = await fetch(`${API_URL}/api/projects`, {
    cache: "no-store",
    headers: await requestHeaders(),
  });
  return handleResponse<ProjectSummary[]>(response);
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  const response = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: {
      ...(await requestHeaders()),
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
  const response = await fetch(`${API_URL}/api/projects/${projectId}/upload`, {
    method: "POST",
    headers: {
      ...(await requestHeaders()),
    },
    body: formData,
  });
  return handleResponse<ProjectDetail>(response);
}

export async function fetchProject(projectId: string): Promise<ProjectDetail> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    cache: "no-store",
    headers: await requestHeaders(),
  });
  return handleResponse<ProjectDetail>(response);
}

export async function updatePhaseFour(projectId: string, input: UpdatePhaseFourInput): Promise<ProjectDetail> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/phase4`, {
    method: "PUT",
    headers: {
      ...(await requestHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return handleResponse<ProjectDetail>(response);
}

export async function fetchTranscript(projectId: string): Promise<TranscriptResponse> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/transcript`, {
    cache: "no-store",
    headers: await requestHeaders(),
  });
  return handleResponse<TranscriptResponse>(response);
}

export async function fetchRenderOutput(projectId: string, variant: "preview" | "final"): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/projects/${projectId}/renders/${variant}`, {
    cache: "no-store",
    headers: await requestHeaders(),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Render output request failed");
  }
  return response.blob();
}

export async function fetchUsageSummary(): Promise<UsageSummary> {
  const response = await fetch(`${API_URL}/api/usage`, {
    cache: "no-store",
    headers: await requestHeaders(),
  });
  return handleResponse<UsageSummary>(response);
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
