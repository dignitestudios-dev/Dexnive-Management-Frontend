"use client";

import React, { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

import { useGetCategoriesQuery } from "../api/categories.queries";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../api/categories.mutations";
import type { Category } from "../types";

/**
 * Manage one department's categories.
 *
 * A Lead sees and edits only their own department — the API scopes both the
 * read and the write, so they need no department picker and `departmentId` is
 * only passed when an Admin is browsing another department's list.
 */
export function CategoryManager({ departmentId }: { departmentId?: string }) {
  const params = departmentId ? { department: departmentId } : undefined;
  const { data, isLoading } = useGetCategoriesQuery(params);
  const categories = data?.data ?? [];

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDialogOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a category name");
      return;
    }

    const onSuccess = () => {
      toast.success(editing ? "Category updated" : "Category added");
      setDialogOpen(false);
    };
    const onError = (error: any) =>
      toast.error(error?.message || "Failed to save category");

    if (editing) {
      updateMutation.mutate({ id: editing._id, name: trimmed }, { onSuccess, onError });
      return;
    }

    if (!departmentId) {
      toast.error("No department resolved — reload and try again.");
      return;
    }
    createMutation.mutate(
      { name: trimmed, department: departmentId },
      { onSuccess, onError },
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-xl">
          Categories group the work your team logs. They appear in the worklog form
          for everyone in this department.
        </p>
        <Button
          onClick={openCreate}
          className="gap-2 bg-primary-600 hover:bg-primary-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-5 h-5 text-gray-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
          <Layers className="w-7 h-7 mb-2 text-gray-400" />
          <p className="text-sm">No categories yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Until one exists, this department cannot log worklogs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="font-medium text-gray-900 text-sm truncate">
                  {category.name}
                </span>
              </span>
              <span className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-primary-600"
                  onClick={() => openEdit(category)}
                  aria-label={`Rename ${category.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-red-600"
                  onClick={() => setToDelete(category)}
                  aria-label={`Delete ${category.name}`}
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
            <DialogTitle>{editing ? "Rename category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <label htmlFor="category-name" className="text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              id="category-name"
              autoFocus
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="e.g. API"
              className="bg-white border-gray-200"
            />
            <p className="text-[11px] text-gray-400">Stored in uppercase.</p>
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
        title="Delete Category"
        itemName={toDelete?.name ?? "category"}
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          deleteMutation.mutate(toDelete._id, {
            onSuccess: () => {
              toast.success("Category deleted");
              setToDelete(null);
            },
            onError: (error: any) =>
              toast.error(error?.message || "Failed to delete category"),
          });
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
