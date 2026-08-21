import axiosInstance from "@/lib/axios";
import {
  CategoryModuleBreakdownParams,
  CategoryModuleBreakdownResponse,
  GetReportsParams,
  ReportsResponse,
  ShiftListResponse,
  ShiftProjectsResponse,
  ShiftUsersResponse,
} from "../types";

export async function getProjectHoursBreakdown(params?: GetReportsParams): Promise<{ message: string; data: ReportsResponse }> {
  const { data } = await axiosInstance.get<{ message: string; data: ReportsResponse }>("/reports/project-hours-breakdown", { params });
  return data;
}

/**
 * Which projects, categories and modules a user worked on.
 *
 * Counts of entries and distinct days — deliberately not hours; minutes are
 * tracked per project entry, never per category or module.
 */
export async function getCategoryModuleBreakdown(
  params: CategoryModuleBreakdownParams,
): Promise<CategoryModuleBreakdownResponse> {
  const { data } = await axiosInstance.get<CategoryModuleBreakdownResponse>(
    "/reports/category-module-breakdown",
    { params },
  );
  return data;
}

/* ==========================================================================
 * Shift Drill-Down
 * ========================================================================== */

export async function getShiftsBreakdown(params: GetReportsParams & { page?: number; limit?: number }): Promise<ShiftListResponse> {
  const { data } = await axiosInstance.get<ShiftListResponse>("/reports/shifts", { params });
  return data;
}

export async function getShiftProjects(shiftDate: string): Promise<ShiftProjectsResponse> {
  const { data } = await axiosInstance.get<ShiftProjectsResponse>(`/reports/shifts/${shiftDate}/projects`);
  return data;
}

export async function getShiftProjectUsers(shiftDate: string, projectId: string): Promise<ShiftUsersResponse> {
  const { data } = await axiosInstance.get<ShiftUsersResponse>(`/reports/shifts/${shiftDate}/projects/${projectId}/users`);
  return data;
}
