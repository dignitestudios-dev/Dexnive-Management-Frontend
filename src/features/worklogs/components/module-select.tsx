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

import { useGetModulesQuery } from "@/features/modules/api/modules.queries";

/**
 * Module picker for one task line.
 *
 * Modules belong to a project, so this is empty until the row has one and
 * refetches whenever it changes. Read-only by design: creating a module is
 * Admin/PM/Lead and happens on the project page, not while logging time.
 */
export function ModuleSelect({
  value,
  onChange,
  projectId,
  disabled,
}: {
  value: string;
  onChange: (moduleId: string) => void;
  projectId?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetModulesQuery(projectId);

  const modules = data?.data ?? [];
  const selected = modules.find((m) => m._id === value);
  const noProject = !projectId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || noProject}
          className={cn(
            "w-full justify-between h-9 bg-white border-gray-200 text-sm font-normal",
            !value && "text-gray-400",
          )}
        >
          <span className="truncate" title={noProject ? "Pick a project first" : (selected?.name ?? "")}>
            {noProject ? "Pick a project first" : (selected?.name ?? "Module")}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-[320px] p-0 z-[100]" align="start">
        <Command>
          <CommandInput placeholder="Search module..." className="h-9 text-sm" />
          <CommandList>
            {isLoading && (
              <div className="py-3 text-center text-xs text-gray-500">
                Loading modules...
              </div>
            )}
            {!isLoading && modules.length === 0 && (
              <CommandEmpty className="py-3 px-3 text-center text-xs text-gray-500">
                This project has no modules yet. An admin or lead can add them on
                the project page.
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-56 overflow-y-auto p-1">
              {modules.map((module) => (
                <CommandItem
                  key={module._id}
                  value={module.name}
                  onSelect={() => {
                    onChange(module._id);
                    setOpen(false);
                  }}
                  className="cursor-pointer text-sm py-2 px-2.5 rounded-md"
                  title={module.name}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      value === module._id ? "opacity-100 text-primary-600" : "opacity-0",
                    )}
                  />
                  <span className="truncate font-medium text-gray-900">{module.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
