import { useQuery } from "@tanstack/react-query";
import { getProjectHoursBreakdown } from "./reports.service";
import { GetReportsParams } from "../types";

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
