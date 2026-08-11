/**
 * Centralised date & time handling for the whole platform.
 *
 * ============================================================================
 * WHY THIS EXISTS
 * ============================================================================
 * `new Date(...)`, `format(...)` and `toLocaleDateString(...)` all resolve
 * against the *viewer's operating system timezone*. That made every screen in
 * this app change its answer when a user changed their system clock: a worklog
 * filed on 11 Aug in Karachi rendered as 10 Aug for anyone west of UTC.
 *
 * Nothing outside this module should call `new Date()`, `format()` from
 * date-fns, or any `toLocale*` method on a date. Route everything through the
 * helpers below and the app becomes independent of the machine it runs on —
 * browser, server render, or CI.
 *
 * ============================================================================
 * THE THREE KINDS OF DATE VALUE — pick the right one
 * ============================================================================
 *
 * 1. CALENDAR DAY — a day on a wall calendar, with no time and no timezone.
 *    Fields: shiftDate, joiningDate, deactivateDate, plannedStartDate,
 *            plannedEndDate, holiday dates, startDate/endDate filters.
 *    The backend anchors these at UTC midnight, so the date portion of the
 *    string IS the answer. Converting it to a timezone is what breaks it.
 *      -> formatDay(), dayKey(), parseDay(), addDaysToKey(), ...
 *
 * 2. INSTANT — a real moment in time that genuinely happened.
 *    Fields: createdAt, updatedAt, changedAt.
 *    These must be rendered *in* the business timezone so that every viewer
 *    reads the same wall clock.
 *      -> formatInstant(), formatClock()
 *
 * 3. NOW — "what day/year/hour is it for the business right now".
 *    Depends on a timezone by definition; that timezone is APP_TIMEZONE,
 *    never the viewer's.
 *      -> appNow(), todayKey(), appCurrentYear(), appCurrentHour()
 *
 * Using a calendar-day helper on an instant (or vice versa) is the one way to
 * reintroduce the bug, which is why the names are deliberately distinct.
 */

import { format as formatLocal, isValid, parse as parseLocal } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/config/timezone";

/**
 * A calendar day in `yyyy-MM-dd` form — the app's canonical wire format for
 * day-precision values, and what every list/report filter sends to the API.
 */
export type DayKey = string;

/** Anything the helpers will accept for a date-ish value. */
export type DateInput = string | number | Date | null | undefined;

/** Shared format strings, so the same kind of value looks the same everywhere. */
export const DATE_FORMATS = {
  /** 2026-08-11 — wire format & <input type="date"> */
  KEY: "yyyy-MM-dd",
  /** Aug 11, 2026 */
  DAY_SHORT: "MMM d, yyyy",
  /** August 11, 2026 */
  DAY_LONG: "MMMM d, yyyy",
  /** Tue, Aug 11, 2026 */
  DAY_WITH_WEEKDAY: "EEE, MMM d, yyyy",
  /** Tuesday, August 11, 2026 */
  DAY_FULL: "EEEE, MMMM d, yyyy",
  /** Aug 11 */
  DAY_COMPACT: "MMM d",
  /** August 2026 */
  MONTH_YEAR: "MMMM yyyy",
  /** 2026-08 */
  MONTH_KEY: "yyyy-MM",
  /** Aug 11, 2026, 4:30 PM */
  INSTANT: "MMM d, yyyy, h:mm a",
  /** 4:30 PM */
  CLOCK: "h:mm a",
} as const;

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/* ==========================================================================
 * 3. NOW — the business clock
 * ========================================================================== */

/**
 * The current moment, expressed as a Date whose *local fields* (getFullYear,
 * getMonth, getDate, getHours, ...) read as the wall clock in APP_TIMEZONE.
 *
 * This is the value to seed calendar state with, because every date-fns
 * calendar function (startOfMonth, addMonths, eachDayOfInterval, isSameMonth,
 * ...) reads exactly those local fields. Seed from here and all downstream
 * date-fns math is automatically on the business calendar.
 *
 *   const [month, setMonth] = useState(appNow());   // not new Date()
 *
 * Note: this is a display/calendar construct, not a real instant. Do not send
 * it to an API or compare it with a raw timestamp — use todayKey() for the
 * former and Date.now() for the latter.
 */
