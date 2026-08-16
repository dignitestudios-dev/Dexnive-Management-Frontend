"use client";

import React from "react";
import { Coffee, Info, ShieldCheck, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WorklogDescription } from "./worklog-description";
import { formatMinutes } from "../lib/day-balance";
import type { WorklogEntry, WorklogSubmission } from "../types";

/**
 * The server's computed breakdown of a day, read-only.
 *
 * Everything here is derived — the split between billable, non-billable and
 * overtime is decided by the API, so this panel reports rather than edits.
 */
export function DayResultPanel({
  worklog,
}: {
  worklog: WorklogSubmission;
}) {
  const entries = worklog.entries ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-5 shadow-sm border-gray-200 rounded-xl bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Logged"
            minutes={worklog.totalLoggedMinutes}
            className="text-gray-900"
          />
          <Stat
            label="Billable"
            minutes={worklog.totalBillableMinutes}
            className="text-primary-700"
          />
          <Stat
            label="Non-billable"
            minutes={worklog.totalNonBillableMinutes}
            className="text-amber-700"
          />
          <Stat
            label="Overtime"
            minutes={worklog.totalOvertimeMinutes}
            className="text-orange-600"
          />
        </div>

        {(worklog.freeMinutes > 0 || worklog.leadWorkMinutes > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
            {worklog.freeMinutes > 0 && (
              <Chip
                icon={<Coffee className="w-3.5 h-3.5" />}
                label="Free time"
                value={formatMinutes(worklog.freeMinutes)}
                className="text-sky-700 bg-sky-50 border-sky-200"
              />
            )}
            {worklog.leadWorkMinutes > 0 && (
              <Chip
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="Lead work"
                value={formatMinutes(worklog.leadWorkMinutes)}
                className="text-violet-700 bg-violet-50 border-violet-200"
              />
            )}
          </div>
        )}

        {(worklog.unassignedNonBillableMinutes ?? 0) > 0 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-amber-900">
                {formatMinutes(worklog.unassignedNonBillableMinutes)} not assigned to a
                project
              </p>
              {worklog.unassignedNonBillableNote && (
                <p className="text-amber-800 mt-1 italic">
                  &ldquo;{worklog.unassignedNonBillableNote}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {entries.length > 0 && (
        <Card className="shadow-sm border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <h3 className="text-sm font-semibold text-gray-900">
              Projects ({entries.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <EntryRow key={entry._id} entry={entry} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: WorklogEntry }) {
  const projectName =
    typeof entry.project === "object" ? entry.project?.name : "Project";

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{projectName}</p>
          {typeof entry.stage === "object" && entry.stage?.name && (
            <p className="text-xs text-gray-500 mt-0.5">{entry.stage.name}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs shrink-0">
          <span className="font-semibold text-gray-900 tabular-nums">
            {formatMinutes(entry.loggedMinutes)}
          </span>
          {entry.nonBillableMinutes > 0 && (
            <span className="text-amber-700 tabular-nums">
              +{formatMinutes(entry.nonBillableMinutes)} non-billable
            </span>
          )}
          {entry.overtimeMinutes > 0 && (
            <span className="text-orange-600 tabular-nums flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {formatMinutes(entry.overtimeMinutes)}
            </span>
          )}
        </div>
      </div>

      {(entry.tasks?.length || entry.description) && (
        <div className="mt-3">
          <WorklogDescription tasks={entry.tasks} description={entry.description} />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  minutes,
  className,
}: {
  label: string;
  minutes: number;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className={cn("text-lg font-semibold tabular-nums mt-0.5", className)}>
        {formatMinutes(minutes ?? 0)}
      </p>
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
