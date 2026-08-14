"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";

import { Loader } from "@/components/ui/loader";
import { dayKey, todayKey } from "@/lib/datetime";

import { useGetMyWorklogByDateQuery } from "../api/worklogs.queries";
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
 */
export function DailyWorklog({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter();

  const day = (defaultDate ? dayKey(defaultDate) : "") || todayKey();
  const isPastDay = day < todayKey();

  const { data: worklogResponse, isLoading } = useGetMyWorklogByDateQuery(day);
  const hasSubmission = !!worklogResponse?.data;

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
        <LogDaySelect value={day} onChange={goToDay} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader className="w-6 h-6 text-primary-600" />
        </div>
      ) : needsReason ? (
        <MissingDayReasonCard
          shiftDate={day}
          onBackfill={() => setBackfilling(true)}
          onResolved={() => goToDay(todayKey())}
        />
      ) : (
        <DayComposer
          shiftDate={day}
          missingReason={isPastDay && !hasSubmission ? "forgot" : undefined}
          onCompleted={() => {
            if (isPastDay) goToDay(todayKey());
          }}
        />
      )}
    </div>
  );
}