export function appNow(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/** Today's calendar day in the business timezone, as `yyyy-MM-dd`. */
export function todayKey(): DayKey {
  return formatInTimeZone(new Date(), APP_TIMEZONE, DATE_FORMATS.KEY);
}

/** The current year in the business timezone. */
export function appCurrentYear(): number {
  return Number(formatInTimeZone(new Date(), APP_TIMEZONE, "yyyy"));
}

/** The current hour (0-23) in the business timezone — for greetings etc. */
export function appCurrentHour(): number {
  return Number(formatInTimeZone(new Date(), APP_TIMEZONE, "H"));
}

/* ==========================================================================
 * 1. CALENDAR DAY — timezone-independent
 * ========================================================================== */

/**
 * Normalise any day-precision value to its `yyyy-MM-dd` key.
 *
 * Handles the three shapes that reach the UI:
 *   "2026-08-11"                 -> "2026-08-11"  (already a key)
 *   "2026-08-11T00:00:00.000Z"   -> "2026-08-11"  (backend UTC-anchored day)
 *   Date (from a day picker)     -> "2026-08-11"  (its local calendar fields)
 *
 * String inputs are read verbatim — never re-interpreted through a timezone —
 * which is precisely what keeps the day from sliding.
 *
 * For a genuine timestamp use instantToDayKey() instead; this function would
 * return the UTC day of an instant, which is not necessarily the business day.
 */
export function dayKey(value: DateInput): DayKey {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") {
    const matched = DAY_KEY_PATTERN.exec(value);
    if (matched) return matched[0];
    const parsed = new Date(value);
    return isValid(parsed)
      ? formatInTimeZone(parsed, APP_TIMEZONE, DATE_FORMATS.KEY)
      : "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? formatLocal(date, DATE_FORMATS.KEY) : "";
}

/**
 * Turn a `yyyy-MM-dd` key into a Date suitable for date-fns formatting and for
 * day pickers.
 *
 * The Date is pinned to local **noon**, not midnight. Noon is at least 12 hours
 * from either day boundary, so no timezone offset or DST shift can push it onto
 * a neighbouring day — the classic guard against off-by-one rendering.
 *
 * Returns null for anything unparseable so callers can fall back cleanly.
 */
export function parseDay(value: DateInput): Date | null {
  const key = dayKey(value);
  if (!key) return null;

  const matched = DAY_KEY_PATTERN.exec(key);
  if (!matched) return null;

  const [, year, month, day] = matched;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
  return isValid(date) ? date : null;
}

/**
 * Render a calendar day. The result is identical in every timezone on earth.
 *
 *   formatDay(log.shiftDate)                            -> "Aug 11, 2026"
 *   formatDay(user.joiningDate, DATE_FORMATS.DAY_LONG)  -> "August 11, 2026"
 *   formatDay(null, DATE_FORMATS.DAY_SHORT, "N/A")      -> "N/A"
 */
export function formatDay(
  value: DateInput,
  pattern: string = DATE_FORMATS.DAY_SHORT,
  fallback = "",
): string {
  const date = parseDay(value);
  return date ? formatLocal(date, pattern) : fallback;
}

/** Render a start/end pair, e.g. "Aug 1, 2026 to Aug 11, 2026". */
export function formatDayRange(
  start: DateInput,
  end: DateInput,
  pattern: string = DATE_FORMATS.DAY_SHORT,
  separator = " to ",
): string {
  const from = formatDay(start, pattern);
  const to = formatDay(end, pattern);
  if (!from && !to) return "";
  if (!from) return to;
  if (!to) return from;
  return `${from}${separator}${to}`;
}

/** Shift a day key by a whole number of days. Pure key arithmetic — no timezone. */
export function addDaysToKey(value: DateInput, days: number): DayKey {
  const date = parseDay(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return formatLocal(date, DATE_FORMATS.KEY);
}

/** Shift a day key backwards by a whole number of days. */
export function subDaysFromKey(value: DateInput, days: number): DayKey {
  return addDaysToKey(value, -days);
}

/** The first day of the month a key falls in. */
export function startOfMonthKey(value: DateInput): DayKey {
  const date = parseDay(value);
  if (!date) return "";
  return formatLocal(new Date(date.getFullYear(), date.getMonth(), 1, 12), DATE_FORMATS.KEY);
}

/** The last day of the month a key falls in. */
export function endOfMonthKey(value: DateInput): DayKey {
  const date = parseDay(value);
  if (!date) return "";
  return formatLocal(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12), DATE_FORMATS.KEY);
}

/** True when two values land on the same calendar day. */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const left = dayKey(a);
  return left !== "" && left === dayKey(b);
}

