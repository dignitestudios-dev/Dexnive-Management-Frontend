"use client";

import React, { useState } from "react";
import { ArrowRight, Briefcase, Coffee, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, formatDay } from "@/lib/datetime";
import { STANDARD_WORK_MINUTES, formatMinutes } from "../lib/day-balance";

/** How the day is being accounted for. */
export type DayMode = "projects" | "free" | "leadWork";

/** The whole-day options, which submit straight from this step. */
export type WholeDayMode = Exclude<DayMode, "projects">;

/**
 * The first question of the day: did you work on projects, or not?
 *
 * Answering up front means the common "nothing assigned today" case never has
 * to walk through an empty project form. Those whole-day answers submit
 * directly from here — there is nothing further to enter — behind a
 * confirmation, since submitting locks the day.
 *
 * Leads get a third option, since a whole day of internal lead duties is a
 * normal outcome for them and is tracked separately from free time.
 */
export function DayModeChooser({
  shiftDate,
  canLogLeadWork,
  isSubmitting,
  onChooseProjects,
  onSubmitWholeDay,
}: {
  shiftDate: string;
  canLogLeadWork: boolean;
  isSubmitting?: boolean;
  onChooseProjects: () => void;
  onSubmitWholeDay: (mode: WholeDayMode) => void;
}) {
  const [selected, setSelected] = useState<DayMode | null>(null);
  const [confirming, setConfirming] = useState(false);

  const options: Array<{
    value: DayMode;
    icon: React.ReactNode;
    title: string;
    body: string;
    accent: string;
  }> = [
    {
      value: "projects",
      icon: <Briefcase className="w-5 h-5" />,
      title: "I worked on projects",
      body: "Enter your hours per project. You can add free time for the rest of the day.",
      accent: "text-primary-600",
    },
    {
      value: "free",
      icon: <Coffee className="w-5 h-5" />,
      title: "Full day free",
      body: "No project work was assigned to me today.",
      accent: "text-sky-600",
    },
    ...(canLogLeadWork
      ? [
          {
            value: "leadWork" as const,
            icon: <ShieldCheck className="w-5 h-5" />,
            title: "Full day lead work",
            body: "Internal lead duties all day, not billed to a project.",
            accent: "text-violet-600",
          },
        ]
      : []),
  ];

  const isWholeDay = selected === "free" || selected === "leadWork";

  const handlePrimary = () => {
    if (selected === "projects") {
      onChooseProjects();
      return;
    }
    if (isWholeDay) setConfirming(true);
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto p-6 shadow-sm border-gray-200 rounded-xl bg-white">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            How did your day go?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDay(shiftDate, DATE_FORMATS.DAY_FULL)}
          </p>
        </div>

        <div className="space-y-2.5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              aria-pressed={selected === option.value}
              className={cn(
                "w-full text-left rounded-xl border p-4 flex items-start gap-3.5 transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                selected === option.value
                  ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 shrink-0",
                  selected === option.value ? option.accent : "text-gray-400",
                )}
              >
                {option.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">
                  {option.title}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {option.body}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={handlePrimary}
            disabled={!selected || isSubmitting}
            className="h-10 bg-primary-600 hover:bg-primary-700 text-white min-w-[150px]"
          >
            {isWholeDay ? (
              "Submit day"
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </Card>

      <ConfirmWholeDayDialog
        open={confirming}
        onOpenChange={setConfirming}
        mode={isWholeDay ? (selected as WholeDayMode) : "free"}
        shiftDate={shiftDate}
        isSubmitting={isSubmitting}
        onConfirm={() => onSubmitWholeDay(selected as WholeDayMode)}
      />
    </>
  );
}

/**
 * Submitting locks the day, and this path skips the composer entirely, so the
 * user gets one explicit checkpoint stating exactly what will be recorded.
 */
function ConfirmWholeDayDialog({
  open,
  onOpenChange,
  mode,
  shiftDate,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: WholeDayMode;
  shiftDate: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
}) {
  const label = mode === "free" ? "free time" : "lead work";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Submit this day?</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div
            className={cn(
              "rounded-lg border p-3.5",
              mode === "free"
                ? "border-sky-200 bg-sky-50"
                : "border-violet-200 bg-violet-50",
            )}
          >
            <p className="text-sm font-medium text-gray-900">
              {formatDay(shiftDate, DATE_FORMATS.DAY_FULL)}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              The whole day —{" "}
              <span className="font-semibold tabular-nums">
                {formatMinutes(STANDARD_WORK_MINUTES)}
              </span>{" "}
              — will be recorded as {label}, with no project hours.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            This submits and locks the day. You won&apos;t be able to edit it
            afterwards — an admin or lead would need to reset it first.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[130px]"
          >
            {isSubmitting ? <Loader className="w-4 h-4 mr-2" /> : null}
            Yes, submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
