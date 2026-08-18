import axiosInstance from "@/lib/axios";
import {
  CreateModulePayload,
  GetModulesParams,
  ModulesResponse,
  SingleModuleResponse,
  UpdateModulePayload,
} from "../types";

/**
 * Modules for one project.
 *
 * `project` is required by the API — modules are per project, auto-seeded from
 * the module templates when the project is created.
 */
export async function getModules(params: GetModulesParams): Promise<ModulesResponse> {
  const { data } = await axiosInstance.get<ModulesResponse>("/modules", { params });
  return data;
}

/** Admin / PM / Lead only. */
export async function createModule(
  payload: CreateModulePayload,
): Promise<SingleModuleResponse> {
  const { data } = await axiosInstance.post<SingleModuleResponse>("/modules", payload);
  return data;
}

export async function updateModule({
  id,
  ...body
}: UpdateModulePayload): Promise<SingleModuleResponse> {
  const { data } = await axiosInstance.patch<SingleModuleResponse>(`/modules/${id}`, body);
  return data;
}

/** Soft delete server-side — historical worklog entries keep resolving. */
export async function deleteModule(id: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(`/modules/${id}`);
  return data;
}
