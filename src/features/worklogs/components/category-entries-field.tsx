"use client";

import React from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { Layers, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MAX_CATEGORY_ENTRIES } from "../types";
import type { EntryFormat } from "../lib/entry-format";
import { CategorySelect } from "./category-select";
import { EMPTY_TASK, TaskRows } from "./task-rows";

/** A blank category block in the given format. */
export const emptyCategoryEntry = (format: EntryFormat) => ({
  category: "",
  _format: format,
  ...(format === "tasks" ? { tasks: [{ ...EMPTY_TASK }] } : { description: "" }),
});

/**
 * The category blocks of one project entry.
 *
 * A project's time is broken down by category, and each block holds either a
 * task breakdown or a description depending on the user's department. More than
 * one block per project is normal — a day on one project might cover two
 * categories.
 */
export function CategoryEntriesField({
  control,
  entryIndex,
  format,
  projectId,
  disabled,
}: {
  control: any;
  entryIndex: number;
  format: EntryFormat;
  projectId?: string;
  disabled?: boolean;
}) {
  const name = `entries.${entryIndex}.categoryEntries`;
  const { fields, append, remove } = useFieldArray({ control, name });

  const blocks = useWatch({ control, name }) ?? [];
  // The API rejects the same category twice on one project entry.
  const usedCategoryIds = (blocks as any[])
    .map((block) => block?.category)
    .filter(Boolean);

  const atLimit = fields.length >= MAX_CATEGORY_ENTRIES;

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-lg border border-gray-200 bg-white p-3 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <FormField
                control={control}
                name={`${name}.${index}.category`}
                render={({ field }) => (
                  <FormItem className="space-y-0 min-w-0">
                    <FormControl>
                      <CategorySelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        usedCategoryIds={usedCategoryIds}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] font-normal mt-1" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <FormField
                control={control}
                name={`${name}.${index}._format`}
                render={({ field }) => (
                  <div className="flex items-center rounded-md border border-gray-200 p-0.5 bg-gray-50">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => field.onChange("notes")}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-sm transition-colors",
                        (field.value ?? format) === "notes"
                          ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                          : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      Free Form
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => field.onChange("tasks")}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-sm transition-colors",
                        (field.value ?? format) === "tasks"
                          ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                          : "text-gray-500 hover:text-gray-900"
                      )}
                    >
                      Module Based
                    </button>
                  </div>
                )}
              />

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  className="h-7 px-2 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {(blocks[index]?._format ?? format) === "tasks" ? (
            <TaskRows
              control={control}
              entryIndex={entryIndex}
              categoryIndex={index}
              projectId={projectId}
              disabled={disabled}
            />
          ) : (
            <FormField
              control={control}
              name={`${name}.${index}.description`}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormControl>
                    <Textarea
                      placeholder="What did you work on in this category?"
                      rows={3}
                      maxLength={2000}
                      disabled={disabled}
                      className="bg-white border-gray-200 text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] font-normal" />
                </FormItem>
              )}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || atLimit}
          onClick={() => append(emptyCategoryEntry(format) as any)}
          className="h-8 text-xs font-medium border-dashed border-gray-300 text-gray-600 hover:text-primary-700 hover:border-primary-300"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add another category
        </Button>
        {atLimit && (
          <span className="text-[11px] text-gray-400">
            Limit of {MAX_CATEGORY_ENTRIES} categories reached
          </span>
        )}
      </div>
    </div>
  );
}
