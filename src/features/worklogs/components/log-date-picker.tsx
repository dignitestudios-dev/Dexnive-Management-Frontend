"use client";

import React, { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, dayKey, formatDay, parseDay, todayKey } from "@/lib/datetime";

/**
 * Picks which day to log.
 *
 * This is the only route to a past day for Leads: the API reports no missing
 * entries for them (they're exempt from daily worklog tracking), so the
 * dashboard's missing-days prompt never appears for a Lead even though they
 * are allowed to backfill via the "forgot" reason.
 *
 * Future dates are disabled — the API rejects them outright.
 */
export function LogDatePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (day: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const today = todayKey();
  const selected = parseDay(value) ?? undefined;
  const isToday = dayKey(value) === today;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 justify-between gap-2 bg-white border-gray-200 font-normal",
            className,
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <CalendarDays className="w-4 h-4 text-primary-600 shrink-0" />
            <span className="truncate text-sm text-gray-900">
              {formatDay(value, DATE_FORMATS.DAY_SHORT, "Pick a date")}
            </span>
            {isToday && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 shrink-0">
                Today
              </span>
            )}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-auto p-0 z-[100]" align="end">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date: Date | undefined) => {
            if (!date) return;
            const key = dayKey(date);
            if (!key || key > today) return;
            onChange(key);
            setOpen(false);
          }}
          disabled={(date: Date) => dayKey(date) > today}
        />
        <div className="border-t border-gray-100 p-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isToday}
            onClick={() => {
              onChange(today);
              setOpen(false);
            }}
            className="h-7 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Jump to today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
