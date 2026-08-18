import axiosInstance from "@/lib/axios";
import {
  CategoryModuleBreakdownParams,
  CategoryModuleBreakdownResponse,
  GetReportsParams,
  ReportsResponse,
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
