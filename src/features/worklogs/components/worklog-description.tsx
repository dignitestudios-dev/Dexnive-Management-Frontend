"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorklogDescriptionProps {
  description?: string;
  isBackend?: boolean;
  className?: string;
  lineClamp?: number;
}

export function WorklogDescription({
  description,
  isBackend,
  className,
  lineClamp,
}: WorklogDescriptionProps) {
  if (!description) return null;

  const isBackendFormat =
    isBackend ||
    description.split(/\r?\n/).some((line) =>
      /^\d+\.\)\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(HIGH|MEDIUM|LOW)/i.test(line.trim())
    );

  if (isBackendFormat) {
    const lines = description.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedTasks: { indexStr: string; module: string; task: string; difficulty?: string }[] = [];

    for (const line of lines) {
      const match = line.match(/^(\d+\.\))\s*(.+?)\s*\|\s*(.+?)(?:\s*\|\s*(HIGH|MEDIUM|LOW))?$/i);
      if (match) {
        parsedTasks.push({
          indexStr: match[1],
          module: match[2].trim(),
          task: match[3].trim(),
          difficulty: match[4] ? match[4].toUpperCase().trim() : undefined,
        });
      } else {
        parsedTasks.push({
          indexStr: "",
          module: "",
          task: line.replace(/^\d+\.\)\s*/, ""),
        });
      }
    }

    if (parsedTasks.length > 0) {
      return (
        <div className={cn("space-y-2", className)}>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
            Tasks & Modules
          </span>
          <div className="space-y-2">
            {parsedTasks.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50/90 border border-gray-200/60 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-gray-400 shrink-0 font-medium text-[11px]">
                    {t.indexStr || `${idx + 1}.`}
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
                      t.difficulty === "LOW" && "bg-emerald-50 text-emerald-700 border-emerald-200"
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
  }

  return (
    <div className={cn("", className)}>
      <p 
        className={cn("text-xs text-gray-700 leading-relaxed whitespace-pre-wrap", lineClamp && `line-clamp-${lineClamp}`)}
      >
        {description}
      </p>
    </div>
  );
}
