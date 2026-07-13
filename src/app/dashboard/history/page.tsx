"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { format } from "date-fns";
import { useGetMyWorklogsQuery } from "@/features/worklogs/api/worklogs.queries";
import { useGetProjectsQuery } from "@/features/projects/api/projects.queries";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSearchParams, usePathname } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { Suspense, useEffect } from "react";

function MyWorklogsHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM-dd");
  };
  const defaultEndDate = () => format(new Date(), "yyyy-MM-dd");

  const [draftFilters, setDraftFilters] = useState({
    project: searchParams.get("project") || "all",
    status: searchParams.get("status") || "all",
    startDate: searchParams.get("startDate") || defaultStartDate(),
    endDate: searchParams.get("endDate") || defaultEndDate(),
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Combobox open states
  const [projectComboOpen, setProjectComboOpen] = useState(false);

  const { data: projectsData } = useGetProjectsQuery({ limit: 100 });

  const { data: worklogsData, isLoading, isError, refetch } = useGetMyWorklogsQuery({
    project: appliedFilters.project && appliedFilters.project !== "all" ? appliedFilters.project : undefined,
    status: appliedFilters.status && appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate
  });

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  };
  
  const handleClearFilters = () => {
    const cleared = {
      project: "all",
      status: "all",
      startDate: defaultStartDate(),
      endDate: defaultEndDate(),
    };
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    if (appliedFilters.project && appliedFilters.project !== "all") {
      if (params.get("project") !== appliedFilters.project) {
        params.set("project", appliedFilters.project);
        hasChanges = true;
      }
    } else {
      if (params.has("project")) {
        params.delete("project");
        hasChanges = true;
      }
    }

    if (appliedFilters.status && appliedFilters.status !== "all") {
      if (params.get("status") !== appliedFilters.status) {
        params.set("status", appliedFilters.status);
        hasChanges = true;
      }
    } else {
      if (params.has("status")) {
        params.delete("status");
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
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">My Worklogs History</h1>
            <p className="text-sm text-gray-500 mt-1">View and filter your worklogs history</p>
          </div>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2 h-9"><Filter className="w-4 h-4" />Filters</Button>} />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filter Worklogs</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Project</label>
                  <Popover open={projectComboOpen} onOpenChange={setProjectComboOpen}>
                    <PopoverTrigger render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={projectComboOpen}
                        className="w-full justify-between h-10 font-normal text-sm bg-white"
                      >
                        {draftFilters.project && draftFilters.project !== "all"
                          ? projectsData?.data.find((project) => project._id === draftFilters.project)?.name
                          : "All Projects"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    } />
                    <PopoverContent className="w-[450px] p-0 z-[100]" align="start">
                      <Command>
                        <CommandInput placeholder="Search project by name..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No project found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                setDraftFilters(p => ({ ...p, project: "all" }));
                                setProjectComboOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  draftFilters.project === "all" ? "opacity-100" : "opacity-0"
                                )}
                              />
                              All Projects
                            </CommandItem>
                            {projectsData?.data.map((project) => (
                              <CommandItem
                                key={project._id}
                                value={project.name + " " + project._id}
                                onSelect={() => {
                                  setDraftFilters(p => ({ ...p, project: project._id }));
                                  setProjectComboOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    draftFilters.project === project._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {project.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={draftFilters.status} onValueChange={(val) => setDraftFilters(p => ({ ...p, status: val || "" }))}>
                    <SelectTrigger className="bg-white h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <Input type="date" value={draftFilters.startDate} onChange={(e) => setDraftFilters(p => ({ ...p, startDate: e.target.value }))} className="bg-white h-10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <Input type="date" value={draftFilters.endDate} onChange={(e) => setDraftFilters(p => ({ ...p, endDate: e.target.value }))} className="bg-white h-10" />
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
          
          {appliedFilters.project !== "all" && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
              Project: {projectsData?.data.find((p) => p._id === appliedFilters.project)?.name || "Unknown"}
              <button onClick={() => { setDraftFilters(p => ({ ...p, project: "all" })); setAppliedFilters(p => ({ ...p, project: "all" })); }} className="ml-1.5 hover:text-indigo-900"><X className="w-3 h-3" /></button>
            </span>
          )}

          {appliedFilters.status !== "all" && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100 capitalize">
              Status: {appliedFilters.status}
              <button onClick={() => { setDraftFilters(p => ({ ...p, status: "all" })); setAppliedFilters(p => ({ ...p, status: "all" })); }} className="ml-1.5 hover:text-amber-900"><X className="w-3 h-3" /></button>
            </span>
          )}
          
          {(appliedFilters.project !== "all" || appliedFilters.status !== "all" || appliedFilters.startDate !== defaultStartDate() || appliedFilters.endDate !== defaultEndDate()) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-gray-500 hover:text-gray-900 h-6 px-2 text-xs ml-auto">
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader className="w-8 h-8 mb-4 text-primary" />
            <p>Loading worklogs...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <p>Failed to load worklogs.</p>
          </div>
        ) : worklogsData?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No worklogs found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Logged Hours</th>
                  <th className="px-6 py-4">Billable</th>
                  <th className="px-6 py-4">Non-Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {worklogsData?.data.map((log: any) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {format(new Date(log.shiftDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        log.status === "submitted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatMins(log.totalLoggedMinutes)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium whitespace-nowrap">
                      {formatMins(log.totalBillableMinutes)}
                      {log.totalOvertimeMinutes > 0 && (
                        <span className="text-xs ml-1.5 opacity-80 text-gray-500 font-normal">
                          ({formatMins(log.totalOvertimeMinutes)} OT)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-medium">{formatMins(log.totalNonBillableMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyWorklogsHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center h-full bg-white">
        <Loader className="w-6 h-6 text-primary-500" />
      </div>
    }>
      <MyWorklogsHistoryContent />
    </Suspense>
  );
}




