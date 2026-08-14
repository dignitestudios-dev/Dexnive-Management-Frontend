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
