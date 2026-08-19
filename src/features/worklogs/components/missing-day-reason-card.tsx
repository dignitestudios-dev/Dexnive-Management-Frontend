"use client";

import React, { useState } from "react";
import { CalendarX, PencilLine, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, formatDay } from "@/lib/datetime";

import { useSubmitMissingReasonMutation } from "../api/worklogs.mutations";

type Choice = "forgot" | "absent" | "other";

/**
 * Asks why a past working day has no submission.
 *
 * "forgot" hands off to the day composer, which backfills through the same
 * rules as a normal draft — including a whole free day, which is just a
 * backfill with no project entries. The other two are terminal: a reason,
 * optionally a note, and the day is closed out.
 *
 * All three reasons are available to every role that reaches this screen. Only
 * Admin is exempt from daily worklog tracking, and Admins are redirected away
 * from the worklog pages entirely.
 */
export function MissingDayReasonCard({
  shiftDate,
  onBackfill,
  onResolved,
}: {
  shiftDate: string;
  onBackfill: () => void;
  onResolved?: () => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [note, setNote] = useState("");

  const mutation = useSubmitMissingReasonMutation();

  const submit = () => {
    if (choice === "absent") {
      mutation.mutate(
        { shiftDate, reason: "absent" },
        {
          onSuccess: () => onResolved?.(),
          onError: (error: any) =>
            toast.error(error?.message || "Failed to save reason"),
        },
      );
      return;
    }

    if (choice === "other") {
      const trimmed = note.trim();
      if (!trimmed) {
        toast.error("Please explain what happened on this day.");
        return;
      }
      mutation.mutate(
        { shiftDate, reason: "other", note: trimmed },
        {
          onSuccess: () => onResolved?.(),
          onError: (error: any) =>
            toast.error(error?.message || "Failed to save reason"),
        },
      );
    }
  };

  const options: Array<{
    value: Choice;
    icon: React.ReactNode;
    title: string;
    body: string;
  }> = [
    {
      value: "forgot",
      icon: <PencilLine className="w-4 h-4" />,
      title: "I just forgot to log it",
      // Covers a free day too: with no project entries, a "forgot" backfill is
      // how a wholly-free past day is recorded.
      body: "Fill it in now — project hours, or a full free day.",
    },
    {
      value: "absent",
      icon: <UserX className="w-4 h-4" />,
      title: "I didn't work this day",
      body: "Leave, sick day, or otherwise off.",
    },
    {
      value: "other",
      icon: <CalendarX className="w-4 h-4" />,
      title: "Something else",
      body: "Explain in a short note.",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 shadow-sm border-gray-200 rounded-xl bg-white">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Nothing logged for this day
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatDay(shiftDate, DATE_FORMATS.DAY_FULL)} — tell us what happened so
          your timesheet stays accurate.
        </p>
      </div>

      <div className="space-y-2.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setChoice(option.value)}
            onDoubleClick={() => {
              if (mutation.isPending) return;
              setChoice(option.value);
              if (option.value === "forgot") {
                onBackfill();
              } else if (option.value === "absent") {
                mutation.mutate(
                  { shiftDate, reason: "absent" },
                  {
                    onSuccess: () => onResolved?.(),
                    onError: (error: any) =>
                      toast.error(error?.message || "Failed to save reason"),
                  },
                );
              }
            }}
            className={cn(
              "w-full text-left rounded-xl border p-4 transition-all flex items-start gap-3",
              choice === option.value
                ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-200"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            <span
              className={cn(
                "mt-0.5 shrink-0",
                choice === option.value ? "text-primary-600" : "text-gray-400",
              )}
            >
              {option.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900">
                {option.title}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{option.body}</span>
            </span>
          </button>
        ))}
      </div>

      {choice === "other" && (
        <div className="mt-4 space-y-1.5">
          <label htmlFor="missing-note" className="text-sm font-medium text-gray-700">
            What happened?
          </label>
          <Textarea
            id="missing-note"
            autoFocus
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Public holiday not yet in the system"
            className="bg-white border-gray-200 text-sm resize-none"
          />
        </div>
      )}

      <div className="mt-5 flex justify-end">
        {choice === "forgot" ? (
          <Button
            type="button"
            onClick={onBackfill}
            className="h-10 bg-primary-600 hover:bg-primary-700 text-white"
          >
            Log my hours
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={!choice || mutation.isPending}
            className="h-10 bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
          >
            {mutation.isPending ? <Loader className="w-4 h-4 mr-2" /> : null}
            Save
          </Button>
        )}
      </div>
    </Card>
  );
}
