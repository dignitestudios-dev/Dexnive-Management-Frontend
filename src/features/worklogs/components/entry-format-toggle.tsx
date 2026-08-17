"use client";

import React from "react";
import { ListTree, PenLine } from "lucide-react";

import { cn } from "@/lib/utils";
import type { EntryFormat } from "../lib/entry-format";

/**
 * Switches one project entry between a structured task breakdown and free-form
 * notes.
 *
 * Only rendered for users allowed both — see canUseFreeForm(). It is a genuine
 * either/or because the API accepts exactly one of the two per entry, so this
 * is a segmented control rather than two collapsible sections.
 */
export function EntryFormatToggle({
  value,
  onChange,
  disabled,
}: {
  value: EntryFormat;
  onChange: (next: EntryFormat) => void;
  disabled?: boolean;
}) {
  const options: Array<{ value: EntryFormat; label: string; icon: React.ReactNode }> = [
    { value: "tasks", label: "Task breakdown", icon: <ListTree className="w-3.5 h-3.5" /> },
    { value: "notes", label: "Notes", icon: <PenLine className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      role="group"
      aria-label="Entry format"
      className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
