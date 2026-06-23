import { Division } from "@/features/divisions/types";

export type ProjectStatus = "not-started" | "active" | "on-hold" | "completed";
export type ProjectType = "internal" | "external";

export interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  division?: string | Division;
  projectType: ProjectType;
  status: ProjectStatus;
  budgetedHours?: number;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  totalBillableHours?: number;
  totalNonBillableHours?: number;
  totalOvertimeHours?: number;
  totalHours?: number;
  budgetUsedPercent?: number | null;
}

export interface GetProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
  division?: string;
}

export interface PaginatedProjectsResponse {
  message: string;
  data: Project[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface CreateProjectPayload {
  name: string;
  code: string;
  description?: string;
  division?: string;
  projectType: ProjectType;
  status?: ProjectStatus;
  budgetedHours?: number;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  activateFirstStage?: boolean;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  projectId: string;
}

export type StageStatus = "pending" | "active" | "completed" | "delayed";

export interface ProjectStage {
  _id: string;
  project: string | Project;
  name: string;
  order: number;
  status: StageStatus;
  isTemplateBased: boolean;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  auditLog: {
    status: StageStatus;
    changedAt: string;
    changedBy: string | any;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectStagePayload {
  project: string;
  name: string;
  order: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface UpdateStageStatusPayload {
  stageId: string;
  status: StageStatus;
  note?: string;
}

export interface UpdateStageDetailsPayload {
  stageId: string;
  name?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface ReorderStagesPayload {
  stages: { stageId: string; order: number }[];
}
