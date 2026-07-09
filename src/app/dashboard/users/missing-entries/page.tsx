"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { format } from "date-fns";
import { useGetAllMissingEntriesCountQuery } from "@/features/worklogs/api/worklogs.queries";
import { useGetDepartmentsQuery } from "@/features/departments/api/departments.queries";
import { Search, AlertCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSearchParams, usePathname } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { Suspense, useEffect } from "react";

function MissingEntriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM-dd");
  };
  const defaultEndDate = () => format(new Date(), "yyyy-MM-dd");

  const [draftFilters, setDraftFilters] = useState({
    department: searchParams.get("department") || "all_departments",
    startDate: searchParams.get("startDate") || defaultStartDate(),
    endDate: searchParams.get("endDate") || defaultEndDate(),
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deptComboOpen, setDeptComboOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch departments for dropdown
  const { data: deptsData, isLoading: isDeptsLoading } = useGetDepartmentsQuery({ search: debouncedSearch });

  // Fetch missing entries count
  const { data: missingData, isLoading: isMissingLoading, isError } = useGetAllMissingEntriesCountQuery({
    department: (appliedFilters.department && appliedFilters.department !== "all_departments") ? appliedFilters.department : undefined,
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate,
    limit: 100
  });

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  };
  
  const handleClearFilters = () => {
    const cleared = {
      department: "all_departments",
      startDate: defaultStartDate(),
      endDate: defaultEndDate(),
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (appliedFilters.department && appliedFilters.department !== "all_departments") {
      if (params.get("department") !== appliedFilters.department) {
        params.set("department", appliedFilters.department);
        hasChanges = true;
      }
    } else {
      if (params.has("department")) {
        params.delete("department");
        hasChanges = true;
      }
    }

    if (appliedFilters.startDate) {
      if (params.get("startDate") !== appliedFilters.startDate) {
        params.set("startDate", appliedFilters.startDate);
        hasChanges = true;
      }
    }

    if (appliedFilters.endDate) {
      if (params.get("endDate") !== appliedFilters.endDate) {
        params.set("endDate", appliedFilters.endDate);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [appliedFilters, pathname, router, searchParams]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Missing Entries</h1>
            <p className="text-sm text-gray-500 mt-1">Track and review missing worklog entries for users</p>
          </div>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2 h-9">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filter Missing Entries</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Department</label>
                  <Popover open={deptComboOpen} onOpenChange={setDeptComboOpen}>
                    <PopoverTrigger render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={deptComboOpen}
                        className="w-full justify-between h-10 font-normal text-sm bg-white"
                      >
                        {draftFilters.department && draftFilters.department !== "all_departments"
                          ? deptsData?.data.find((d: any) => d._id === draftFilters.department)?.name
                          : "All Departments"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    } />
                    <PopoverContent className="w-[450px] p-0 z-[100]" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search department..." 
                          className="h-9"
                          value={searchQuery}
                          onValueChange={setSearchQuery} 
                        />
                        <CommandList>
                          {isDeptsLoading && (
                            <div className="py-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                              <Loader className="w-4 h-4" /> Loading departments...
                            </div>
                          )}
                          {!isDeptsLoading && <CommandEmpty>No department found.</CommandEmpty>}
                          <CommandGroup>
                            <CommandItem
                              value="all_departments"
                              onSelect={() => {
                                setDraftFilters(p => ({ ...p, department: "all_departments" }));
                                setDeptComboOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  draftFilters.department === "all_departments" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              All Departments
                            </CommandItem>
                            {deptsData?.data.map((dept: any) => (
                              <CommandItem
                                key={dept._id}
                                value={dept.name + " " + dept._id}
                                onSelect={() => {
                                  setDraftFilters(p => ({ ...p, department: dept._id }));
                                  setDeptComboOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    draftFilters.department === dept._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {dept.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <Input 
                      type="date" 
                      value={draftFilters.startDate} 
                      onChange={(e) => setDraftFilters(p => ({ ...p, startDate: e.target.value }))} 
                      className="bg-white h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <Input 
                      type="date" 
                      value={draftFilters.endDate} 
                      onChange={(e) => setDraftFilters(p => ({ ...p, endDate: e.target.value }))} 
                      className="bg-white h-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsFilterOpen(false)} className="h-10">Cancel</Button>
                <Button onClick={handleApplyFilters} className="h-10">Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Applied Filters Display */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Applied Filters:</span>
          
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
            Date: {format(new Date(appliedFilters.startDate), "MMM d, yyyy")} to {format(new Date(appliedFilters.endDate), "MMM d, yyyy")}
          </span>
          
          {appliedFilters.department !== "all_departments" && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100">
              Department: {deptsData?.data.find((d: any) => d._id === appliedFilters.department)?.name || "Unknown"}
              <button onClick={() => { setDraftFilters(p => ({ ...p, department: "all_departments" })); setAppliedFilters(p => ({ ...p, department: "all_departments" })); }} className="ml-1.5 hover:text-primary-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          
          {(appliedFilters.department !== "all_departments" || appliedFilters.startDate !== defaultStartDate() || appliedFilters.endDate !== defaultEndDate()) && (
            <Button variant="ghost" size="xs" onClick={handleClearFilters} className="text-gray-500 hover:text-gray-900 h-6 px-2 text-xs ml-auto">
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
        {isMissingLoading || isDeptsLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader className="w-8 h-8 mb-4 text-primary" />
            <p>Loading missing entries...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-8 h-8 mb-4" />
            <p>Failed to load missing entries.</p>
          </div>
        ) : missingData?.data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No missing entries</h3>
            <p className="text-sm text-gray-500">All worklogs are up to date for this period.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-right">Missing Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missingData?.data?.filter((entry: any) => entry.missingEntriesCount > 0).map((entry: any, idx: number) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>
                        <p>{entry.userName}</p>
                        <p className="text-xs text-gray-500 font-normal">{entry.employeeCode}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {entry.userEmail || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {entry.department?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {entry.missingEntriesCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Missing Entries Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEntry.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEntry.userEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Employee Code</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEntry.employeeCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Department</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedEntry.department?.name || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 border-b border-gray-100 pb-2">
                  Missing Dates ({selectedEntry.missingEntriesCount})
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                  {selectedEntry.missingDates?.map((d: string, idx: number) => (
                    <div key={idx} className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs text-gray-700 shadow-sm flex items-center justify-between">
                      <span className="font-medium">{format(new Date(d), "MMM d, yyyy")}</span>
                      <span className="text-gray-400">{format(new Date(d), "EEE")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MissingEntriesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-8 w-8 text-primary-500" />
      </div>
    }>
      <MissingEntriesPageContent />
    </Suspense>
  );
}


