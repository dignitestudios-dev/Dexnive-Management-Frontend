import axiosInstance from "@/lib/axios";
import {
  GetMissingEntriesParams,
  MissingEntriesResponse,
  MissingReasonPayload,
  ResetWorklogDayParams,
  SaveDraftPayload,
  SingleWorklogResponse,
  SubmitWorklogPayload,
  WorklogQueryParams,
  WorklogsResponse,
  WorklogSummaryParams,
  WorklogSummaryResponse,
} from "../types";

/* ── Employee: own data ─────────────────────────────────────────────────── */

export async function getMyWorklogByDate(shiftDate: string): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.get<SingleWorklogResponse>(`/worklogs/my/${shiftDate}`);
  return data;
}

export async function getMyWorklogs(params?: WorklogQueryParams): Promise<WorklogsResponse> {
  const { data } = await axiosInstance.get<WorklogsResponse>("/worklogs/my", { params });
  return data;
}

export async function getMyTimesheet(params: { startDate: string; endDate: string }): Promise<any> {
  const { data } = await axiosInstance.get<any>("/worklogs/my/timesheet", { params });
  return data;
}

export async function getMyMissingEntries(params?: GetMissingEntriesParams): Promise<MissingEntriesResponse> {
  const { data } = await axiosInstance.get<MissingEntriesResponse>("/worklogs/my/missing", { params });
  return data;
}

/* ── Employee: draft / submit ───────────────────────────────────────────── */

/** Save or overwrite the day. Does not lock it. */
export async function saveDraft(payload: SaveDraftPayload): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.post<SingleWorklogResponse>("/worklogs/draft", payload);
  return data;
}

/** Lock the day. Needs unassignedNonBillableNote only when the draft reported unassigned minutes. */
export async function submitWorklog(payload: SubmitWorklogPayload): Promise<SingleWorklogResponse> {
  const { data } = await axiosInstance.post<SingleWorklogResponse>("/worklogs/submit", payload);
  return data;
}

/**
 * File a reason for a past working day with no submission.
 * `forgot` backfills through the same balance rules as a draft and auto-submits
 * unless it produces unassigned non-billable minutes.
 */
export async function submitMissingReason(payload: MissingReasonPayload): Promise<any> {
  const { data } = await axiosInstance.post<any>("/worklogs/my/missing/reason", payload);
  return data;
}

/* ── Management (Admin/Lead) ────────────────────────────────────────────── */

export async function getAllWorklogs(params?: WorklogQueryParams): Promise<WorklogsResponse> {
  const { data } = await axiosInstance.get<WorklogsResponse>("/worklogs", { params });
  return data;
}

export async function getUserTimesheet(params: { user: string; startDate: string; endDate: string }): Promise<any> {
  const { data } = await axiosInstance.get<any>("/worklogs/timesheet", { params });
  return data;
}

export async function getMissingEntries(params?: GetMissingEntriesParams): Promise<MissingEntriesResponse> {
  const { data } = await axiosInstance.get<MissingEntriesResponse>("/worklogs/missing", { params });
  return data;
}

export async function getAllMissingEntriesCount(params: { startDate?: string; endDate?: string; department?: string; page?: number; limit?: number }): Promise<any> {
  const { data } = await axiosInstance.get<any>("/worklogs/all/missing-count", { params });
  return data;
}

export async function getSummary(params?: WorklogSummaryParams): Promise<WorklogSummaryResponse> {
  const { data } = await axiosInstance.get<WorklogSummaryResponse>("/worklogs/summary", { params });
  return data;
}

/* ── Management: deletion ───────────────────────────────────────────────── */

/** Generic delete by document id — resolves to a submission, an entry, or a missing-entry. */
export async function deleteWorklog(id: string): Promise<any> {
  const { data } = await axiosInstance.delete<any>(`/worklogs/${id}`);
  return data;
}

/**
 * Wipe a user's submission, its entries and any missing-entry excuse for one
 * day, so they can log it again from scratch. Powers the "Reset this day" action.
 */
export async function resetWorklogDay({ userId, shiftDate }: ResetWorklogDayParams): Promise<any> {
  const { data } = await axiosInstance.delete<any>(`/worklogs/reset/${userId}/${shiftDate}`);
  return data;
}
