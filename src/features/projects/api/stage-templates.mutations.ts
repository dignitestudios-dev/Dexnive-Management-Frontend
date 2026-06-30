import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStageTemplate,
  updateStageTemplate,
  deleteStageTemplate,
  reorderStageTemplates,
  CreateStageTemplatePayload,
  UpdateStageTemplatePayload,
  ReorderStageTemplatePayload
} from "./stage-templates.service";
import { stageTemplatesKeys } from "./stage-templates.queries";

export const useCreateStageTemplateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateStageTemplatePayload) => createStageTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageTemplatesKeys.all });
    },
  });
};

export const useUpdateStageTemplateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStageTemplatePayload }) => 
      updateStageTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageTemplatesKeys.all });
    },
  });
};

export const useDeleteStageTemplateMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteStageTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageTemplatesKeys.all });
    },
  });
};

export const useReorderStageTemplatesMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ReorderStageTemplatePayload) => reorderStageTemplates(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageTemplatesKeys.all });
    },
  });
};
