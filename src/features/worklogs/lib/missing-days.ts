import { dayKey, todayKey } from "@/lib/datetime";

/**
 * Normalise the missing-entries response into a sorted list of day keys.
 *
 * The endpoint returns either bare date strings or `{ shiftDate }` objects
 * depending on the call site, and has been known to include a literal "null",
 * so both are handled here rather than at each consumer.
 *
 * Sorted oldest first: a backlog is cleared chronologically, and that ordering
 * is what drives "log this one, then the next one".
 */
export function toMissingDays(data: unknown): string[] {
  if (!Array.isArray(data)) return [];

  const today = todayKey();

  return data
    .map((entry: any) =>
      dayKey(typeof entry === "string" ? entry : entry?.shiftDate),
    )
    .filter((day): day is string => !!day && day !== "null" && day < today)
    .filter((day, index, all) => all.indexOf(day) === index)
    .sort();
}

/**
 * The day to send the user to after they finish `completedDay`.
 *
 * Returns the oldest still-outstanding day, or null when the backlog is clear.
 * `completedDay` is filtered out explicitly rather than relying on a refetch
 * having landed, so this is correct the instant a submission succeeds.
 */
export function nextMissingDay(
  missingDays: string[],
  completedDay: string,
): string | null {
  const remaining = missingDays.filter((day) => day !== dayKey(completedDay));
  return remaining.length > 0 ? remaining[0] : null;
}
