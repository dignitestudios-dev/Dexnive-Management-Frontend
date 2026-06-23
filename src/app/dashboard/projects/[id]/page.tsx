"use client";

import * as React from "react";
import { useState, use } from "react";
import { useRouter } from "next-nprogress-bar";
import { ArrowLeft, Plus, Pencil, Trash2, Calendar, CheckCircle2, PlayCircle, Clock, ArrowUp, ArrowDown, Eye, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

import { useGetProjectByIdQuery, useGetProjectStatsQuery } from "@/features/projects/api/projects.queries";
import { 
  useGetStagesByProjectQuery,
  useGetStageByIdQuery
} from "@/features/projects/api/project-stages.queries";
import { 
  useCreateStageMutation, 
  useUpdateStageStatusMutation, 
  useUpdateStageDetailsMutation, 
  useDeleteStageMutation, 
  useReorderStagesMutation 
} from "@/features/projects/api/project-stages.mutations";

import { ProjectStage, StageStatus } from "@/features/projects/types";
import { Division } from "@/features/divisions/types";
import { ProjectTimeline } from "@/features/projects/components/ProjectTimeline";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const { data: projectData, isLoading: isLoadingProject } = useGetProjectByIdQuery(projectId);
  const { data: statsData } = useGetProjectStatsQuery(projectId);
  const { data: stagesData, isLoading: isLoadingStages } = useGetStagesByProjectQuery(projectId);
  
  const project = projectData?.data;
  const stats = statsData?.data;
  const stages = stagesData?.data || [];

  const createMutation = useCreateStageMutation();
  const updateDetailsMutation = useUpdateStageDetailsMutation(projectId);
  const updateStatusMutation = useUpdateStageStatusMutation(projectId);
  const deleteMutation = useDeleteStageMutation(projectId);
  const reorderMutation = useReorderStagesMutation(projectId);

  // Dialog States
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  // Stage Form State
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [stageName, setStageName] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  
  // Status Form State
  const [statusStage, setStatusStage] = useState<ProjectStage | null>(null);
  const [newStatus, setNewStatus] = useState<StageStatus>("active");
  const [statusNote, setStatusNote] = useState("");
  
  // View Details State
  const [viewingStageId, setViewingStageId] = useState<string | null>(null);
  const { data: stageDetailsData, isLoading: isLoadingStageDetails } = useGetStageByIdQuery(viewingStageId || "");
  const stageDetails = stageDetailsData?.data;

  // Tab State
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

  const handleOpenStageDialog = (stage?: ProjectStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.name);
      setPlannedStartDate(stage.plannedStartDate ? new Date(stage.plannedStartDate).toISOString().split('T')[0] : "");
      setPlannedEndDate(stage.plannedEndDate ? new Date(stage.plannedEndDate).toISOString().split('T')[0] : "");
    } else {
      setEditingStage(null);
      setStageName("");
      setPlannedStartDate("");
      setPlannedEndDate("");
    }
    setIsStageDialogOpen(true);
  };

  const handleSaveStage = () => {
    if (!stageName.trim()) return toast.error("Stage name is required");

    const payload = {
      name: stageName.trim(),
      plannedStartDate: plannedStartDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
    };

    if (editingStage) {
      updateDetailsMutation.mutate({ stageId: editingStage._id, ...payload }, {
        onSuccess: () => {
          toast.success("Stage updated successfully");
          setIsStageDialogOpen(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update stage")
      });
    } else {
      createMutation.mutate({ 
        project: projectId, 
        order: stages.length > 0 ? Math.max(...stages.map((s: ProjectStage) => s.order)) + 1 : 1,
        ...payload 
      }, {
        onSuccess: () => {
          toast.success("Stage created successfully");
          setIsStageDialogOpen(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create stage")
      });
    }
  };

  const handleDeleteStage = (stageId: string) => {
    if (confirm("Are you sure you want to delete this stage?")) {
      deleteMutation.mutate(stageId, {
        onSuccess: () => toast.success("Stage deleted successfully"),
        onError: () => toast.error("Failed to delete stage")
      });
    }
  };

  const handleOpenStatusDialog = (stage: ProjectStage, targetStatus: StageStatus) => {
    setStatusStage(stage);
    setNewStatus(targetStatus);
    setStatusNote("");
    setIsStatusDialogOpen(true);
  };

  const handleSaveStatus = () => {
    if (!statusStage) return;
    
    updateStatusMutation.mutate({
      stageId: statusStage._id,
      status: newStatus,
      note: statusNote.trim() || undefined
    }, {
      onSuccess: () => {
        toast.success(`Stage marked as ${newStatus}`);
        setIsStatusDialogOpen(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to update stage status");
      }
    });
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    // Build payload
    const payload = newStages.map((s, i) => ({ stageId: s._id, order: i + 1 }));
    reorderMutation.mutate({ stages: payload }, {
      onSuccess: () => toast.success("Stages reordered"),
      onError: () => toast.error("Failed to reorder stages")
    });
  };

  if (isLoadingProject || isLoadingStages) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <h2 className="text-xl font-bold text-gray-900">Project Not Found</h2>
        <Button onClick={() => router.push("/dashboard/projects")} className="mt-4">Back to Projects</Button>
      </div>
    );
  }

  const divisionName = (project.division && typeof project.division === "object") ? (project.division as Division).name : (project.division || "N/A");

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Area */}
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex flex-col gap-4">
        {/* Breadcrumb / Top Info */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <button onClick={() => router.push("/dashboard/projects")} className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Projects
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{project.code}</span>
        </div>

        {/* Title and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{project.name}</h1>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                project.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                project.status?.toLowerCase() === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                project.status?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
              {project.status}
            </span>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-primary/10 text-primary">
              {project.projectType}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push(`/dashboard/projects/${project._id}/edit`)} variant="outline" className="gap-2 h-9">
              <Pencil className="w-4 h-4" />
              Edit Project
            </Button>
            <Button onClick={() => handleOpenStageDialog()} className="gap-2 h-9 bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Plus className="w-4 h-4" />
              Add Stage
            </Button>
          </div>
        </div>

        {/* Quick Stats Toolbar */}
        <div className="flex flex-wrap items-center gap-8 text-sm pt-2">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Division</span>
            <span className="font-semibold text-gray-900">{divisionName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Dates</span>
            <span className="font-medium text-gray-900">
              {project.estimatedStartDate ? new Date(project.estimatedStartDate).toLocaleDateString() : "--"} - {project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : "--"}
            </span>
          </div>
          
          {/* Budget Usage Minibar */}
          {stats && (
            <div className="flex items-center gap-6 md:ml-auto w-full md:w-auto">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Billable: {stats.totalBillableHours || 0}h</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Non-Billable: {stats.totalNonBillableHours || 0}h</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Total: {stats.totalHours || 0}h</div>
              </div>
              {stats.budgetedHours && (
                <div className="w-48 flex flex-col gap-1.5 hidden lg:flex">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Budget Usage</span>
                    <span className={(stats.totalHours || 0) > stats.budgetedHours ? "text-red-600" : "text-gray-900"}>
                      {stats.totalHours || 0} / {stats.budgetedHours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${(stats.totalHours || 0) > stats.budgetedHours ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(((stats.totalHours || 0) / stats.budgetedHours) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-6 border-b border-gray-200 flex gap-6 text-sm font-medium">
        <button 
          onClick={() => setActiveTab("list")}
          className={`py-3 border-b-2 transition-colors ${activeTab === "list" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Stages List
        </button>
        <button 
          onClick={() => setActiveTab("timeline")}
          className={`py-3 border-b-2 transition-colors ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Activity Timeline
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        {activeTab === "list" && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_120px_160px_160px] items-center gap-4 p-3 border-b border-gray-200 bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="w-16 flex justify-center">Order</div>
            <div>Stage Name</div>
            <div>Status</div>
            <div>Start Date</div>
            <div>End Date</div>
          </div>

          {/* Table Body */}
          {stages.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No stages created</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">Create stages to break down this project into manageable phases.</p>
              <Button onClick={() => handleOpenStageDialog()} className="h-9">Create Stage</Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stages.map((stage: ProjectStage, index: number) => (
                <ContextMenu key={stage._id}>
                  <ContextMenuTrigger render={<div />}>
                    <div 
                      className={`grid grid-cols-[auto_1fr_120px_160px_160px] items-center gap-4 p-3 text-sm transition-colors hover:bg-blue-50/30 group ${stage.status === 'active' ? 'bg-primary/[0.02]' : ''}`}
                    >
                      {/* Order / Grip */}
                      <div className="w-16 flex items-center justify-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => moveStage(index, 'up')} 
                          disabled={index === 0 || reorderMutation.isPending}
                          className="p-1 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => moveStage(index, 'down')} 
                          disabled={index === stages.length - 1 || reorderMutation.isPending}
                          className="p-1 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{stage.name}</span>
                        {stage.isTemplateBased && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-gray-100 text-gray-500">
                            Template
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
                          stage.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          stage.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          stage.status === 'delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {stage.status === 'active' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                          ) : null}
                          {stage.status.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Start Date */}
                      <div className="text-gray-500 flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        {stage.plannedStartDate ? new Date(stage.plannedStartDate).toLocaleDateString() : "--"}
                      </div>

                      {/* End Date */}
                      <div className="text-gray-500 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {stage.plannedEndDate ? new Date(stage.plannedEndDate).toLocaleDateString() : "--"}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48 p-1">
                    {(stage.status === 'not-started' || stage.status === 'delayed') && (
                      <ContextMenuItem onClick={() => handleOpenStatusDialog(stage, 'active')} className="flex items-center gap-2 py-1.5 text-xs text-emerald-600">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Start Stage</span>
                      </ContextMenuItem>
                    )}
                    {stage.status === 'active' && (
                      <ContextMenuItem onClick={() => handleOpenStatusDialog(stage, 'completed')} className="flex items-center gap-2 py-1.5 text-xs text-blue-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Stage</span>
                      </ContextMenuItem>
                    )}
                    {(stage.status === 'not-started' || stage.status === 'delayed' || stage.status === 'active') && (
                      <ContextMenuSeparator className="my-1" />
                    )}
                    <ContextMenuItem onClick={() => setViewingStageId(stage._id)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      <span>View Details</span>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleOpenStageDialog(stage)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit Stage</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator className="my-1" />
                    <ContextMenuItem onClick={() => handleDeleteStage(stage._id)} className="flex items-center gap-2 py-1.5 text-xs text-red-600 hover:text-red-700 focus:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
        )}

        {activeTab === "timeline" && (
          <ProjectTimeline projectId={projectId} />
        )}
      </div>

      {/* Stage Dialog (Create / Edit) */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingStage ? "Edit Stage Details" : "Add New Stage"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Stage Name <span className="text-red-500">*</span></label>
              <Input 
                value={stageName} 
                onChange={(e) => setStageName(e.target.value)} 
                placeholder="e.g. Design Phase"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Planned Start Date</label>
                <Input 
                  type="date"
                  value={plannedStartDate} 
                  onChange={(e) => setPlannedStartDate(e.target.value)} 
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Planned End Date</label>
                <Input 
                  type="date"
                  value={plannedEndDate} 
                  onChange={(e) => setPlannedEndDate(e.target.value)} 
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)} className="rounded-md">Cancel</Button>
            <Button 
              onClick={handleSaveStage} 
              className="rounded-md bg-primary hover:bg-primary-600 text-white"
              disabled={createMutation.isPending || updateDetailsMutation.isPending}
            >
              {(createMutation.isPending || updateDetailsMutation.isPending) ? <Loader className="w-5 h-5 text-current" /> : "Save Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {newStatus === 'active' ? 'Start Stage' : 
               newStatus === 'completed' ? 'Complete Stage' : 
               'Update Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              You are about to mark the <span className="font-semibold">{statusStage?.name}</span> stage as <span className="font-semibold uppercase">{newStatus}</span>.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Optional Note</label>
              <Input 
                value={statusNote} 
                onChange={(e) => setStatusNote(e.target.value)} 
                placeholder="e.g. Starting phase 1 ahead of schedule"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="rounded-md">Cancel</Button>
            <Button 
              onClick={handleSaveStatus} 
              className={`rounded-md text-white ${
                newStatus === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' :
                newStatus === 'completed' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-primary hover:bg-primary-600'
              }`}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? <Loader className="w-5 h-5 text-current" /> : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stage Details Dialog */}
      <Dialog open={!!viewingStageId} onOpenChange={(open) => !open && setViewingStageId(null)}>
        <DialogContent className="sm:max-w-2xl rounded-xl p-0 overflow-hidden bg-gray-50">
          {isLoadingStageDetails || !stageDetails ? (
            <div className="p-12 flex justify-center">
              <Loader className="w-8 h-8 text-primary" />
            </div>
          ) : (
            <>
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {stageDetails.name}
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
                    stageDetails.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    stageDetails.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    stageDetails.status === 'delayed' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {stageDetails.status.replace('-', ' ')}
                  </span>
                </DialogTitle>
                <div className="flex gap-6 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 opacity-70" />
                    <span>Planned: {stageDetails.plannedStartDate ? new Date(stageDetails.plannedStartDate).toLocaleDateString() : "--"} - {stageDetails.plannedEndDate ? new Date(stageDetails.plannedEndDate).toLocaleDateString() : "--"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 opacity-70" />
                    <span>Actual: {stageDetails.actualStartDate ? new Date(stageDetails.actualStartDate).toLocaleDateString() : "--"} - {stageDetails.actualEndDate ? new Date(stageDetails.actualEndDate).toLocaleDateString() : "--"}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Audit Log & Status History
                </h4>
                
                {stageDetails.auditLog && stageDetails.auditLog.length > 0 ? (
                  <div className="space-y-4">
                    {stageDetails.auditLog.map((log: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          {idx < stageDetails.auditLog.length - 1 && (
                            <div className="w-px h-full bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 flex-1 mb-2">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">{log.changedBy?.name || "User"}</span> changed status to <span className="font-semibold uppercase text-xs">{log.newStatus}</span>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(log.changedAt).toLocaleString()}</span>
                          </div>
                          {log.note && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                              "{log.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No status history found for this stage.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
