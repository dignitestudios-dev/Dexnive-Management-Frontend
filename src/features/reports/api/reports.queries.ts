import { useQuery } from "@tanstack/react-query";
import {
  getCategoryModuleBreakdown,
  getProjectHoursBreakdown,
  getShiftsBreakdown,
  getShiftProjects,
  getShiftProjectUsers,
} from "./reports.service";
import { CategoryModuleBreakdownParams, GetReportsParams } from "../types";

export const reportKeys = {
  all: ["reports"] as const,
  breakdown: (filters: GetReportsParams) => [...reportKeys.all, "breakdown", filters] as const,
};

export function useGetProjectHoursBreakdownQuery(params?: GetReportsParams) {
  return useQuery({
    queryKey: reportKeys.breakdown(params || {}),
    queryFn: () => getProjectHoursBreakdown(params),
  });
}

export function useGetCategoryModuleBreakdownQuery(
  params: CategoryModuleBreakdownParams,
) {
  return useQuery({
    queryKey: ["reports", "category-module-breakdown", params],
    queryFn: () => getCategoryModuleBreakdown(params),
  });
}

export function useGetShiftsQuery(params: GetReportsParams & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["reports", "shifts", params],
    queryFn: () => getShiftsBreakdown(params),
  });
}

export function useGetShiftProjectsQuery(shiftDate: string) {
  return useQuery({
    queryKey: ["reports", "shifts", shiftDate, "projects"],
    queryFn: () => getShiftProjects(shiftDate),
    enabled: !!shiftDate,
  });
}

export function useGetShiftProjectUsersQuery(shiftDate: string, projectId: string) {
  return useQuery({
    queryKey: ["reports", "shifts", shiftDate, "projects", projectId, "users"],
    queryFn: () => getShiftProjectUsers(shiftDate, projectId),
    enabled: !!shiftDate && !!projectId,
  });
}
