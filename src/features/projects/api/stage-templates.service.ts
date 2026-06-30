import axiosInstance from "@/lib/axios";

export interface StageTemplate {
  _id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StageTemplateResponse {
  success: boolean;
  message: string;
  data: StageTemplate[];
}

export interface SingleStageTemplateResponse {
  success: boolean;
  message: string;
  data: StageTemplate;
}

export interface CreateStageTemplatePayload {
  name: string;
  order: number;
}

export interface UpdateStageTemplatePayload {
  name?: string;
  isActive?: boolean;
}

export interface ReorderStageTemplatePayload {
  templates: {
    templateId: string;
    order: number;
  }[];
}

export const getStageTemplates = async (isActive?: boolean) => {
  const params = isActive !== undefined ? { isActive } : {};
  const response = await axiosInstance.get<StageTemplateResponse>("/stage-templates", { params });
  return response.data;
};

export const createStageTemplate = async (payload: CreateStageTemplatePayload) => {
  const response = await axiosInstance.post<SingleStageTemplateResponse>("/stage-templates", payload);
  return response.data;
};

export const updateStageTemplate = async (id: string, payload: UpdateStageTemplatePayload) => {
  const response = await axiosInstance.patch<SingleStageTemplateResponse>(`/stage-templates/${id}`, payload);
  return response.data;
};

export const deleteStageTemplate = async (id: string) => {
  const response = await axiosInstance.delete(`/stage-templates/${id}`);
  return response.data;
};

export const reorderStageTemplates = async (payload: ReorderStageTemplatePayload) => {
  const response = await axiosInstance.post("/stage-templates/reorder", payload);
  return response.data;
};
