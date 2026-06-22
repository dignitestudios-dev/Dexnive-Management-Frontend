"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Loader2, Pencil, Trash2, Search, Briefcase, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useGetProjectsQuery } from "@/features/projects/api/projects.queries";
import { useDeleteProjectMutation } from "@/features/projects/api/projects.mutations";
import { useGetDivisionsQuery } from "@/features/divisions/api/divisions.queries";
import { useRouter } from "next-nprogress-bar";
import { toast } from "sonner";
import { Project, ProjectStatus, ProjectType } from "@/features/projects/types";
import { Division } from "@/features/divisions/types";

export default function ProjectsPage() {
  const router = useRouter();
  
  // Search and debounce
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");
  const [divisionFilter, setDivisionFilter] = useState<string | "all">("all");

  const { data: divData } = useGetDivisionsQuery({});
  const divisions = divData?.data || [];

  const { data, isLoading, refetch } = useGetProjectsQuery({ 
    search: debouncedSearch, 
    limit: 50,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(typeFilter !== "all" ? { projectType: typeFilter } : {}),
    ...(divisionFilter !== "all" ? { division: divisionFilter } : {}),
  });
  const projects = data?.data || [];

  const deleteMutation = useDeleteProjectMutation();

  // Dialogs state
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToView, setProjectToView] = useState<Project | null>(null);

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete, {
        onSuccess: () => {
          toast.success("Project deleted successfully");
          setProjectToDelete(null);
          refetch(); // or react-query will invalidate automatically
        },
        onError: () => toast.error("Failed to delete project")
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
              className="pl-10 rounded-md bg-white w-full h-9 shadow-sm"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-[140px] h-9 bg-white text-xs capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="not-started" className="text-xs">Not Started</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="on-hold" className="text-xs">On Hold</SelectItem>
                <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
              <SelectTrigger className="w-[140px] h-9 bg-white text-xs capitalize">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="external" className="text-xs">External</SelectItem>
                <SelectItem value="internal" className="text-xs">Internal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={divisionFilter} onValueChange={(val: any) => setDivisionFilter(val || "all")}>
              <SelectTrigger className="w-[140px] h-9 bg-white text-xs">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Divisions</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applied Filters Display */}
        {(statusFilter !== "all" || typeFilter !== "all" || divisionFilter !== "all") && (
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Applied Filters:</span>
            {statusFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 capitalize">
                Status: {statusFilter}
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 capitalize">
                Type: {typeFilter}
              </span>
            )}
            {divisionFilter !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                Division: {divisions.find((d) => d._id === divisionFilter)?.name || "Unknown"}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setDivisionFilter("all"); }}
              className="text-gray-500 hover:text-gray-900"
            >
              Clear all
            </Button>
          </div>
        )}

        <div className="p-6 bg-gray-50/30">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No projects found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((proj) => (
                <div 
                  key={proj._id} 
                  className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => setProjectToView(proj)}
                >
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 uppercase">
                            {proj.code}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            proj.status === 'active' ? 'bg-green-100 text-green-700' :
                            proj.status === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                            proj.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2" title={proj.name}>{proj.name}</h3>
                      </div>
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-900 focus-visible:ring-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${proj._id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setProjectToDelete(proj._id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Details Dialog */}
      <Dialog open={!!projectToView} onOpenChange={(open) => !open && setProjectToView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-600" />
              Project Details
            </DialogTitle>
          </DialogHeader>
          
          {projectToView && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 uppercase">
                      {projectToView.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      projectToView.status === 'active' ? 'bg-green-100 text-green-700' :
                      projectToView.status === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                      projectToView.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {projectToView.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{projectToView.name}</h2>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Type</span>
                  <span className="text-sm text-gray-900 capitalize">{projectToView.projectType}</span>
                </div>
              </div>

              {projectToView.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Description</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{projectToView.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Division</p>
                  <p className="text-sm font-medium text-gray-900">
                    {typeof projectToView.division === "object" ? (projectToView.division as Division).name : (projectToView.division || "N/A")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Budgeted Hours</p>
                  <p className="text-sm font-medium text-gray-900">{projectToView.budgetedHours || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Est. Start</p>
                  <p className="text-sm font-medium text-gray-900">
                    {projectToView.estimatedStartDate ? new Date(projectToView.estimatedStartDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Est. End</p>
                  <p className="text-sm font-medium text-gray-900">
                    {projectToView.estimatedEndDate ? new Date(projectToView.estimatedEndDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectToView(null)}>Close</Button>
            {projectToView && (
              <Button onClick={() => {
                setProjectToView(null);
                router.push(`/dashboard/projects/${projectToView._id}/edit`);
              }}>
                Edit Project
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
