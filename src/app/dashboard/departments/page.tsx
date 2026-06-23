"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetDepartmentsQuery } from "@/features/departments/api/departments.queries";
import { useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from "@/features/departments/api/departments.mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetDepartmentsQuery({ search });
  const departments = data?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<{ _id: string; name: string; defaultRate?: number } | null>(null);
  const [name, setName] = useState("");
  const [defaultRate, setDefaultRate] = useState<number>(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);

  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const deleteMutation = useDeleteDepartmentMutation();

  const handleOpenDialog = (dept?: { _id: string; name: string; defaultRate?: number }) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setDefaultRate(dept.defaultRate || 0);
    } else {
      setEditingDept(null);
      setName("");
      setDefaultRate(0);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("Name is required");

    if (editingDept) {
      updateMutation.mutate(
        { departmentId: editingDept._id, name: name.trim(), defaultRate: Number(defaultRate) },
        {
          onSuccess: () => {
            toast.success("Department updated successfully");
            setIsDialogOpen(false);
          },
          onError: () => toast.error("Failed to update department")
        }
      );
    } else {
      createMutation.mutate(
        { name: name.trim(), defaultRate: Number(defaultRate) },
        {
          onSuccess: () => {
            toast.success("Department created successfully");
            setIsDialogOpen(false);
          },
          onError: () => toast.error("Failed to create department")
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    setDeletingDeptId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingDeptId) {
      deleteMutation.mutate(deletingDeptId, {
        onSuccess: () => {
          toast.success("Department deleted successfully");
          setIsDeleteDialogOpen(false);
          setDeletingDeptId(null);
        },
        onError: () => toast.error("Failed to delete department")
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage organizational departments.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="rounded-md px-4 py-2 gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-md bg-white w-full h-9 shadow-sm"
            />
          </div>
        </div>
        <div className="p-6 bg-gray-50/30">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : departments.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No departments found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departments.map((dept) => (
                <ContextMenu key={dept._id}>
                  <ContextMenuTrigger render={<div />}>
                    <div className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-context-menu">
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate" title={dept.name}>{dept.name}</h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              Created {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-100 flex flex-col gap-1.5 mt-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Default Rate</span>
                            <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              ${dept.defaultRate !== undefined ? dept.defaultRate : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48 p-1">
                    <ContextMenuItem onClick={() => handleOpenDialog(dept)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit Department</span>
                    </ContextMenuItem>
                    <ContextMenuSeparator className="my-1" />
                    <ContextMenuItem onClick={() => handleDelete(dept._id)} className="flex items-center gap-2 py-1.5 text-xs text-red-600 hover:text-red-700 focus:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDept ? "Edit Department" : "Add Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Department Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Engineering"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Default Rate ($)</label>
              <Input 
                type="number"
                value={defaultRate} 
                onChange={(e) => setDefaultRate(Number(e.target.value))} 
                placeholder="0"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-md">Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="rounded-md bg-primary hover:bg-primary-600 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Department</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete this department? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-md">Cancel</Button>
            <Button 
              onClick={confirmDelete} 
              className="rounded-md bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin text-current" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
