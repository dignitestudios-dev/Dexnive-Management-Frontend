import axiosInstance from "@/lib/axios";
import { 
  ProjectStage, 
  CreateProjectStagePayload, 
  UpdateStageStatusPayload, 
  UpdateStageDetailsPayload, 
  ReorderStagesPayload 
} from "../types";

export const projectStagesService = {
  getStagesByProject: async (projectId: string) => {
    const { data } = await axiosInstance.get<{ message: string; data: ProjectStage[] }>(`/project-stages/project/${projectId}`);
    return data;
  },

  getStageById: async (stageId: string) => {
    const { data } = await axiosInstance.get<{ message: string; data: ProjectStage }>(`/project-stages/${stageId}`);
    return data;
  },

  createStage: async (payload: CreateProjectStagePayload) => {
    const { data } = await axiosInstance.post<{ message: string; data: ProjectStage }>("/project-stages", payload);
    return data;
  },

  updateStageStatus: async (payload: UpdateStageStatusPayload) => {
    const { data } = await axiosInstance.patch<{ message: string; data: ProjectStage }>(
      `/project-stages/${payload.stageId}/status`, 
      { status: payload.status, note: payload.note }
    );
    return data;
  },

  updateStageDetails: async (payload: UpdateStageDetailsPayload) => {
    const { stageId, ...updateData } = payload;
    const { data } = await axiosInstance.patch<{ message: string; data: ProjectStage }>(`/project-stages/${stageId}`, updateData);
    return data;
  },

  reorderStages: async (payload: ReorderStagesPayload) => {
    const { data } = await axiosInstance.post<{ message: string; data: ProjectStage[] }>("/project-stages/reorder", payload);
    return data;
  },

  deleteStage: async (stageId: string) => {
    const { data } = await axiosInstance.delete<{ message: string }>(`/project-stages/${stageId}`);
    return data;
  },
};
