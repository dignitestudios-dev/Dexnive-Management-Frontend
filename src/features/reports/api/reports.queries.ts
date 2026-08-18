import { useQuery } from "@tanstack/react-query";
import {
  getCategoryModuleBreakdown,
  getProjectHoursBreakdown,
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
