import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Coffee,
  FileQuestion,
  Palmtree,
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

export function getDayStatusConfig(status?: string | null): DayStatusConfig {
  if (!status) return EMPTY;
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
