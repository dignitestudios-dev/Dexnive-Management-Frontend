import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Coffee,
  FileQuestion,
  Hourglass,
  Palmtree,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Presentation for a timesheet calendar day.
 *
 * Both the employee's own timesheet and the admin per-user timesheet render
 * the same grid, so the mapping lives here rather than being duplicated (and
 * drifting) between them.
 *
 * Canonical statuses from the API are present | absent | other | holiday |
 * weekend. "submitted" and "draft" are tolerated because older responses and
 * the submission record itself use them.
 */
export interface DayStatusConfig {
  color: string;
  icon: LucideIcon | null;
  label: string;
}

const EMPTY: DayStatusConfig = {
  color: "bg-transparent text-transparent border-transparent",
  icon: null,
  label: "",
};

const CONFIG: Record<string, DayStatusConfig> = {
  present: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CalendarCheck,
    label: "Logged",
  },
  submitted: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CalendarCheck,
    label: "Logged",
  },
  draft: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    label: "Draft",
  },
  holiday: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Palmtree,
    label: "Holiday",
  },
  weekend: {
    color: "bg-gray-50 text-gray-500 border-gray-200",
    icon: Coffee,
    label: "Weekend",
  },
  absent: {
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
    label: "Absent",
  },
  // A missing day excused with reason "other" — explained, not unaccounted for,
  // so it reads as neutral rather than as a failure to log.
  other: {
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: FileQuestion,
    label: "Excused",
  },
};

/**
 * A submitted day that carries no project work at all — the whole day went to
 * `freeMinutes`, `leadWorkMinutes`, or both.
 *
 * Returns which kind it was, so a Lead who spent the day on lead work is not
 * labelled as having taken a free day.
 *
 * `null` means the day is not one of these (or is not submitted), and the
 * ordinary status badge applies.
 *
 * The "free" fallback covers days from before the timesheet endpoint returned
 * the split, where both fields come back as 0 — those still read as a free day
 * exactly as they did previously, rather than losing their label.
 */
export type NonProjectDayKind = "free" | "lead" | "mixed";

export function nonProjectDayKind(day?: {
  status?: string | null;
  projects?: unknown[] | null;
  workedMinutes?: number | null;
  freeMinutes?: number | null;
  leadWorkMinutes?: number | null;
}): NonProjectDayKind | null {
  if (!day) return null;

  const submitted = day.status === "present" || day.status === "submitted";
  if (!submitted) return null;
  if ((day.projects?.length ?? 0) !== 0) return null;
  if ((day.workedMinutes ?? 0) !== 0) return null;

  const lead = day.leadWorkMinutes ?? 0;
  const free = day.freeMinutes ?? 0;

  if (lead > 0 && free > 0) return "mixed";
  if (lead > 0) return "lead";
  return "free";
}

/** Kept as the boolean form for callers that only need "is it one of these". */
export function isNoProjectWorkDay(
  day?: Parameters<typeof nonProjectDayKind>[0],
): boolean {
  return nonProjectDayKind(day) !== null;
}

/**
 * Violet for lead work throughout — it matches the lead-work segment on the
 * day budget bar and the lead-work chip in the day details, so the colour
 * means the same thing wherever it appears.
 */
const NON_PROJECT_DAY: Record<NonProjectDayKind, DayStatusConfig> = {
  free: {
    color: "bg-sky-50 text-sky-700 border-sky-200",
    icon: Hourglass,
    label: "Free day",
  },
  lead: {
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: ShieldCheck,
    label: "Lead work",
  },
  mixed: {
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: ShieldCheck,
    label: "Non-project",
  },
};

/**
 * Badge for a calendar day. Pass the whole day where available so a logged-but-
 * empty day reads as "Free day" instead of "Logged" next to a 0h total.
 */
export function getDayStatusConfig(
  status?: string | null,
  day?: Parameters<typeof isNoProjectWorkDay>[0],
): DayStatusConfig {
  if (!status) return EMPTY;
  const nonProject = nonProjectDayKind(day);
  if (nonProject) return NON_PROJECT_DAY[nonProject];
  return (
    CONFIG[status] ?? {
      color: "bg-gray-50 text-gray-600 border-gray-200",
      icon: Clock,
      label: "Pending",
    }
  );
}

/** Config for an empty calendar cell (no data for that day). */
export const EMPTY_DAY_STATUS = EMPTY;
