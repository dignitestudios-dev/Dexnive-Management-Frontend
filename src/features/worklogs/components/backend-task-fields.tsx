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

/**
 * Module / task / complexity rows for Backend-department users, captured
 * alongside a project entry.
 *
 * Behaviour is intentionally unchanged from the original implementation —
 * including the bulk-paste parser, which accepts lines shaped like:
 *   1.) Module Name | Task Description | HIGH
 */
export function BackendTaskFields({
  control,
  entryIndex,
}: {
  control: any;
  entryIndex: number;
}) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `entries.${entryIndex}.backendTasks`,
  });

  useEffect(() => {
    if (fields.length === 0) {
      append({ module: "", task: "", difficulty: "LOW" });
    }
  }, [fields.length, append]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("Text");
    if (!text) return;

    // Check if it looks like a formatted task list (has numbered lines with pipes)
    const looksLikeTaskList = /\d+\.\)/.test(text) && text.includes('|');
    if (!looksLikeTaskList) return; // Let normal paste happen

    e.preventDefault();

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedTasks: any[] = [];
    const badLines: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.\)\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(HIGH|MEDIUM|LOW)\s*$/i);
      if (match) {
        parsedTasks.push({
          module: match[1].trim(),
          task: match[2].trim(),
          difficulty: match[3].toUpperCase().trim()
        });
      } else {
        badLines.push(line);
      }
    }

    if (badLines.length > 0 && parsedTasks.length === 0) {
      toast.error("Bad format. Use this format to paste tasks:", {
        description: "1.) Module Name | Task Description | HIGH\n2.) Module Name | Task Description | LOW\n\nDifficulty must be HIGH, MEDIUM, or LOW.",
        duration: 6000,
      });
      return;
    }

    if (badLines.length > 0 && parsedTasks.length > 0) {
      toast.warning(`${parsedTasks.length} task(s) pasted. ${badLines.length} line(s) skipped due to bad format.`, {
        description: "Expected: 1.) Module | Task | HIGH/MEDIUM/LOW",
        duration: 4000,
      });
    }

    if (parsedTasks.length > 0) {
      replace(parsedTasks);
    }
  };

  return (
    <div className="w-full space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-row gap-2 items-center group">
          <span className="text-xs text-gray-400 font-mono w-5 shrink-0 text-right">{index + 1}.</span>
          <FormField
            control={control}
            name={`entries.${entryIndex}.backendTasks.${index}.module`}
            render={({ field }) => (
              <FormItem className="flex-[1] space-y-0">
                <FormControl>
                  <Input
                    placeholder="Module"
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
            name={`entries.${entryIndex}.backendTasks.${index}.task`}
            render={({ field }) => (
              <FormItem className="flex-[2] space-y-0">
                <FormControl>
                  <Input
                    placeholder="Task"
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
            name={`entries.${entryIndex}.backendTasks.${index}.difficulty`}
            render={({ field }) => (
              <FormItem className="w-[105px] space-y-0">
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger className="h-9 bg-white border-gray-200 text-xs font-medium">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH" className="text-red-600 font-medium text-xs">HIGH</SelectItem>
                      <SelectItem value="MEDIUM" className="text-amber-600 font-medium text-xs">MEDIUM</SelectItem>
                      <SelectItem value="LOW" className="text-emerald-600 font-medium text-xs">LOW</SelectItem>
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
              className="text-gray-300 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => remove(index)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 h-7 px-2 text-xs font-medium"
        onClick={() => append({ module: "", task: "", difficulty: "LOW" })}
      >
        <Plus className="w-3 h-3 mr-1" /> Add Task
      </Button>
    </div>
  );
}
