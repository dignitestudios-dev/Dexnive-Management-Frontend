"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProjectMutation, useUpdateProjectMutation } from "@/features/projects/api/projects.mutations";
import { useGetDivisionsQuery } from "@/features/divisions/api/divisions.queries";
import { toast } from "sonner";
import { Project, ProjectStatus, ProjectType } from "@/features/projects/types";
import { Loader } from "@/components/ui/loader";

interface ProjectFormProps {
  initialData?: Project | null;
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const { data: divData } = useGetDivisionsQuery({});
  const divisions = divData?.data || [];

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    division: "",
    projectType: "external" as ProjectType,
    status: "not-started" as ProjectStatus,
    budgetedHours: "",
    estimatedStartDate: "",
    estimatedEndDate: "",
    activateFirstStage: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        description: initialData.description || "",
        division: (initialData.division && typeof initialData.division === "object") ? (initialData.division as any)._id : (initialData.division || ""),
        projectType: initialData.projectType,
        status: initialData.status,
        budgetedHours: initialData.budgetedHours ? initialData.budgetedHours.toString() : "",
        estimatedStartDate: initialData.estimatedStartDate ? initialData.estimatedStartDate.split("T")[0] : "",
        estimatedEndDate: initialData.estimatedEndDate ? initialData.estimatedEndDate.split("T")[0] : "",
        activateFirstStage: false // ignored on update
      });
    }
  }, [initialData]);

  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Project name is required";
    if (!formData.code.trim()) newErrors.code = "Project code is required";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const { activateFirstStage, ...restFormData } = formData;
    
    const payload: any = {
      ...restFormData,
      budgetedHours: formData.budgetedHours ? Number(formData.budgetedHours) : undefined,
      division: (formData.division && formData.division !== "none") ? formData.division : undefined,
      estimatedStartDate: formData.estimatedStartDate || undefined,
      estimatedEndDate: formData.estimatedEndDate || undefined,
    };

    if (initialData) {
      // For updates, do not send activateFirstStage
      updateMutation.mutate(
        { projectId: initialData._id, ...payload },
        {
          onSuccess: () => {
            toast.success("Project updated successfully");
            router.push("/dashboard/projects");
          },
          onError: (err: any) => toast.error(err.message || "Failed to update project")
        }
      );
    } else {
      payload.activateFirstStage = activateFirstStage;
      createMutation.mutate(
        payload as any,
        {
          onSuccess: () => {
            toast.success("Project created successfully");
            router.push("/dashboard/projects");
          },
          onError: (err: any) => toast.error(err.message || "Failed to create project")
        }
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Project Name <span className="text-red-500">*</span></label>
            <Input 
              value={formData.name} 
              onChange={(e) => {
                setFormData(p => ({...p, name: e.target.value}));
                if (errors.name) setErrors(p => ({...p, name: ""}));
              }} 
              placeholder="e.g. Website Redesign"
              maxLength={100}
              className={`h-9 bg-white ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Project Code <span className="text-red-500">*</span></label>
            <Input 
              value={formData.code} 
              onChange={(e) => {
                setFormData(p => ({...p, code: e.target.value}));
                if (errors.code) setErrors(p => ({...p, code: ""}));
              }} 
              placeholder="e.g. WR-01"
              maxLength={10}
              className={`h-9 bg-white uppercase ${errors.code ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Input 
              value={formData.description} 
              onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} 
              placeholder="Short description of the project"
              maxLength={300}
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Division</label>
            <Select value={formData.division} onValueChange={(val: any) => setFormData(p => ({...p, division: val || ""}))}>
              <SelectTrigger className="h-9 bg-white text-xs">
                <SelectValue placeholder="Select division...">
                  {formData.division && formData.division !== "none" 
                    ? divisions.find((d) => d._id === formData.division)?.name 
                    : formData.division === "none" 
                      ? "None" 
                      : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs italic text-gray-500">None</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
            <Select value={formData.projectType} onValueChange={(val: any) => setFormData(p => ({...p, projectType: val}))}>
              <SelectTrigger className="h-9 bg-white text-xs capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="external" className="text-xs">External</SelectItem>
                <SelectItem value="internal" className="text-xs">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <Select value={formData.status} onValueChange={(val: any) => setFormData(p => ({...p, status: val}))}>
              <SelectTrigger className="h-9 bg-white text-xs capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started" className="text-xs">Not Started</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="on-hold" className="text-xs">On Hold</SelectItem>
                <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Budgeted Hours</label>
            <Input 
              type="number"
              value={formData.budgetedHours} 
              onChange={(e) => setFormData(p => ({...p, budgetedHours: e.target.value}))} 
              placeholder="e.g. 100"
              className="h-9 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Est. Start Date</label>
            <Input 
              type="date"
              value={formData.estimatedStartDate} 
              onChange={(e) => setFormData(p => ({...p, estimatedStartDate: e.target.value}))} 
              className="h-9 bg-white text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Est. End Date</label>
            <Input 
              type="date"
              value={formData.estimatedEndDate} 
              onChange={(e) => setFormData(p => ({...p, estimatedEndDate: e.target.value}))} 
              className="h-9 bg-white text-xs"
            />
          </div>

          {!initialData && (
            <div className="sm:col-span-2 pt-2 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="activateFirstStage"
                checked={formData.activateFirstStage}
                onChange={(e) => setFormData(p => ({...p, activateFirstStage: e.target.checked}))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label htmlFor="activateFirstStage" className="text-xs text-gray-700 cursor-pointer">
                Activate first stage immediately after creating
              </label>
            </div>
          )}

        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard/projects")} className="rounded-md h-9 text-xs">Cancel</Button>
        <Button 
          onClick={handleSave} 
          className="rounded-md h-9 text-xs"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) ? <Loader className="w-5 h-5 text-current" /> : (initialData ? "Save Project" : "Create Project")}
        </Button>
      </div>
    </div>
  );
}
