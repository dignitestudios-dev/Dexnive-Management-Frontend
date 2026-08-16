"use client";

import React, { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_TASKS_PER_ENTRY } from "../types";
import { ModuleCombobox } from "./module-combobox";

/** A blank row. Difficulty defaults to LOW so the field is never unset. */
export const EMPTY_TASK = { module: "", task: "", difficulty: "LOW" as const };

/** `1.) Auth | Fix login | HIGH` — the bulk-paste line format. */
const PASTE_LINE = /^\d+\.\)\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(HIGH|MEDIUM|LOW)\s*$/i;

/**
 * Module / task / difficulty rows for a single project entry.
 *
 * These are sent as a structured `tasks` array. Previously the same three
 * fields were concatenated into `description` as numbered pipe-delimited text;
 * the API takes real objects now, so nothing is serialised on the way out.
 *
 * The bulk-paste affordance is kept — it is genuinely useful for people
 * pasting a standup list — it just fills the field array instead of a string.
 */
export function TaskBreakdownFields({
  control,
  entryIndex,
  disabled,
}: {
  control: any;
  entryIndex: number;
  disabled?: boolean;
}) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `entries.${entryIndex}.tasks`,
  });

  // Every entry must carry at least one task, so never leave the list empty.
  useEffect(() => {
    if (fields.length === 0) append({ ...EMPTY_TASK });
  }, [fields.length, append]);

  const atLimit = fields.length >= MAX_TASKS_PER_ENTRY;

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("Text");
    if (!text) return;

    // Only intercept things that look like a task list; let normal paste be normal.
    const looksLikeTaskList = /\d+\.\)/.test(text) && text.includes("|");
    if (!looksLikeTaskList) return;

    e.preventDefault();

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{ module: string; task: string; difficulty: string }> = [];
    const bad: string[] = [];

    for (const line of lines) {
      const match = line.match(PASTE_LINE);
      if (match) {
        parsed.push({
          module: match[1].trim().toUpperCase(),
          task: match[2].trim(),
          difficulty: match[3].toUpperCase().trim(),
        });
      } else {
        bad.push(line);
      }
    }

    if (parsed.length === 0) {
      toast.error("Bad format. Use this format to paste tasks:", {
        description:
          "1.) Module Name | Task Description | HIGH\n2.) Module Name | Task Description | LOW\n\nDifficulty must be HIGH, MEDIUM, or LOW.",
        duration: 6000,
      });
      return;
    }

    const capped = parsed.slice(0, MAX_TASKS_PER_ENTRY);

    if (bad.length > 0) {
      toast.warning(
        `${capped.length} task(s) pasted. ${bad.length} line(s) skipped due to bad format.`,
        { description: "Expected: 1.) Module | Task | HIGH/MEDIUM/LOW", duration: 4000 },
      );
    }
    if (parsed.length > capped.length) {
      toast.warning(
        `Only the first ${MAX_TASKS_PER_ENTRY} tasks were kept — that's the limit per project.`,
      );
    }

    replace(capped);
  };

  return (
    <div className="w-full space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-row gap-2 items-start group">
          <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right pt-2.5">
            {index + 1}.
          </span>

          <FormField
            control={control}
            name={`entries.${entryIndex}.tasks.${index}.module`}
            render={({ field }) => (
              <FormItem className="flex-[1] space-y-0 min-w-0">
                <FormControl>
                  <ModuleCombobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-red-500 font-normal mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`entries.${entryIndex}.tasks.${index}.task`}
            render={({ field }) => (
              <FormItem className="flex-[2] space-y-0 min-w-0">
                <FormControl>
                  <Input
                    placeholder="Task"
                    maxLength={500}
                    disabled={disabled}
                    className="h-9 bg-white border-gray-200 text-sm"
                    {...field}
                    onPaste={handlePaste}
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-red-500 font-normal mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`entries.${entryIndex}.tasks.${index}.difficulty`}
            render={({ field }) => (
              <FormItem className="w-[105px] space-y-0 shrink-0">
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 bg-white border-gray-200 text-xs font-medium">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH" className="text-red-600 font-medium text-xs">
                        HIGH
                      </SelectItem>
                      <SelectItem value="MEDIUM" className="text-amber-600 font-medium text-xs">
                        MEDIUM
                      </SelectItem>
                      <SelectItem value="LOW" className="text-emerald-600 font-medium text-xs">
                        LOW
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="text-gray-300 hover:text-red-500 hover:bg-red-50 w-7 h-9 rounded-md shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              onClick={() => remove(index)}
              aria-label={`Remove task ${index + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pl-7">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || atLimit}
          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 h-7 px-2 text-xs font-medium"
          onClick={() => append({ ...EMPTY_TASK })}
        >
          <Plus className="w-3 h-3 mr-1" /> Add Task
        </Button>
        {atLimit && (
          <span className="text-[11px] text-gray-400">
            Limit of {MAX_TASKS_PER_ENTRY} tasks reached
          </span>
        )}
      </div>
    </div>
  );
}
