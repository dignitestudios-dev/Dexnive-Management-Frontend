"use client";

import React from "react";
import { Coffee, Info, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMinutes } from "../lib/day-balance";

/**
 * The day-level facts that sit outside the per-project rows: free time, lead
 * work, and any non-billable time the server couldn't attribute to a project.
 *
 * Shared by the employee timesheet and the admin per-user timesheet. Renders
 * nothing when the day has none of them, so it can be dropped in unconditionally.
 */
export function TimesheetDayExtras({ day }: { day: any }) {
  const free = day?.freeMinutes ?? 0;
  const leadWork = day?.leadWorkMinutes ?? 0;
  const unassigned = day?.unassignedNonBillableMinutes ?? 0;

  if (free <= 0 && leadWork <= 0 && unassigned <= 0) return null;

  return (
    <div className="mb-5 space-y-3">
      {(free > 0 || leadWork > 0) && (
        <div className="flex flex-wrap gap-2">
          {free > 0 && (
            <Chip
              icon={<Coffee className="w-3.5 h-3.5" />}
              label="Free time"
              value={formatMinutes(free)}
              className="text-sky-700 bg-sky-50 border-sky-200"
            />
          )}
          {leadWork > 0 && (
            <Chip
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label="Lead work"
              value={formatMinutes(leadWork)}
              className="text-violet-700 bg-violet-50 border-violet-200"
            />
          )}
        </div>
      )}

      {unassigned > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs min-w-0">
            <p className="font-medium text-amber-900">
              {formatMinutes(unassigned)} non-billable, not tied to a project
            </p>
            {day?.unassignedNonBillableNote && (
              <p className="text-amber-800 mt-1 italic break-words">
                &ldquo;{day.unassignedNonBillableNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {icon}
      {label}
      <span className="tabular-nums font-semibold">{value}</span>
    </span>
  );
}