/** True when the value is today on the business calendar. */
export function isToday(value: DateInput): boolean {
  return dayKey(value) === todayKey();
}

/**
 * Compare two calendar days. Negative when a is earlier, positive when later,
 * 0 when equal — sorts correctly because `yyyy-MM-dd` is lexicographically
 * ordered. Blank values sort last.
 */
export function compareDays(a: DateInput, b: DateInput): number {
  const left = dayKey(a);
  const right = dayKey(b);
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left < right ? -1 : left > right ? 1 : 0;
}

/* ==========================================================================
 * 2. INSTANT — rendered in the business timezone
 * ========================================================================== */

/**
 * Render a real timestamp (createdAt, updatedAt, changedAt) as wall-clock time
 * in the business timezone, so every viewer reads the same value.
 *
 *   formatInstant(log.changedAt)  ->  "Aug 11, 2026, 4:30 PM"  (everywhere)
 */
export function formatInstant(
  value: DateInput,
  pattern: string = DATE_FORMATS.INSTANT,
  fallback = "",
): string {
  if (value === null || value === undefined || value === "") return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return fallback;
  return formatInTimeZone(date, APP_TIMEZONE, pattern);
}

/** Render only the time-of-day portion of an instant, in the business timezone. */
export function formatClock(value: DateInput, fallback = ""): string {
  return formatInstant(value, DATE_FORMATS.CLOCK, fallback);
}

/**
 * The business-calendar day an instant falls on.
 *
 * Distinct from dayKey(): an entry created at 22:00 UTC on 10 Aug belongs to
 * 11 Aug in Karachi, and this returns "2026-08-11" where dayKey() would return
 * the UTC day. Use this only for true timestamps.
 */
export function instantToDayKey(value: DateInput): DayKey {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? formatInTimeZone(date, APP_TIMEZONE, DATE_FORMATS.KEY) : "";
}

/**
 * The UTC instant at which a business-calendar day starts.
 * Only needed when an endpoint wants a true timestamp rather than a day key.
 */
export function startOfDayInstant(value: DateInput): Date | null {
  const key = dayKey(value);
  if (!key) return null;
  return fromZonedTime(`${key} 00:00:00`, APP_TIMEZONE);
}

/* ==========================================================================
 * Month helpers for calendar UIs
 * ========================================================================== */

/**
 * Parse a `yyyy-MM` URL/query param into a Date on the business calendar,
 * falling back to the current month when absent or malformed.
 */
export function parseMonthParam(value: string | null | undefined): Date {
  if (value) {
    const parsed = parseLocal(value, DATE_FORMATS.MONTH_KEY, appNow());
    if (isValid(parsed)) return parsed;
  }
  return appNow();
}

/** Format a Date as the `yyyy-MM` month key used in query params. */
export function toMonthKey(date: Date): string {
  return formatLocal(date, DATE_FORMATS.MONTH_KEY);
}

/* ==========================================================================
 * Diagnostics
 * ========================================================================== */

/** The active business timezone, e.g. "Asia/Karachi". */
export function appTimeZone(): string {
  return APP_TIMEZONE;
}

/**
 * A short label for the active timezone, e.g. "PKT" or "GMT+5". Useful when a
 * timestamp needs to state which clock it is on.
 */
export function appTimeZoneLabel(): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value ?? APP_TIMEZONE;
  } catch {
    return APP_TIMEZONE;
  }
}
