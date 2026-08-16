"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

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

import { useGetModulesQuery } from "../api/worklogs.queries";

/**
 * Module picker for a task row.
 *
 * Backed by the distinct modules already in use, with an explicit "add new"
 * action rather than a bare text field. The server uppercases and dedupes
 * casing variants on write, but it cannot tell a typo from a genuinely new
 * module — so offering the existing list is the only thing that stops AUTHHHH
 * becoming a permanent sibling of AUTH.
 *
 * Values are uppercased here too, so what the user sees matches what comes
 * back from the API.
 */
export function ModuleCombobox({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (module: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useGetModulesQuery();
  const modules = data?.data ?? [];

  const typed = query.trim().toUpperCase();

  const filtered = useMemo(() => {
    if (!typed) return modules;
    return modules.filter((m) => m.includes(typed));
  }, [modules, typed]);

  // Only offer to create when it isn't already an exact match.
  const canCreate = typed.length > 0 && !modules.includes(typed);

  const commit = (next: string) => {
    onChange(next.trim().toUpperCase());
    setQuery("");
    setOpen(false);
  };

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
            "w-full justify-between h-9 bg-white border-gray-200 text-sm font-normal",
            !value && "text-gray-400",
            className,
          )}
        >
          <span className="truncate">{value || "Module"}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-[240px] p-0 z-[100]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add module..."
            className="h-9 text-sm"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="py-3 text-center text-xs text-gray-500">
                Loading modules...
              </div>
            )}

            {!isLoading && filtered.length === 0 && !canCreate && (
              <CommandEmpty className="py-3 text-center text-xs text-gray-500">
                No modules yet — type to add one.
              </CommandEmpty>
            )}

            {canCreate && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${typed}`}
                  onSelect={() => commit(typed)}
                  className="cursor-pointer text-sm py-2 px-2.5 rounded-md"
                >
                  <Plus className="mr-2 h-3.5 w-3.5 text-primary-600 shrink-0" />
                  <span className="text-gray-600">Add</span>
                  <span className="ml-1 font-semibold text-primary-700 truncate">
                    {typed}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {filtered.length > 0 && (
              <CommandGroup className="max-h-56 overflow-y-auto p-1">
                {filtered.map((module) => (
                  <CommandItem
                    key={module}
                    value={module}
                    onSelect={() => commit(module)}
                    className="cursor-pointer text-sm py-2 px-2.5 rounded-md"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5 shrink-0",
                        value === module ? "opacity-100 text-primary-600" : "opacity-0",
                      )}
                    />
                    <span className="truncate font-medium text-gray-900">{module}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
