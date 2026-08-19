"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useGetCategoriesQuery } from "@/features/categories/api/categories.queries";

/**
 * Category picker for one block of a project entry.
 *
 * Sourced from the caller's own department — the worklog service rejects a
 * category belonging to any other. Categories already used elsewhere on the
 * same project entry are disabled, because the API rejects duplicates within
 * one entry.
 */
export function CategorySelect({
  value,
  onChange,
  usedCategoryIds = [],
  disabled,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  usedCategoryIds?: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetCategoriesQuery();

  const categories = data?.data ?? [];
  const selected = categories.find((c) => c._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full sm:w-[280px] justify-between h-9 bg-white border-gray-200 text-sm font-normal",
            !value && "text-gray-400",
          )}
        >
          <span className="truncate" title={selected?.name ?? ""}>{selected?.name ?? "Select category"}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-[320px] p-0 z-[100]" align="start">
        <Command>
          <CommandInput placeholder="Search category..." className="h-9 text-sm" />
          <CommandList>
            {isLoading && (
              <div className="py-3 text-center text-xs text-gray-500">
                Loading categories...
              </div>
            )}
            {!isLoading && categories.length === 0 && (
              <CommandEmpty className="py-3 text-center text-xs text-gray-500">
                No categories set up for your department yet.
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-56 overflow-y-auto p-1">
              {categories.map((category) => {
                const usedElsewhere =
                  usedCategoryIds.includes(category._id) && category._id !== value;
                return (
                  <CommandItem
                    key={category._id}
                    value={category.name}
                    disabled={usedElsewhere}
                    onSelect={() => {
                      onChange(category._id);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer flex items-center justify-between text-sm py-2 px-2.5 rounded-md",
                      usedElsewhere && "opacity-40 cursor-not-allowed",
                    )}
                    title={category.name}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          value === category._id
                            ? "opacity-100 text-primary-600"
                            : "opacity-0",
                        )}
                      />
                      <span className="truncate font-medium text-gray-900">
                        {category.name}
                      </span>
                    </span>
                    {usedElsewhere && (
                      <span className="text-[10px] text-gray-400 italic shrink-0">
                        Already added
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
