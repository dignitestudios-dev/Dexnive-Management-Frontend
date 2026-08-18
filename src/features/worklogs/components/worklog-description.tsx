"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryEntry, TaskBreakdown } from "../types";

/** Populated refs come back as {_id, name}; older payloads may be bare ids. */
function refName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value as { name?: string }).name ?? "";
}

/**
 * What was worked on for one project entry, grouped by category.
 *
 * Each block holds either a task breakdown or a description — never both.
 * Entries logged before categories existed arrive with an empty array; those
 * render an explicit note rather than blank space, since their original text is
 * no longer surfaced by the API.
 */
export function WorklogDescription({
  categoryEntries,
  className,
  lineClamp,
}: {
  categoryEntries?: CategoryEntry[];
  className?: string;
  lineClamp?: number;
}) {
  if (!categoryEntries || categoryEntries.length === 0) {
    return (
      <p className={cn("text-xs text-gray-400 italic", className)}>
        No breakdown recorded
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {categoryEntries.map((block, index) => (
        <div key={index} className="rounded-lg border border-gray-200/70 bg-gray-50/60 p-3">
          <span className="inline-flex items-center gap-1.5 mb-2">
            <Layers className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
              {refName(block.category) || "Uncategorised"}
            </span>
          </span>

          {block.tasks && block.tasks.length > 0 ? (
            <TaskList tasks={block.tasks} />
          ) : block.description ? (
            <p
              className={cn(
                "text-xs text-gray-700 leading-relaxed whitespace-pre-wrap",
                lineClamp && `line-clamp-${lineClamp}`,
              )}
            >
              {block.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TaskList({ tasks }: { tasks: TaskBreakdown[] }) {
  return (
    <div className="space-y-1.5">
      {tasks.map((task, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-white border border-gray-200/70 text-xs"
        >
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-gray-400 shrink-0 font-medium text-[11px]">
              {index + 1}.
            </span>
            {refName(task.module) && (
              <span className="font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 shrink-0">
                {refName(task.module)}
              </span>
            )}
            <span className="text-gray-800 leading-normal break-words">{task.task}</span>
          </div>
          {task.difficulty && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] font-semibold px-2 py-0.5 border self-start sm:self-auto",
                task.difficulty === "HIGH" && "bg-red-50 text-red-700 border-red-200",
                task.difficulty === "MEDIUM" && "bg-amber-50 text-amber-700 border-amber-200",
                task.difficulty === "LOW" && "bg-emerald-50 text-emerald-700 border-emerald-200",
              )}
            >
              {task.difficulty}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
