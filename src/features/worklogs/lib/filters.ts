import type { WorklogStatus } from "../types";

const WORKLOG_STATUSES: WorklogStatus[] = ["draft", "submitted"];

/**
 * Narrow a filter value (which arrives as a raw string from a Select or a URL
 * query param, and uses "all" to mean no filter) to a real WorklogStatus.
 * Returns undefined for "all", empty, or anything unrecognised — which is
 * exactly what the query layer wants for "don't filter on status".
 */
export function toWorklogStatus(value?: string | null): WorklogStatus | undefined {
  if (!value || value === "all") return undefined;
  return WORKLOG_STATUSES.includes(value as WorklogStatus)
    ? (value as WorklogStatus)
    : undefined;
}
