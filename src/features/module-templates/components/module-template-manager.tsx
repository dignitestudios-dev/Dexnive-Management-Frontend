"use client";

import React, { useState } from "react";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";

import { useGetModuleTemplatesQuery } from "../api/module-templates.queries";
import {
  useCreateModuleTemplateMutation,
  useDeleteModuleTemplateMutation,
  useUpdateModuleTemplateMutation,
} from "../api/module-templates.mutations";
import type { ModuleTemplate } from "../types";

/**
 * The module list every new project starts with.
 *
 * Editing a template does not touch projects already created — their modules
 * were copied at creation time and are managed on the project itself.
 */
export function ModuleTemplateManager() {
  const { data, isLoading } = useGetModuleTemplatesQuery();
  const templates = data?.data ?? [];

  const createMutation = useCreateModuleTemplateMutation();
  const updateMutation = useUpdateModuleTemplateMutation();
  const deleteMutation = useDeleteModuleTemplateMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleTemplate | null>(null);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<ModuleTemplate | null>(null);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a template name");
      return;
    }

    const onSuccess = () => {
      toast.success(editing ? "Template updated" : "Template added");
      setDialogOpen(false);
    };
    const onError = (error: any) =>
      toast.error(error?.message || "Failed to save template");

    if (editing) {
      updateMutation.mutate({ id: editing._id, name: trimmed }, { onSuccess, onError });
    } else {
      createMutation.mutate({ name: trimmed }, { onSuccess, onError });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-xl">
          Every new project is created with these modules. Changing a template
          does not affect projects that already exist — those are managed on the
          project itself.
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setName("");
            setDialogOpen(true);
          }}
          className="gap-2 bg-primary-600 hover:bg-primary-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-5 h-5 text-gray-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
          <Boxes className="w-7 h-7 mb-2 text-gray-400" />
          <p className="text-sm">No module templates yet</p>
          <p className="text-xs text-gray-400 mt-1">
            New projects will start with an empty module list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => (
            <div
              key={template._id}
              className="group flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Boxes className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="font-medium text-gray-900 text-sm truncate">
                  {template.name}
                </span>
                {template.isActive === false && (
                  <Badge
                    variant="outline"
                    className="bg-gray-50 text-gray-500 border-gray-200 text-[10px] shrink-0"
                  >
                    Inactive
                  </Badge>
                )}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={template.isActive !== false}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate(
                      { id: template._id, isActive: checked },
                      {
                        onError: (error: any) =>
                          toast.error(error?.message || "Failed to update template"),
                      },
                    )
                  }
                  aria-label={`Toggle ${template.name}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  onClick={() => {
                    setEditing(template);
                    setName(template.name);
                    setDialogOpen(true);
                  }}
                  aria-label={`Rename ${template.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  onClick={() => setToDelete(template)}
                  aria-label={`Delete ${template.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Rename template" : "Add template"}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <label htmlFor="template-name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="template-name"
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
        title="Delete Module Template"
        itemName={toDelete?.name ?? "template"}
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          deleteMutation.mutate(toDelete._id, {
            onSuccess: () => {
              toast.success("Template deleted");
              setToDelete(null);
            },
            onError: (error: any) =>
              toast.error(error?.message || "Failed to delete template"),
          });
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
