/**
 * Worklog API contract.
 *
 * The day model: every working day is STANDARD_WORK_MINUTES (480). A day is
 * described by logged project time + freeMinutes + leadWorkMinutes, and the
 * backend derives non-billable time from whatever is left over. The frontend
 * never sends non-billable minutes — see features/worklogs/lib/day-balance.ts
 * for the rule the UI must keep the user inside.
 */

/* ==========================================================================
 * Shared
 * ========================================================================== */

/** A calendar day key, `yyyy-MM-dd`. Always produced via lib/datetime.ts. */
export type DayKey = string;

export type WorklogStatus = "draft" | "submitted";

/** Reasons a past working day has no submission. */
export type MissingReasonType = "forgot" | "absent" | "other";

/** Day status in the timesheet calendar view. */
export type TimesheetDayStatus =
  | "present"
  | "absent"
  | "other"
  | "holiday"
  | "weekend";

export interface ProjectRef {
  _id: string;
  name: string;
  code?: string;
}

export interface StageRef {
  _id: string;
  name: string;
}

export interface UserRef {
  _id: string;
  name: string;
  email: string;
  employeeCode?: string;
}

/* ==========================================================================
 * Entities
 * ========================================================================== */

/**
 * One project's slice of a day. `billableMinutes` / `nonBillableMinutes` /
 * `overtimeMinutes` are all server-computed — never user input.
 */
export interface WorklogEntry {
  _id: string;
  submission?: string;
  project: string | ProjectRef;
  stage?: string | StageRef;
  shiftDate?: string;
  loggedMinutes: number;
  loggedHours?: number;
  billableMinutes: number;
  billableHours?: number;
  nonBillableMinutes: number;
  nonBillableHours?: number;
  overtimeMinutes: number;
  overtimeHours?: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** One submission per user per shiftDate — the day-level record. */
export interface WorklogSubmission {
  _id: string;
  user?: UserRef;
  shiftDate: string;
  status: WorklogStatus;
  submittedAt?: string | null;

  totalLoggedMinutes: number;
  totalLoggedHours?: number;
  totalBillableMinutes: number;
  totalBillableHours?: number;
  totalNonBillableMinutes: number;
  totalNonBillableHours?: number;
  totalOvertimeMinutes: number;
  totalOvertimeHours?: number;

  /** Day-level user input: time with no project work assigned. */
  freeMinutes: number;
  freeHours?: number;
  /** Day-level user input, Lead role only. */
  leadWorkMinutes: number;
  leadWorkHours?: number;

  /**
   * Non-billable time that could not be attributed to any project (a project's
   * own logged minutes were too small to carry its share of the pool).
   * When > 0, `unassignedNonBillableNote` is required before submit.
   */
  unassignedNonBillableMinutes: number;
  unassignedNonBillableHours?: number;
  unassignedNonBillableNote?: string | null;

  entries?: WorklogEntry[];
  createdAt?: string;
  updatedAt?: string;
}

/* ==========================================================================
 * Requests — draft & submit
 * ========================================================================== */

export interface WorklogEntryPayload {
  project: string;
  minutes: number;
  description?: string;
}

/**
 * POST /worklogs/draft — save/overwrite a day. Does not lock it.
 * Must satisfy the balance rule; see lib/day-balance.ts.
 */
export interface SaveDraftPayload {
  shiftDate: DayKey;
  entries: WorklogEntryPayload[];
  freeMinutes?: number;
  /** Rejected with 400 for non-Lead users when > 0. */
  leadWorkMinutes?: number;
}

/**
 * POST /worklogs/submit — locks the day.
 * `unassignedNonBillableNote` is required only when the saved draft came back
 * with `unassignedNonBillableMinutes > 0`.
 */
export interface SubmitWorklogPayload {
  shiftDate: DayKey;
  unassignedNonBillableNote?: string;
}

/* ==========================================================================
 * Requests — missing days (past dates only)
 * ========================================================================== */

/** Backfills the day through the identical rules as a draft. */
export interface MissingReasonForgotPayload {
  shiftDate: DayKey;
  reason: "forgot";
  entries: WorklogEntryPayload[];
  freeMinutes?: number;
  leadWorkMinutes?: number;
}

/** Genuinely did not work that day — no hours involved. */
export interface MissingReasonAbsentPayload {
  shiftDate: DayKey;
  reason: "absent";
}

/** Anything else — free-text note is required. */
export interface MissingReasonOtherPayload {
  shiftDate: DayKey;
  reason: "other";
  note: string;
}

/**
 * Discriminated on `reason`, so the compiler enforces that "forgot" carries
 * entries and "other" carries a note.
 */
export type MissingReasonPayload =
  | MissingReasonForgotPayload
  | MissingReasonAbsentPayload
  | MissingReasonOtherPayload;

/* ==========================================================================
 * Reads
 * ========================================================================== */

export interface GetMissingEntriesParams {
  user?: string;
  startDate?: DayKey;
  endDate?: DayKey;
}

export interface MissingEntry {
  shiftDate: string;
  reason?: MissingReasonType;
  note?: string | null;
}

export interface MissingEntriesResponse {
  message: string;
  data: MissingEntry[];
}

export interface WorklogQueryParams {
  startDate?: DayKey;
  endDate?: DayKey;
  user?: string;
  project?: string;
  status?: WorklogStatus;
  page?: number;
  limit?: number;
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

export interface SingleWorklogResponse {
  message: string;
  /** null when nothing has been logged for the requested day. */
  data: WorklogSubmission | null;
}

/* ==========================================================================
 * Timesheet (calendar view)
 * ========================================================================== */

export interface TimesheetProjectRow {
  project: ProjectRef | string;
  stage?: StageRef | string;
  loggedMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  overtimeMinutes: number;
  description?: string | null;
}

export interface TimesheetDay {
  shiftDate: string;
  status: TimesheetDayStatus;
  workedMinutes: number;
  workedHours?: number;
  projects: TimesheetProjectRow[];
  missingReason?: MissingReasonType | null;
  missingNote?: string | null;
  holidayReason?: string | null;
  unassignedNonBillableMinutes?: number;
  unassignedNonBillableHours?: number;
  unassignedNonBillableNote?: string | null;
}

/* ==========================================================================
 * Summary report
 * ========================================================================== */

export interface WorklogSummaryParams {
  startDate?: DayKey;
  endDate?: DayKey;
  user?: string;
  department?: string;
}

export interface WorklogSummary {
  user: UserRef;
  totalLoggedMinutes?: number;
  totalBillableMinutes?: number;
  totalNonBillableMinutes?: number;
  totalOvertimeMinutes?: number;
  totalLoggedHours: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  totalOvertimeHours: number;
  totalUnassignedNonBillableHours?: number;
  totalFreeHours?: number;
  totalLeadWorkHours?: number;
  daysSubmitted: number;
  /** totalBillableMinutes / (daysSubmitted × 480) × 100 */
  utilizationPercent: number;
}

export interface WorklogSummaryResponse {
  message: string;
  data: WorklogSummary[];
}

/* ==========================================================================
 * Admin actions
 * ========================================================================== */

/** DELETE /worklogs/reset/:userId/:shiftDate — lets a user re-log a locked day. */
export interface ResetWorklogDayParams {
  userId: string;
  shiftDate: DayKey;
}
