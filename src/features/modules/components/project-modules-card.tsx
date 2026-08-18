"use client";

import React, { useState } from "react";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";

import { useGetModulesQuery } from "../api/modules.queries";
import {
  useCreateModuleMutation,
  useDeleteModuleMutation,
  useUpdateModuleMutation,
} from "../api/modules.mutations";
import type { Module } from "../types";

/**
 * A project's modules, managed from the project page.
 *
 * These are what the worklog form offers on a task line, so a project with no
 * modules cannot be logged against by the departments that record a structured
 * breakdown — which is why this sits on the project itself rather than behind a
 * settings screen.
 *
 * `canManage` should be Admin / PM / Lead; everyone else sees a read-only list.
 */
export function ProjectModulesCard({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const { data, isLoading } = useGetModulesQuery(projectId);
  const modules = data?.data ?? [];

  const createMutation = useCreateModuleMutation();
  const updateMutation = useUpdateModuleMutation();
  const deleteMutation = useDeleteModuleMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Module | null>(null);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a module name");
      return;
    }

    const onSuccess = () => {
      toast.success(editing ? "Module updated" : "Module added");
      setDialogOpen(false);
    };
    const onError = (error: any) =>
      toast.error(error?.message || "Failed to save module");

    if (editing) {
      updateMutation.mutate({ id: editing._id, name: trimmed }, { onSuccess, onError });
    } else {
      createMutation.mutate({ project: projectId, name: trimmed }, { onSuccess, onError });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className="shadow-sm border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary-600" />
            Modules ({modules.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Offered when logging work against this project.
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setName("");
              setDialogOpen(true);
            }}
            className="gap-1.5 h-8 bg-primary-600 hover:bg-primary-700 text-white shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        )}
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader className="w-5 h-5 text-gray-400" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">No modules on this project yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              {canManage
                ? "Add one so the team can log structured work against it."
                : "An admin or lead needs to add one before structured work can be logged."}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => (
              <span
                key={module._id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1.5 py-1 text-xs font-medium text-gray-800"
              >
                {module.name}
                {canManage && (
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(module);
                        setName(module.name);
                        setDialogOpen(true);
                      }}
                      className="p-1 rounded-full text-gray-400 hover:text-primary-600 hover:bg-white"
                      aria-label={`Rename ${module.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(module)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-white"
                      aria-label={`Delete ${module.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Rename module" : "Add module"}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <label htmlFor="module-name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="module-name"
              autoFocus
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="e.g. Auth"
              className="bg-white border-gray-200"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={isSaving}
              className="bg-primary-600 hover:bg-primary-700 text-white min-w-[100px]"
            >
              {isSaving ? <Loader className="w-4 h-4 mr-2" /> : null}
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        title="Delete Module"
        itemName={toDelete?.name ?? "module"}
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          deleteMutation.mutate(toDelete._id, {
            onSuccess: () => {
              toast.success("Module deleted");
              setToDelete(null);
            },
            onError: (error: any) =>
              toast.error(error?.message || "Failed to delete module"),
          });
        }}
        isDeleting={deleteMutation.isPending}
      />
    </Card>
  );
}
