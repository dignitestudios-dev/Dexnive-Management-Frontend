/**
 * The day balance rule — the single source of truth on the frontend.
 *
 * Mirrors `isDayBalanceValid` in the backend's
 * `src/core/common/helpers/work-log.helpers.js`. The server validates this too
 * (422 on `body.freeMinutes`); this module exists so the UI can keep the user
 * inside the rule and explain it, rather than letting them submit and bounce.
 *
 * If the backend's rule changes, change it here in the same commit.
 */

import type { WorklogEntryPayload } from "../types";

/** A standard working day. Backend: STANDARD_WORK_MINUTES in work-log.helpers.js. */
export const STANDARD_WORK_MINUTES = 480;

/** Hard cap on a single day's logged time, enforced by the DTO. */
export const MAX_DAY_MINUTES = 1440;

/** Which branch of the rule a day falls into. */
export type DayBalanceCase =
  | "empty" // no project entries at all
  | "under" // logged < 480 — there is a deficit to account for
  | "exact" // logged === 480
  | "overtime"; // logged > 480

export type DayBalanceCode =
  | "ok"
  | "empty-day-must-total-standard"
  | "full-day-allows-no-extra"
  | "exceeds-deficit"
  | "negative-input"
  | "exceeds-day-cap"
  | "duplicate-project";

export interface DayBalanceInput {
  entries: Pick<WorklogEntryPayload, "project" | "minutes">[];
  freeMinutes?: number;
  leadWorkMinutes?: number;
  /**
   * Whether the current user may log lead work. Only affects wording: lead
   * work is a Lead-only concept, so messages shown to anyone else must not
   * mention it. Pass `isLead` from useAuth().
   */
  canLogLeadWork?: boolean;
}

export interface DayBalanceResult {
  valid: boolean;
  code: DayBalanceCode;
  /** Human-readable explanation, safe to render inline. Empty when valid. */
  message: string;
  case: DayBalanceCase;
  /** Σ entries[].minutes */
  loggedMinutes: number;
  /** freeMinutes + leadWorkMinutes */
  nonProjectMinutes: number;
  /** max(0, 480 − logged) — the day's shortfall */
  deficit: number;
  /**
   * Minutes still to be accounted for: deficit − free − leadWork.
   * This is what auto-fills as non-billable, and what the budget bar shows
   * as "left to account for". Never negative.
   */
  remaining: number;
  /** True when free/leadWork inputs should be disabled (a full day is logged). */
  nonProjectLocked: boolean;
}

const toMinutes = (value: number | undefined): number =>
  Number.isFinite(value) ? Math.trunc(value as number) : 0;

/** Σ of the entries' minutes, ignoring blank/partial rows. */
export function sumEntryMinutes(
  entries: DayBalanceInput["entries"] = [],
): number {
  return entries.reduce((sum, entry) => sum + toMinutes(entry?.minutes), 0);
}

/**
 * Classify and validate a day.
 *
 * The three branches, straight from the API guide:
 *   entries empty       → free + leadWork must equal exactly 480
 *   logged >= 480       → free and leadWork must both be 0
 *   logged  < 480       → free + leadWork must be <= (480 − logged)
 */
