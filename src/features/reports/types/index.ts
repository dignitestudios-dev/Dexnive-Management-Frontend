export interface DepartmentHours {
  billable: number;
  nonBillable: number;
  total: number;
}

export interface DepartmentAmounts {
  billable: number;
  nonBillable: number;
  total: number;
}

export interface ProjectReportRow {
  name: string;
  type: string;
  division: string;
  hours: Record<string, DepartmentHours>;
  amounts: Record<string, DepartmentAmounts>;
  total: number;
  totalAmount: number;
}

export interface ReportMetrics {
  totalHours?: number;
  totalWorkedHours?: number;
  absentHours?: number;
  totalAbsentHours?: number;
  totalBillingAmount?: number;
  billableHours?: number;
  nonBillableHours?: number;
  /**
   * Summed from freeMinutes/leadWorkMinutes on every submitted
   * WorklogSubmission in range — including a Lead's zero-entry whole days.
   * Distinct from absentHours, which comes from missing-entry records only.
   */
  freeHours?: number;
  leadWorkHours?: number;
  totalWorkingDays?: number;
  activeEmployeesCount?: number;
}

export interface ReportsResponse {
  result: ProjectReportRow[];
  metrics: ReportMetrics;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export interface GetReportsParams {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

/* ==========================================================================
 * Category / module breakdown (Admin & Lead)
 *
 * Counts, not hours — there is no per-category minute tracking by design, so
 * nothing here should be presented as time.
 * ========================================================================== */

export interface CategoryModuleCount {
  _id: string;
  name: string | null;
  entryCount: number;
  daysTouched: number;
}

export interface CategoryModuleProjectRow {
  project: { _id: string; name: string; code?: string };
  entryCount: number;
  daysTouched: number;
  categories: CategoryModuleCount[];
  modules: CategoryModuleCount[];
}

export interface CategoryModuleUserRow {
  user: { _id: string; name: string; email: string };
  projects: CategoryModuleProjectRow[];
}

export interface CategoryModuleBreakdownParams {
  month?: number;
  year?: number;
  /** Accepted by the controller as an alternative to month/year. */
  startDate?: string;
  endDate?: string;
  user?: string;
}

/**
 * The rows sit under `result`, alongside the range the server resolved —
 * the same envelope /reports/project-hours-breakdown uses.
 */
export interface CategoryModuleBreakdownData {
  result: CategoryModuleUserRow[];
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export interface CategoryModuleBreakdownResponse {
  message: string;
  data: CategoryModuleBreakdownData;
}

/* ==========================================================================
 * Shift Drill-Down (Admin & Lead)
 * ========================================================================== */

export interface ShiftDepartment {
  _id: string;
  name: string;
  billableMinutes: number;
  billableHours: number;
  nonBillableMinutes: number;
  nonBillableHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
  totalMinutes: number;
  totalHours: number;
}

export interface ShiftRow {
  shiftDate: string;
  departments: ShiftDepartment[];
  projectCount: number;
}

export interface ShiftListResponse {
  message: string;
  data: ShiftRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ShiftProjectRow {
  project: { _id: string; name: string; code?: string };
  departments: ShiftDepartment[];
  totalMinutes: number;
  totalHours: number;
}

export interface ShiftProjectsResponse {
  message: string;
  data: {
    shiftDate: string;
    projects: ShiftProjectRow[];
  };
}

export interface CategoryTag {
  _id: string;
  name: string;
}

export interface ShiftUserRow {
  user: { _id: string; name: string; email: string };
  billableMinutes: number;
  billableHours: number;
  nonBillableMinutes: number;
  nonBillableHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
  totalMinutes: number;
  totalHours: number;
  categories: CategoryTag[];
}

export interface ShiftUsersResponse {
  message: string;
  data: {
    shiftDate: string;
    project: { _id: string; name: string; code?: string };
    users: ShiftUserRow[];
  };
}
