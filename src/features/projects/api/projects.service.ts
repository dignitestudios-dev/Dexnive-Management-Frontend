import axiosInstance from "@/lib/axios";
import { GetProjectsParams, PaginatedProjectsResponse, CreateProjectPayload, UpdateProjectPayload, Project } from "../types";

export async function getProjects(params: GetProjectsParams): Promise<PaginatedProjectsResponse> {
  const cleanParams = { ...params };
  if (!cleanParams.search) {
    delete cleanParams.search;
  }
  const { data } = await axiosInstance.get<PaginatedProjectsResponse>("/projects", { params: cleanParams });
  return data;
}

export async function getProjectById(id: string): Promise<{ data: Project }> {
  const { data } = await axiosInstance.get<{ data: Project }>(`/projects/${id}`);
  return data;
}

export async function createProject(payload: CreateProjectPayload): Promise<{ data: { project: Project } }> {
  const { data } = await axiosInstance.post<{ data: { project: Project } }>("/projects", payload);
  return data;
}

export async function updateProject(payload: UpdateProjectPayload): Promise<{ data: Project }> {
  const { projectId, ...updateData } = payload;
  const { data } = await axiosInstance.patch<{ data: Project }>(`/projects/${projectId}`, updateData);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await axiosInstance.delete(`/projects/${id}`);
}