export function validateDayBalance(input: DayBalanceInput): DayBalanceResult {
  const entries = input.entries ?? [];
  const freeMinutes = toMinutes(input.freeMinutes);
  const leadWorkMinutes = toMinutes(input.leadWorkMinutes);

  // Never name lead work to a user who cannot log it.
  const timeTerm = input.canLogLeadWork ? "Free and lead-work time" : "Free time";
  const timeTermLower = input.canLogLeadWork ? "free and lead-work time" : "free time";

  const loggedMinutes = sumEntryMinutes(entries);
  const nonProjectMinutes = freeMinutes + leadWorkMinutes;
  const deficit = Math.max(0, STANDARD_WORK_MINUTES - loggedMinutes);
  const remaining = Math.max(0, deficit - nonProjectMinutes);

  const dayCase: DayBalanceCase =
    entries.length === 0
      ? "empty"
      : loggedMinutes > STANDARD_WORK_MINUTES
        ? "overtime"
        : loggedMinutes === STANDARD_WORK_MINUTES
          ? "exact"
          : "under";

  const nonProjectLocked =
    entries.length > 0 && loggedMinutes >= STANDARD_WORK_MINUTES;

  const base = {
    case: dayCase,
    loggedMinutes,
    nonProjectMinutes,
    deficit,
    remaining,
    nonProjectLocked,
  };

  if (freeMinutes < 0 || leadWorkMinutes < 0) {
    return {
      ...base,
      valid: false,
      code: "negative-input",
      message: `${timeTerm} cannot be negative.`,
    };
  }

  if (loggedMinutes > MAX_DAY_MINUTES) {
    return {
      ...base,
      valid: false,
      code: "exceeds-day-cap",
      message: "Total logged time cannot exceed 24 hours in a day.",
    };
  }

  const projectIds = entries.map((entry) => entry?.project).filter(Boolean);
  if (new Set(projectIds).size !== projectIds.length) {
    return {
      ...base,
      valid: false,
      code: "duplicate-project",
      message: "Each project can only be added once per day.",
    };
  }

  if (dayCase === "empty") {
    if (nonProjectMinutes !== STANDARD_WORK_MINUTES) {
      return {
        ...base,
        valid: false,
        code: "empty-day-must-total-standard",
        message: input.canLogLeadWork
          ? "With no project time logged, free and lead-work time must add up to exactly 8 hours."
          : "With no project time logged, free time must be exactly 8 hours.",
      };
    }
    return { ...base, valid: true, code: "ok", message: "" };
  }

  if (dayCase === "exact" || dayCase === "overtime") {
    if (nonProjectMinutes > 0) {
      return {
        ...base,
        valid: false,
        code: "full-day-allows-no-extra",
        message: `A full day is already logged to projects, so ${timeTermLower} must be 0.`,
      };
    }
    return { ...base, valid: true, code: "ok", message: "" };
  }

  // dayCase === "under"
  if (nonProjectMinutes > deficit) {
    return {
      ...base,
      valid: false,
      code: "exceeds-deficit",
      message: `${timeTerm} cannot exceed the ${formatMinutes(deficit)} left in the day.`,
    };
  }

  return { ...base, valid: true, code: "ok", message: "" };
}

/**
 * Shrink non-project time so it fits the room left in the day.
 *
 * Used when project hours grow: someone logs 2h, marks the other 6h free, then
 * corrects the project to 5h — the free time follows down to 3h instead of the
 * day being rejected as unbalanced.
 *
 * Free is reduced first because it is the residual bucket; lead work is a
 * deliberate categorisation and is only cut once free has reached zero. Returns
 * the inputs untouched when they already fit.
 */
export function clampNonProjectTime(
  freeMinutes: number,
  leadWorkMinutes: number,
  deficit: number,
): { freeMinutes: number; leadWorkMinutes: number } {
  const free = Math.max(0, Math.trunc(freeMinutes || 0));
  const lead = Math.max(0, Math.trunc(leadWorkMinutes || 0));
  const room = Math.max(0, Math.trunc(deficit || 0));

  if (free + lead <= room) return { freeMinutes: free, leadWorkMinutes: lead };

  const nextFree = Math.min(free, room);
  const nextLead = Math.max(0, Math.min(lead, room - nextFree));

  return { freeMinutes: nextFree, leadWorkMinutes: nextLead };
}

/* ==========================================================================
 * Display helpers
 * ========================================================================== */

/** 150 → "2h 30m", 120 → "2h", 45 → "45m", 0 → "0m" */
export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.trunc(total || 0));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Split minutes into the {hours, minutes} pair the entry inputs use. */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const value = Math.max(0, Math.trunc(total || 0));
  return { hours: Math.floor(value / 60), minutes: value % 60 };
}

/** Recombine an {hours, minutes} pair into total minutes. */
export function combineMinutes(hours: number, minutes: number): number {
  return Math.max(0, Math.trunc(hours || 0) * 60 + Math.trunc(minutes || 0));
}
