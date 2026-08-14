"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
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

export interface ProjectSelectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  /** All rows in the field array, so a project already picked elsewhere can be disabled. */
  watchedEntries: any[];
  currentIndex: number;
  projects: any[];
  allProjectsMap: Map<string, any>;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** When the full list is client-side, filter locally instead of round-tripping. */
  isAllProjectsLoaded?: boolean;
}

/**
 * Project picker for a single worklog entry row. Projects already chosen on
 * another row are shown disabled — the API rejects duplicate projects in a day.
 */
export function ProjectSelectCombobox({
  value,
  onChange,
  watchedEntries,
  currentIndex,
  projects,
  allProjectsMap,
  isLoading,
  searchQuery,
  onSearchChange,
  isAllProjectsLoaded,
}: ProjectSelectComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProject =
    projects?.find((p: any) => p._id === value) || allProjectsMap.get(value);

  const displayedProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery || searchQuery.trim() === "") return projects;

    if (isAllProjectsLoaded) {
      const q = searchQuery.toLowerCase().trim();
      return projects.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q))
      );
    }

    return projects;
  }, [projects, searchQuery, isAllProjectsLoaded]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-gray-200 shadow-sm h-10 text-sm font-normal text-gray-900 hover:bg-gray-50"
        >
          <span className="truncate">
            {selectedProject ? selectedProject.name : "Select project"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-500" />
        </Button>
      } />
      <PopoverContent className="w-[300px] sm:w-[360px] p-0 z-[100]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search project..."
            className="h-9 text-sm"
            value={searchQuery}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading && (
              <div className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <Loader className="w-3.5 h-3.5 text-primary-600" /> Searching projects...
              </div>
            )}
            {!isLoading && (!displayedProjects || displayedProjects.length === 0) && (
              <CommandEmpty className="py-4 text-center text-xs text-gray-500">
                No project found.
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-60 overflow-y-auto p-1">
              {displayedProjects?.map((project: any) => {
                const isSelectedElsewhere = watchedEntries?.some(
                  (e: any, i: number) => i !== currentIndex && e.project === project._id
                );
                const isSelected = value === project._id;

                return (
                  <CommandItem
                    key={project._id}
                    value={project.name + " " + project._id}
                    disabled={isSelectedElsewhere}
                    onSelect={() => {
                      onChange(project._id);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer flex items-center justify-between text-sm py-2 px-2.5 rounded-md hover:bg-gray-100",
                      isSelectedElsewhere && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100 text-primary-600" : "opacity-0"
                        )}
                      />
                      <span className="truncate font-medium text-gray-900">{project.name}</span>
                    </div>
                    {isSelectedElsewhere && (
                      <span className="text-[10px] text-gray-400 italic shrink-0">Already selected</span>
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
