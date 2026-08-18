import axiosInstance from "@/lib/axios";
import {
  CreateModuleTemplatePayload,
  GetModuleTemplatesParams,
  ModuleTemplatesResponse,
  SingleModuleTemplateResponse,
  UpdateModuleTemplatePayload,
} from "../types";

/** Admin-only configuration: the module list every new project starts with. */
export async function getModuleTemplates(
  params?: GetModuleTemplatesParams,
): Promise<ModuleTemplatesResponse> {
  const { data } = await axiosInstance.get<ModuleTemplatesResponse>("/module-templates", {
    params,
  });
  return data;
}

export async function createModuleTemplate(
  payload: CreateModuleTemplatePayload,
): Promise<SingleModuleTemplateResponse> {
  const { data } = await axiosInstance.post<SingleModuleTemplateResponse>(
    "/module-templates",
    payload,
  );
  return data;
}

export async function updateModuleTemplate({
  id,
  ...body
}: UpdateModuleTemplatePayload): Promise<SingleModuleTemplateResponse> {
  const { data } = await axiosInstance.patch<SingleModuleTemplateResponse>(
    `/module-templates/${id}`,
    body,
  );
  return data;
}

export async function deleteModuleTemplate(id: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(
    `/module-templates/${id}`,
  );
  return data;
}
