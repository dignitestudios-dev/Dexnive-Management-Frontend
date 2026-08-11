/**
 * The single source of truth for the timezone this platform operates in.
 *
 * Every "what day is it", "what year is it" and every rendered timestamp in the
 * app resolves through this value — never through the viewer's system clock.
 * A user in Karachi, London or New York therefore sees exactly the same data.
 *
 * ---------------------------------------------------------------------------
 * To move the whole platform to another timezone, change this one value
 * (or set NEXT_PUBLIC_APP_TIMEZONE) and rebuild. Nothing else needs touching.
 *
 *   Asia/Karachi     Pakistan          (current)
 *   Europe/Berlin    Central Europe
 *   Europe/London    United Kingdom
 *   America/New_York US Eastern
 * ---------------------------------------------------------------------------
 *
 * Must be a valid IANA timezone identifier. DST is handled automatically by the
 * Intl engine, so zones that observe it (e.g. Europe/Berlin) work unchanged.
 */
export const APP_TIMEZONE: string =
  process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim() || "Asia/Karachi";

/**
 * Whether business dates coming from the API are anchored at UTC midnight.
 *
 * The backend normalises every calendar-day field (shiftDate, joiningDate,
 * plannedStartDate, ...) with `toUTCDayStart()`, so `2026-08-11` is stored and
 * returned as `2026-08-11T00:00:00.000Z`. The date part of that string *is* the
 * business day and must be read verbatim rather than converted into any zone.
 *
 * See Dexnive-Management-Backend/src/core/common/helpers/date.helpers.js
 */
export const API_DATES_ARE_UTC_ANCHORED = true;
