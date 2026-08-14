"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { toast } from "sonner";

import { Loader } from "@/components/ui/loader";
import { DATE_FORMATS, dayKey, formatDay, todayKey } from "@/lib/datetime";

import {
  useGetMyMissingEntriesQuery,
  useGetMyWorklogByDateQuery,
} from "../api/worklogs.queries";
import { nextMissingDay, toMissingDays } from "../lib/missing-days";
import { DayComposer } from "./day-composer";
import { LogDaySelect } from "./log-day-select";
import { MissingDayReasonCard } from "./missing-day-reason-card";

/**
 * Entry point for logging a single day.
 *
 * Today always goes straight to the composer. A *past* day with nothing saved
 * is a missing day: the user is asked why first, and only the "forgot" answer
 * routes into the composer (which then backfills through the missing-entry
 * endpoint rather than the plain draft one).
 *
 * Clearing a missing day chains straight into the next one, so a user with a
 * backlog works through it without returning to the dashboard between each.
 */
export function DailyWorklog({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter();

  const day = (defaultDate ? dayKey(defaultDate) : "") || todayKey();
  const isPastDay = day < todayKey();

  const { data: worklogResponse, isLoading } = useGetMyWorklogByDateQuery(day);
  const hasSubmission = !!worklogResponse?.data;

  // Owned here rather than inside the selector: finishing a day needs the list
  // to work out where to go next.
  const { data: missingData } = useGetMyMissingEntriesQuery();
  const missingDays = toMissingDays(missingData?.data);

  const [backfilling, setBackfilling] = useState(false);

  // Reset the choice when the target day changes.
  useEffect(() => {
    setBackfilling(false);
  }, [day]);

  const goToDay = (next: string) => {
    router.push(
      next === todayKey()
        ? "/dashboard/daily-log"
        : `/dashboard/daily-log?date=${next}`,
    );
  };

  /** Chain to the next outstanding day, or finish up on the dashboard. */
  const handleMissingDayResolved = (completedDay: string) => {
    const next = nextMissingDay(missingDays, completedDay);

    if (next) {
      toast.success(
        `Saved. Next up: ${formatDay(next, DATE_FORMATS.DAY_SHORT)}`,
      );
      goToDay(next);
      return;
    }

    toast.success("All caught up — nothing left to log.");
    router.push("/dashboard");
  };

  const needsReason = isPastDay && !hasSubmission && !backfilling;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Logging for
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Today, or a day you still owe.
          </p>
        </div>
        <LogDaySelect value={day} missingDays={missingDays} onChange={goToDay} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-6 h-6 text-primary-600" />
        </div>
      ) : needsReason ? (
        <MissingDayReasonCard
          shiftDate={day}
          onBackfill={() => setBackfilling(true)}
          onResolved={() => handleMissingDayResolved(day)}
        />
      ) : (
        <DayComposer
          shiftDate={day}
          missingReason={isPastDay && !hasSubmission ? "forgot" : undefined}
          onCompleted={() => {
            // Only a past day chains onward; submitting today leaves the user
            // on the locked view for the day they just filed.
            if (isPastDay) {
              handleMissingDayResolved(day);
            } else {
              toast.success("Worklog submitted and locked.");
            }
          }}
        />
      )}
    </div>
  );
}
