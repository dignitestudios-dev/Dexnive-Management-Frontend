import axiosInstance from "@/lib/axios";
import { 
  GetMissingEntriesParams, 
  MissingEntriesResponse,
  WorklogQueryParams,
  WorklogsResponse,
  WorklogSummaryParams,
  WorklogSummaryResponse
} from "../types";

export async function getMissingEntries(params?: GetMissingEntriesParams): Promise<MissingEntriesResponse> {
  const { data } = await axiosInstance.get<MissingEntriesResponse>("/worklogs/missing", { params });
  return data;
}

export async function getAllWorklogs(params?: WorklogQueryParams): Promise<WorklogsResponse> {
  const { data } = await axiosInstance.get<WorklogsResponse>("/worklogs", { params });
  return data;
}

export async function getSummary(params?: WorklogSummaryParams): Promise<WorklogSummaryResponse> {
  const { data } = await axiosInstance.get<WorklogSummaryResponse>("/worklogs/summary", { params });
  return data;
}
