"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Briefcase, MoreVertical, Eye, BarChart2, X, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useGetProjectsQuery, useGetProjectStatsQuery } from "@/features/projects/api/projects.queries";
import { useDeleteProjectMutation } from "@/features/projects/api/projects.mutations";
import { useGetDivisionsQuery } from "@/features/divisions/api/divisions.queries";
import { useRouter } from "next-nprogress-bar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Project, ProjectStatus, ProjectType } from "@/features/projects/types";
import { Division } from "@/features/divisions/types";
import { Loader } from "@/components/ui/loader";
import { ProjectTimeline } from "@/features/projects/components/ProjectTimeline";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProjectsPageContent() {
  const router = useRouter();
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search and debounce
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Filters
  const [status, setStatus] = useState<string>(searchParams.get("status") || "");
  const [type, setType] = useState<string>(searchParams.get("type") || "");
  const [divisionId, setDivisionId] = useState<string>(searchParams.get("division") || "");

  const [tempStatus, setTempStatus] = useState<string>("");
  const [tempType, setTempType] = useState<string>("");
  const [tempDivisionId, setTempDivisionId] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleOpenFilter = (open: boolean) => {
    setIsFilterOpen(open);
    if (open) {
      setTempStatus(status);
      setTempType(type);
      setTempDivisionId(divisionId);
    }
  };

  const toggleTempStatus = (id: string) => setTempStatus(prev => prev === id ? "" : id);
  const toggleTempType = (id: string) => setTempType(prev => prev === id ? "" : id);
  const toggleTempDivision = (id: string) => setTempDivisionId(prev => prev === id ? "" : id);

  const applyFilters = () => {
    setStatus(tempStatus);
    setType(tempType);
    setDivisionId(tempDivisionId);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    params.delete("status");
    if (status) params.set("status", status);

    params.delete("type");
    if (type) params.set("type", type);

    params.delete("division");
    if (divisionId) params.set("division", divisionId);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, status, type, divisionId, pathname, router, searchParams]);

  const activeFilterCount = (status ? 1 : 0) + (type ? 1 : 0) + (divisionId ? 1 : 0);

  const { data: divData } = useGetDivisionsQuery({});
  const divisions = divData?.data || [];

  const { data, isLoading, refetch } = useGetProjectsQuery({ 
    search: debouncedSearch, 
    limit: 50,
    ...(status ? { status: status as ProjectStatus } : {}),
    ...(type ? { projectType: type as ProjectType } : {}),
    ...(divisionId ? { division: divisionId } : {}),
  });
  const projects = data?.data || [];

  const deleteMutation = useDeleteProjectMutation();

  // Dialogs state
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [statsProjectId, setStatsProjectId] = useState<string | null>(null);
  const [timelineProjectId, setTimelineProjectId] = useState<string | null>(null);

  const { data: statsData, isLoading: isStatsLoading } = useGetProjectStatsQuery(statsProjectId || "");
  const projectStats = statsData?.data;

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete, {
        onSuccess: () => {
          toast.success("Project deleted successfully");
          setProjectToDelete(null);
          refetch(); // or react-query will invalidate automatically
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete project")
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage external and internal projects.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/create")} className="rounded-md px-4 py-2 gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-md bg-white w-full h-9 shadow-sm pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            <Popover open={isFilterOpen} onOpenChange={handleOpenFilter}>
              <PopoverTrigger className={cn("inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input rounded-md px-4 py-2 h-9 gap-2 shadow-sm", activeFilterCount > 0 ? "bg-purple-600 hover:bg-purple-700 text-white border-0" : "bg-white hover:bg-accent hover:text-accent-foreground")}>
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-xs font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 rounded-xl shadow-lg border-gray-200" align="end">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="p-4 space-y-6">
                  {/* Status */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempStatus("")}
                        className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempStatus === "" ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        All Statuses
                      </button>
                      {[
                        { id: "not-started", label: "Not Started" },
                        { id: "active", label: "Active" },
                        { id: "on-hold", label: "On Hold" },
                        { id: "completed", label: "Completed" }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => toggleTempStatus(s.id)}
                          className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempStatus === s.id ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Type</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempType("")}
                        className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempType === "" ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        All Types
                      </button>
                      {[
                        { id: "internal", label: "Internal" },
                        { id: "external", label: "External" }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => toggleTempType(t.id)}
                          className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempType === t.id ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Division */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Division</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTempDivisionId("")}
                        className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempDivisionId === "" ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                      >
                        All Divisions
                      </button>
                      {divisions.map((d: any) => (
                        <button
                          key={d._id}
                          onClick={() => toggleTempDivision(d._id)}
                          className={cn("px-3 py-1 rounded-full text-xs border transition-colors", tempDivisionId === d._id ? "bg-purple-600 border-purple-600 text-white font-medium" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                  <Button variant="ghost" className="text-gray-500 rounded-md" onClick={() => { setTempStatus(""); setTempType(""); setTempDivisionId(""); }}>
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-md" onClick={() => setIsFilterOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="rounded-md bg-purple-600 hover:bg-purple-700 text-white px-6 shadow-md" onClick={applyFilters}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 mr-1">Active filters:</span>
              
              {status && (
                <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3 mr-1">
                  <span className="text-xs font-semibold text-gray-700">Status:</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
                    {status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    <button onClick={() => setStatus("")} className="hover:text-blue-900 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              {type && (
                <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3 mr-1">
                  <span className="text-xs font-semibold text-gray-700">Type:</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700 flex items-center gap-1">
                    {type === "external" ? "External" : "Internal"}
                    <button onClick={() => setType("")} className="hover:text-amber-900 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              {divisionId && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-700">Division:</span>
                  {(() => {
                    const d = divisions.find((d: any) => d._id === divisionId);
                    if (!d) return null;
                    return (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium border bg-purple-50 border-purple-200 text-purple-700 flex items-center gap-1">
                        {d.name}
                        <button onClick={() => setDivisionId("")} className="hover:text-purple-900 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })()}
                </div>
              )}
              
              <button 
                onClick={() => { setStatus(""); setType(""); setDivisionId(""); }}
                className="text-xs text-gray-500 hover:text-gray-900 ml-2 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}



        <div className="p-6 bg-gray-50/30">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader className="w-8 h-8 text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No projects found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((proj) => (
                <ContextMenu key={proj._id}>
                  <ContextMenuTrigger>
                    <div 
                      onClick={() => router.push(`/dashboard/projects/${proj._id}`)}
                      className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col cursor-pointer h-[210px]"
                    >
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 uppercase">
                                {proj.code}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                proj.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                                proj.status?.toLowerCase() === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                                proj.status?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {proj.status}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 line-clamp-2" title={proj.name}>{proj.name}</h3>
                          </div>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{proj.description}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Type</span>
                          <span className="text-xs text-gray-700 font-medium capitalize">{proj.projectType}</span>
                        </div>
                        {proj.budgetedHours !== undefined && proj.budgetedHours !== null && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Budget</span>
                            <span className="text-xs text-gray-700 font-medium">{proj.budgetedHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48 p-1">
                    <ContextMenuItem onClick={() => setStatsProjectId(proj._id)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
                      <span>View Stats</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setTimelineProjectId(proj._id)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>View Timeline</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator className="my-1" />
                    <ContextMenuItem onClick={() => router.push(`/dashboard/projects/${proj._id}/edit`)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit Project</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator className="my-1" />
                    <ContextMenuItem onClick={() => setProjectToDelete(proj._id)} className="flex items-center gap-2 py-1.5 text-xs text-red-600 hover:text-red-700 focus:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Project</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">Are you sure you want to delete this project? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader className="w-5 h-5 text-current" /> : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Timeline Dialog */}
      <Dialog open={!!timelineProjectId} onOpenChange={(open) => !open && setTimelineProjectId(null)}>
        <DialogContent className="w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Project Timeline
            </DialogTitle>
          </DialogHeader>
          
          {timelineProjectId && (
            <ProjectTimeline projectId={timelineProjectId} />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimelineProjectId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Stats Dialog */}
      <Dialog open={!!statsProjectId} onOpenChange={(open) => !open && setStatsProjectId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary-600" />
              Project Stats
            </DialogTitle>
          </DialogHeader>
          
          {isStatsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader className="w-8 h-8 text-primary" />
            </div>
          ) : projectStats ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Billable</p>
                  <p className="text-sm font-medium text-green-700">{projectStats.totalBillableHours || 0}h</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Non-Billable</p>
                  <p className="text-sm font-medium text-amber-700">{projectStats.totalNonBillableHours || 0}h</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Overtime</p>
                  <p className="text-sm font-medium text-purple-700">{projectStats.totalOvertimeHours || 0}h</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Hours</p>
                  <p className="text-sm font-medium text-blue-700">{projectStats.totalHours || 0}h</p>
                </div>
                {projectStats.budgetedHours !== null && projectStats.budgetedHours !== undefined && (
                  <>
                    <div className="col-span-2 border-t border-gray-200 mt-2 pt-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Budget Usage</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 flex overflow-hidden">
                        {(projectStats.budgetUsedPercent || 0) <= 100 ? (
                          <div 
                            className="h-2.5 bg-primary-500 transition-all duration-500" 
                            style={{ width: `${Math.min(projectStats.budgetUsedPercent || 0, 100)}%` }}
                          />
                        ) : (
                          <>
                            <div 
                              className="h-2.5 bg-primary-500 opacity-60 transition-all duration-500" 
                              style={{ width: `${(100 / (projectStats.budgetUsedPercent || 1)) * 100}%` }}
                            />
                            <div 
                              className="h-2.5 bg-red-500 transition-all duration-500" 
                              style={{ width: `${(((projectStats.budgetUsedPercent || 0) - 100) / (projectStats.budgetUsedPercent || 1)) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5 text-right font-medium">
                        <span className={(projectStats.budgetUsedPercent || 0) > 100 ? "text-red-600 font-bold" : ""}>
                          {projectStats.budgetUsedPercent}%
                        </span> of {projectStats.budgetedHours}h used
                        {(projectStats.budgetUsedPercent || 0) > 100 && ` (+${((projectStats.totalHours || 0) - projectStats.budgetedHours).toFixed(1)}h extra)`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              Failed to load stats.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsProjectId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 flex justify-center h-[500px] items-center">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
}
