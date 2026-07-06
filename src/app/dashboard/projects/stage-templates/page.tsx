"use client";
import { Loader } from "@/components/ui/loader";

import { useState } from "react";
import { 
  useGetStageTemplatesQuery 
} from "@/features/projects/api/stage-templates.queries";
import { 
  useCreateStageTemplateMutation, 
  useUpdateStageTemplateMutation, 
  useDeleteStageTemplateMutation,
  useReorderStageTemplatesMutation
} from "@/features/projects/api/stage-templates.mutations";
import { Plus, AlertCircle, Pencil, Trash2, Tag, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { StageTemplate } from "@/features/projects/api/stage-templates.service";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  order: z.number().int().min(1, "Order must be at least 1"),
  isActive: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function ManageStageTemplatesPage() {
  const { data: templatesResponse, isLoading, isError } = useGetStageTemplatesQuery();
  const createMutation = useCreateStageTemplateMutation();
  const updateMutation = useUpdateStageTemplateMutation();
  const deleteMutation = useDeleteStageTemplateMutation();
  const reorderMutation = useReorderStageTemplatesMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", order: 1, isActive: true }
  });

  const templates = templatesResponse?.data || [];

  const openCreateModal = () => {
    // Default order to the next available number (or 1 if none)
    const nextOrder = templates.length > 0 ? Math.max(...templates.map(t => t.order)) + 1 : 1;
    form.reset({ name: "", order: nextOrder, isActive: true });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: StageTemplate) => {
    form.reset({ 
      name: template.name, 
      order: template.order, 
      isActive: template.isActive 
    });
    setEditingId(template._id);
    setIsModalOpen(true);
  };

  const onSubmit = (data: TemplateFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: { name: data.name, isActive: data.isActive } }, {
        onSuccess: () => {
          toast.success("Stage template updated successfully");
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update stage template");
        }
      });
    } else {
      createMutation.mutate({ name: data.name, order: data.order }, {
        onSuccess: () => {
          toast.success("Stage template created successfully");
          setIsModalOpen(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to create stage template");
        }
      });
    }
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete, {
        onSuccess: () => {
          toast.success("Stage template deleted successfully");
          setTemplateToDelete(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to delete stage template");
        }
      });
    }
  };

  const moveTemplate = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === templates.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const currentTemplate = templates[index];
    const swapTemplate = templates[swapIndex];

    const payload = {
      templates: [
        { templateId: currentTemplate._id, order: swapTemplate.order },
        { templateId: swapTemplate._id, order: currentTemplate.order }
      ]
    };

    reorderMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Order updated");
      },
      onError: () => {
        toast.error("Failed to update order");
      }
    });
  };

  // Sort templates by order to be safe, though backend should return sorted.
  const sortedTemplates = [...templates].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto py-10 px-4 md:px-0">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Stages Template
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage the default stages template that can be used when creating new projects.
              </p>
            </div>
            <Button onClick={openCreateModal} className="h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader className="w-8 h-8 mb-4 text-primary" />
              <p>Loading stage templates...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>Failed to load stage templates.</p>
            </div>
          ) : sortedTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No templates defined</h3>
              <p className="text-sm text-gray-500 mb-4">You haven't created any stage templates yet.</p>
              <Button onClick={openCreateModal} variant="outline">Create your first template</Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Reorder</th>
                  <th className="px-6 py-4 w-full">Template Name</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTemplates.map((template, index) => (
                  <ContextMenu key={template._id}>
                    <ContextMenuTrigger render={<tr className="hover:bg-gray-50/50 transition-colors cursor-context-menu" />}>
                      <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-gray-900"
                          onClick={() => moveTemplate(index, "up")}
                          disabled={index === 0 || reorderMutation.isPending}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-gray-900"
                          onClick={() => moveTemplate(index, "down")}
                          disabled={index === sortedTemplates.length - 1 || reorderMutation.isPending}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{template.name}</td>
                    <td className="px-6 py-4 text-center">
                      {template.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 p-1">
                      <ContextMenuItem onClick={() => openEditModal(template)} className="flex items-center gap-2 py-1.5 text-xs text-gray-700">
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        <span>Edit Template</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator className="my-1" />
                      <ContextMenuItem onClick={() => setTemplateToDelete(template._id)} className="flex items-center gap-2 py-1.5 text-xs text-red-600 hover:text-red-700 focus:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Template</span>
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
            <DialogTitle>{editingId ? "Edit Stage Template" : "Add Stage Template"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Security Audit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {editingId && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-sm text-gray-500">
                          Inactive templates will not appear as options when creating new projects.
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
              )}
              
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader className="w-4 h-4 mr-2" />
                  ) : null}
                  {editingId ? "Save Changes" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        title="Delete Stages Template"
        itemName="template"
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
