import { useQuery } from "@tanstack/react-query";
import { getMissingEntries, getAllWorklogs, getSummary, getMyWorklogByDate, getNonBillableReasons, getMyTimesheet } from "./worklogs.service";
import { GetMissingEntriesParams, WorklogQueryParams, WorklogSummaryParams } from "../types";

export const worklogKeys = {
  all: ["worklogs"] as const,
  list: (params?: WorklogQueryParams) => [...worklogKeys.all, "list", params] as const,
  missing: (params?: GetMissingEntriesParams) => [...worklogKeys.all, "missing", params] as const,
  summary: (params?: WorklogSummaryParams) => [...worklogKeys.all, "summary", params] as const,
  my: (shiftDate: string) => [...worklogKeys.all, "my", shiftDate] as const,
  reasons: () => [...worklogKeys.all, "reasons"] as const,
};

export function useGetNonBillableReasonsQuery() {
  return useQuery({
    queryKey: worklogKeys.reasons(),
    queryFn: () => getNonBillableReasons(),
  });
}

export function useMissingEntriesQuery(params?: GetMissingEntriesParams) {
  return useQuery({
    queryKey: worklogKeys.missing(params),
    queryFn: () => getMissingEntries(params),
  });
}

export function useGetAllWorklogsQuery(params?: WorklogQueryParams) {
  return useQuery({
    queryKey: worklogKeys.list(params),
    queryFn: () => getAllWorklogs(params),
  });
}

export function useGetSummaryQuery(params?: WorklogSummaryParams) {
  return useQuery({
    queryKey: worklogKeys.summary(params),
    queryFn: () => getSummary(params),
  });
}

export function useGetMyWorklogByDateQuery(shiftDate: string) {
  return useQuery({
    queryKey: worklogKeys.my(shiftDate),
    queryFn: () => getMyWorklogByDate(shiftDate),
    enabled: !!shiftDate,
  });
}

export function useGetMyTimesheetQuery(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: [...worklogKeys.all, "timesheet", params],
    queryFn: () => getMyTimesheet(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}
