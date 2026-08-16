"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskBreakdown } from "../types";

/** `1.) Auth | Fix login | HIGH` — the pre-structured-tasks description format. */
const LEGACY_LINE = /^(\d+\.\))\s*(.+?)\s*\|\s*(.+?)(?:\s*\|\s*(HIGH|MEDIUM|LOW))?$/i;

interface WorklogDescriptionProps {
  /** Structured breakdown — the format everything is logged in now. */
  tasks?: TaskBreakdown[];
  /** Legacy freeform note, only present on entries created before the switch. */
  description?: string | null;
  className?: string;
  lineClamp?: number;
}

/**
 * Renders what was worked on for a single project entry.
 *
 * Prefers the structured `tasks` array. Entries predating the structured API
 * carry a `description` instead — those are still parsed for the old
 * `1.) Module | Task | HIGH` shape so historical worklogs keep rendering as
 * task rows rather than degrading to a wall of text.
 */
export function WorklogDescription({
  tasks,
  description,
  className,
  lineClamp,
}: WorklogDescriptionProps) {
  if (tasks && tasks.length > 0) {
    return <TaskList tasks={tasks} className={className} />;
  }

  if (!description) return null;

  const legacy = parseLegacyDescription(description);
  if (legacy.length > 0) {
    return <TaskList tasks={legacy} className={className} />;
  }

  return (
    <div className={cn("", className)}>
      <p
        className={cn(
          "text-xs text-gray-700 leading-relaxed whitespace-pre-wrap",
          lineClamp && `line-clamp-${lineClamp}`,
        )}
      >
        {description}
      </p>
    </div>
  );
}

function TaskList({
  tasks,
  className,
}: {
  tasks: TaskBreakdown[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
        Tasks &amp; Modules
      </span>
      <div className="space-y-2">
        {tasks.map((t, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50/90 border border-gray-200/60 text-xs"
          >
            <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-gray-400 shrink-0 font-medium text-[11px]">
                {idx + 1}.
              </span>
              {t.module && (
                <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 shrink-0">
                  {t.module}
                </span>
              )}
              <span className="text-gray-800 leading-normal break-words">{t.task}</span>
            </div>
            {t.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[10px] font-semibold px-2 py-0.5 border self-start sm:self-auto",
                  t.difficulty === "HIGH" && "bg-red-50 text-red-700 border-red-200",
                  t.difficulty === "MEDIUM" && "bg-amber-50 text-amber-700 border-amber-200",
                  t.difficulty === "LOW" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                )}
              >
                {t.difficulty}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pull task rows out of a legacy description. Returns [] unless every non-empty
 * line parses, so an ordinary note is never mangled into half-rows.
 */
function parseLegacyDescription(description: string): TaskBreakdown[] {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const parsed: TaskBreakdown[] = [];
  for (const line of lines) {
    const match = line.match(LEGACY_LINE);
    if (!match) return [];
    parsed.push({
      module: match[2].trim().toUpperCase(),
      task: match[3].trim(),
      difficulty: (match[4]?.toUpperCase().trim() ?? "LOW") as TaskBreakdown["difficulty"],
    });
  }
  return parsed;
}
