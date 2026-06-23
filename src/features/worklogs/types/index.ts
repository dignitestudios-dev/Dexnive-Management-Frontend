export interface GetMissingEntriesParams {
  user?: string;
  startDate?: string;
  endDate?: string;
}

export interface MissingEntry {
  shiftDate: string;
}

export interface MissingEntriesResponse {
  message: string;
  data: MissingEntry[];
}

export interface WorklogQueryParams {
  startDate?: string;
  endDate?: string;
  user?: string;
  project?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface WorklogSummaryParams {
  startDate?: string;
  endDate?: string;
  user?: string;
  department?: string;
}

export interface WorklogSummary {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  totalLoggedMinutes: number;
  totalBillableMinutes: number;
  totalNonBillableMinutes: number;
  totalOvertimeMinutes: number;
  daysSubmitted: number;
  totalLoggedHours: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  totalOvertimeHours: number;
  utilizationPercent: number;
}

export interface WorklogSummaryResponse {
  message: string;
  data: WorklogSummary[];
}

export interface WorklogEntry {
  _id: string;
  project: string | { _id: string; name: string };
  loggedMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  overtimeMinutes: number;
  description?: string;
  reasonAllocations: { reason: string; minutes: number }[];
}

export interface WorklogSubmission {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    employeeCode?: string;
  };
  shiftDate: string;
  status: string;
  totalLoggedMinutes: number;
  totalBillableMinutes: number;
  totalNonBillableMinutes: number;
  totalOvertimeMinutes: number;
  submittedAt?: string;
  entries?: WorklogEntry[];
}

export interface WorklogsResponse {
  message: string;
  data: WorklogSubmission[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface WorklogEntryPayload {
  project: string;
  minutes: number;
  description?: string;
}

export interface SaveDraftPayload {
  shiftDate: string;
  entries: WorklogEntryPayload[];
}

export interface ReasonAllocation {
  reason: string;
  minutes: number;
}

export interface SubmitWorklogPayload {
  shiftDate: string;
  reasonAllocations: Record<string, ReasonAllocation[]>;
}

export interface SingleWorklogResponse {
  message: string;
  data: WorklogSubmission;
}
