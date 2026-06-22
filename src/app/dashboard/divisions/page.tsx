"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetDivisionsQuery } from "@/features/divisions/api/divisions.queries";
import { useCreateDivisionMutation, useUpdateDivisionMutation, useDeleteDivisionMutation } from "@/features/divisions/api/divisions.mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DivisionsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useGetDivisionsQuery({ search });
  const divisions = data?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiv, setEditingDiv] = useState<{ _id: string; name: string } | null>(null);
  const [name, setName] = useState("");

  const createMutation = useCreateDivisionMutation();
  const updateMutation = useUpdateDivisionMutation();
  const deleteMutation = useDeleteDivisionMutation();

  const handleOpenDialog = (div?: { _id: string; name: string }) => {
    if (div) {
      setEditingDiv(div);
      setName(div.name);
    } else {
      setEditingDiv(null);
      setName("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("Name is required");

    if (editingDiv) {
      updateMutation.mutate(
        { divisionId: editingDiv._id, name: name.trim() },
        {
          onSuccess: () => {
            toast.success("Division updated successfully");
            setIsDialogOpen(false);
          },
          onError: () => toast.error("Failed to update division")
        }
      );
    } else {
      createMutation.mutate(
        { name: name.trim() },
        {
          onSuccess: () => {
            toast.success("Division created successfully");
            setIsDialogOpen(false);
          },
          onError: () => toast.error("Failed to create division")
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this division?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Division deleted successfully"),
        onError: () => toast.error("Failed to delete division")
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Divisions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage organizational divisions.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="rounded-md px-4 py-2 gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          Add Division
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
              placeholder="Search divisions..."
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
          ) : divisions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No divisions found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {divisions.map((div) => (
                <div key={div._id} className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" title={div.name}>{div.name}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          Created {div.createdAt ? new Date(div.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(div)} className="h-7 w-7 text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(div._id)} className="h-7 w-7 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDiv ? "Edit Division" : "Add Division"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Division Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Mobile"
              className="h-9"
            />
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
    </div>
  );
}
