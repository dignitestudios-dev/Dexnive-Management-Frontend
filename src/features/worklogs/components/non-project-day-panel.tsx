"use client";

import React from "react";
import { Hourglass, ShieldCheck } from "lucide-react";

import { formatMinutes } from "../lib/day-balance";
import { nonProjectDayKind } from "../lib/timesheet-status";

/**
 * Shown in the day details dialog when a submitted day carries no project work.
 *
 * Replaces the flat "Free day" message that both timesheets used to render:
 * the timesheet endpoint now returns `freeMinutes` and `leadWorkMinutes` per
 * day, so a Lead's day of lead work is no longer reported as time off.
 *
 * Renders nothing for any other kind of day.
 */
export function NonProjectDayPanel({ day }: { day: any }) {
  const kind = nonProjectDayKind(day);
  if (!kind) return null;

  const free = day?.freeMinutes ?? 0;
  const leadWork = day?.leadWorkMinutes ?? 0;

  if (kind === "free") {
    return (
      <Panel
        icon={<Hourglass className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />}
        className="bg-sky-50 border-sky-100"
        titleClassName="text-sky-900"
        bodyClassName="text-sky-700"
        title="Free day"
        body={
          free > 0
            ? `${formatMinutes(free)} of free time, with no project work logged.`
            : "A full day was logged with no project work assigned."
        }
      />
    );
  }

  return (
    <Panel
      icon={<ShieldCheck className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />}
      className="bg-violet-50 border-violet-100"
      titleClassName="text-violet-900"
      bodyClassName="text-violet-700"
      title={kind === "lead" ? "Lead work day" : "Non-project day"}
      body={
        kind === "lead"
          ? `${formatMinutes(leadWork)} of lead work, with no project work logged.`
          : `${formatMinutes(leadWork)} of lead work and ${formatMinutes(
              free,
            )} of free time, with no project work logged.`
      }
    />
  );
}

function Panel({
  icon,
  title,
  body,
  className,
  titleClassName,
  bodyClassName,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  className: string;
  titleClassName: string;
  bodyClassName: string;
}) {
  return (
    <div className={`border p-4 rounded-lg flex items-start gap-3 ${className}`}>
      {icon}
      <div>
        <p className={`font-medium ${titleClassName}`}>{title}</p>
        <p className={`text-sm mt-1 ${bodyClassName}`}>{body}</p>
      </div>
    </div>
  );
}
