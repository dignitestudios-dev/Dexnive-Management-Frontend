"use client";

import React from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_FORMATS, dayKey, formatDay, todayKey } from "@/lib/datetime";

/**
 * Chooses which day to log.
 *
 * Deliberately *not* a free calendar. The only days a user may file are today
 * and their own outstanding missing days — everything else is rejected by the
 * API (before the worklog system start date, a weekend, a holiday, or a day
 * already submitted). The missing-entries endpoint already applies all of those
 * rules, including the user's joining date, so its response is used verbatim
 * rather than being re-derived here.
 *
 * Renders as static text when today is the only option, so there's no dropdown
 * that can't go anywhere.
 */
export function LogDaySelect({
  value,
  missingDays,
  onChange,
}: {
  value: string;
  /** Outstanding days, oldest first. From toMissingDays(). */
  missingDays: string[];
  onChange: (day: string) => void;
}) {
  const today = todayKey();
  const selected = dayKey(value) || today;

  if (missingDays.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <CalendarDays className="w-4 h-4 text-primary-600 shrink-0" />
        <span className="font-medium">{formatDay(today, DATE_FORMATS.DAY_SHORT)}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
          Today
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1.5">
      <Select value={selected} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full sm:w-[260px] h-10 bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={today}>
            Today — {formatDay(today, DATE_FORMATS.DAY_SHORT)}
          </SelectItem>
          {missingDays.map((day) => (
            <SelectItem key={day} value={day} className="text-amber-700 font-medium">
              Missing — {formatDay(day, DATE_FORMATS.DAY_SHORT)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex items-center gap-1.5 text-[11px] text-amber-700">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        {missingDays.length} day{missingDays.length === 1 ? "" : "s"} still to log
      </span>
    </div>
  );
}
