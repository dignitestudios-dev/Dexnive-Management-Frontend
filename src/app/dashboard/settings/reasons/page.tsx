"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { 
  useGetNonBillableReasonsQuery 
} from "@/features/worklogs/api/worklogs.queries";
import { 
  useCreateReasonMutation, 
  useUpdateReasonMutation, 
  useDeleteReasonMutation 
} from "@/features/worklogs/api/worklogs.mutations";
import { Plus, AlertCircle, Edit, Pencil, Trash2, Tag, ChevronLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { toast } from "sonner";

const CATEGORIES = [
  "productivity",
  "meeting",
  "client",
  "technical",
  "management",
  "personal",
  "other",
] as const;

const reasonSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  code: z.string().max(20, "Code must be less than 20 characters").optional(),
  category: z.enum(CATEGORIES),
  requiresNote: z.boolean().optional(),
});

type ReasonFormValues = z.infer<typeof reasonSchema>;

export default function ManageReasonsPage() {
  const { data: reasonsResponse, isLoading, isError } = useGetNonBillableReasonsQuery();
  const createMutation = useCreateReasonMutation();
  const updateMutation = useUpdateReasonMutation();
  const deleteMutation = useDeleteReasonMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<string | null>(null);

  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { name: "", code: "", category: "other", requiresNote: false }
  });

  const openCreateModal = () => {
    form.reset({ name: "", code: "", category: "other", requiresNote: false });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reason: any) => {
    form.reset({ 
      name: reason.name, 
      code: reason.code || "", 
      category: reason.category || "other",
      requiresNote: reason.requiresNote || false
    });
    setEditingId(reason._id);
    setIsModalOpen(true);
  };

  const onSubmit = (data: ReasonFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data }, {
        onSuccess: () => {
          toast.success("Reason updated successfully");
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update reason");
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Reason created successfully");
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to create reason");
        }
      });
    }
  };

  const confirmDelete = () => {
    if (reasonToDelete) {
      deleteMutation.mutate(reasonToDelete, {
        onSuccess: () => {
          toast.success("Reason deleted successfully");
          setReasonToDelete(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to delete reason");
        }
      });
    }
  };

  const reasons = reasonsResponse?.data || [];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto py-10 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Non-Billable Reasons
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage the categories available for users when they log missing or non-billable time.
              </p>
            </div>
            <Button onClick={openCreateModal} className="h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Reason
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader className="w-8 h-8 mb-4 text-primary" />
              <p>Loading reasons...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>Failed to load reasons.</p>
            </div>
          ) : reasons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reasons defined</h3>
              <p className="text-sm text-gray-500 mb-4">You haven't created any non-billable reasons yet.</p>
              <Button onClick={openCreateModal} variant="outline">Create your first reason</Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Reason Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-center">Requires Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reasons.map((reason: any) => (
                  <ContextMenu key={reason._id}>
                    <ContextMenuTrigger render={<tr className="hover:bg-gray-50/50 transition-colors cursor-context-menu" />}>
                    <td className="px-6 py-4 font-medium text-gray-900">{reason.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {reason.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {reason.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{reason.code || <span className="text-gray-400">—</span>}</td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {reason.requiresNote ? "Yes" : "No"}
                    </td>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 p-1">
                      <ContextMenuItem onClick={() => openEditModal(reason)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        <span>Edit</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator className="my-1" />
                      <ContextMenuItem onClick={() => setReasonToDelete(reason._id)} className="flex items-center gap-2 py-1.5 text-xs text-red-600 hover:text-red-700 focus:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Reason" : "Add Reason"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 pb-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Training, Internal Meeting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TRN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiresNote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Requires Note</FormLabel>
                      <p className="text-sm text-gray-500">
                        Force users to write a note when selecting this reason.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader className="w-4 h-4 mr-2" />
                  ) : null}
                  {editingId ? "Save Changes" : "Create Reason"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        title="Delete Reason"
        itemName="reason"
        isOpen={!!reasonToDelete}
        onClose={() => setReasonToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}


