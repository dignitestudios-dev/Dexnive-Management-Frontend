import axiosInstance from "@/lib/axios";
import { 
  GetMissingEntriesParams, 
  MissingEntriesResponse,
  WorklogQueryParams,
  WorklogsResponse,
  WorklogSummaryParams,
  WorklogSummaryResponse,
  SaveDraftPayload,
  SubmitWorklogPayload,
  SingleWorklogResponse
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

export async function getNonBillableReasons() {
  const { data } = await axiosInstance.get<{ message: string; data: any[] }>("/non-billable-reasons");
  return data;
}

export async function createNonBillableReason(payload: { name: string; category?: string; description?: string }) {
  const { data } = await axiosInstance.post("/non-billable-reasons", payload);
  return data;
}

export async function updateNonBillableReason({ id, payload }: { id: string; payload: any }) {
  const { data } = await axiosInstance.patch(`/non-billable-reasons/${id}`, payload);
  return data;
}

export async function deleteNonBillableReason(id: string) {
  const { data } = await axiosInstance.delete(`/non-billable-reasons/${id}`);
  return data;
}

export async function saveDraft(payload: SaveDraftPayload): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.post<SingleWorklogResponse>("/worklogs/draft", payload);
  return data;
}

export async function submitWorklog(payload: SubmitWorklogPayload): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.post<SingleWorklogResponse>("/worklogs/submit", payload);
  return data;
}

export async function getMyWorklogByDate(shiftDate: string): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.get<SingleWorklogResponse>(`/worklogs/my/${shiftDate}`);
  return data;
}

export async function getMyTimesheet(params: { startDate: string; endDate: string }): Promise<any> {
  const { data } = await axiosInstance.get<any>("/worklogs/my/timesheet", { params });
  return data;
}
