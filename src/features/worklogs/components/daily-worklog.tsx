"use client";

import React, { useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import { dayKey, todayKey } from "@/lib/datetime";

import { useGetMyWorklogByDateQuery } from "../api/worklogs.queries";
import { DayComposer } from "./day-composer";
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
  const day = (defaultDate ? dayKey(defaultDate) : "") || todayKey();
  const isPastDay = day < todayKey();

  const { data: worklogResponse, isLoading } = useGetMyWorklogByDateQuery(day);
  const hasSubmission = !!worklogResponse?.data;

  const [backfilling, setBackfilling] = useState(false);

  // Reset the choice when the target day changes.
  useEffect(() => {
    setBackfilling(false);
  }, [day]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-6 h-6 text-primary-600" />
      </div>
    );
  }

  const needsReason = isPastDay && !hasSubmission && !backfilling;

  if (needsReason) {
    return (
      <MissingDayReasonCard
        shiftDate={day}
        onBackfill={() => setBackfilling(true)}
      />
    );
  }

  return (
    <DayComposer
      shiftDate={day}
      missingReason={isPastDay && !hasSubmission ? "forgot" : undefined}
    />
  );
}
