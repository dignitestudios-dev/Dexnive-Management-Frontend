"use client";

import React from "react";
import { Briefcase, Coffee, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DATE_FORMATS, formatDay } from "@/lib/datetime";

/** How the day is being accounted for. */
export type DayMode = "projects" | "free" | "leadWork";

/**
 * The first question of the day: did you work on projects, or not?
 *
 * Answering up front means the common "nothing assigned today" case never has
 * to walk through an empty project form, and the project form is only ever
 * shown to someone who actually has project time to enter.
 *
 * Leads get a third option, since a whole day of internal lead duties is a
 * normal outcome for them and is tracked separately from free time.
 */
export function DayModeChooser({
  shiftDate,
  canLogLeadWork,
  onChoose,
}: {
  shiftDate: string;
  canLogLeadWork: boolean;
  onChoose: (mode: DayMode) => void;
}) {
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

  return (
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
            onClick={() => onChoose(option.value)}
            className={cn(
              "w-full text-left rounded-xl border border-gray-200 bg-white p-4",
              "flex items-start gap-3.5 transition-all",
              "hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
            )}
          >
            <span className={cn("mt-0.5 shrink-0", option.accent)}>{option.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">
                {option.title}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{option.body}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
