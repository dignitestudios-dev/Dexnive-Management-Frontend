"use client";

import React, { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

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
import { MAX_TASKS_PER_CATEGORY } from "../types";
import { ModuleSelect } from "./module-select";

/** A blank task line. Complexity defaults to LOW so the field is never unset. */
export const EMPTY_TASK = { module: "", task: "", difficulty: "LOW" as const };

/**
 * Module / description / complexity lines within one category block.
 *
 * Only rendered for departments that log a structured breakdown — Module is a
 * required field on every line, so departments without a Module field use a
 * plain description instead.
 */
export function TaskRows({
  control,
  entryIndex,
  categoryIndex,
  projectId,
  disabled,
}: {
  control: any;
  entryIndex: number;
  categoryIndex: number;
  projectId?: string;
  disabled?: boolean;
}) {
  const name = `entries.${entryIndex}.categoryEntries.${categoryIndex}.tasks`;
  const { fields, append, remove } = useFieldArray({ control, name });

  // A category block using the task format must carry at least one line.
  useEffect(() => {
    if (fields.length === 0) append({ ...EMPTY_TASK });
  }, [fields.length, append]);

  const atLimit = fields.length >= MAX_TASKS_PER_CATEGORY;

  return (
    <div className="w-full space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-row gap-2 items-start group">
          <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right pt-2.5">
            {index + 1}.
          </span>

          <FormField
            control={control}
            name={`${name}.${index}.module`}
            render={({ field }) => (
              <FormItem className="flex-[1] space-y-0 min-w-0">
                <FormControl>
                  <ModuleSelect
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    projectId={projectId}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-red-500 font-normal mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${name}.${index}.task`}
            render={({ field }) => (
              <FormItem className="flex-[2] space-y-0 min-w-0">
                <FormControl>
                  <Input
                    placeholder="What did you do?"
                    maxLength={500}
                    disabled={disabled}
                    className="h-9 bg-white border-gray-200 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-red-500 font-normal mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${name}.${index}.difficulty`}
            render={({ field }) => (
              <FormItem className="w-[110px] space-y-0 shrink-0">
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 bg-white border-gray-200 text-xs font-medium">
                      <SelectValue placeholder="Complexity" />
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
          <Plus className="w-3 h-3 mr-1" /> Add task
        </Button>
        {atLimit && (
          <span className="text-[11px] text-gray-400">
            Limit of {MAX_TASKS_PER_CATEGORY} tasks reached
          </span>
        )}
      </div>
    </div>
  );
}
