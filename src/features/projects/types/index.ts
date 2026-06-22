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
