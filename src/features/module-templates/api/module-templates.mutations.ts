import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createModuleTemplate,
  deleteModuleTemplate,
  updateModuleTemplate,
} from "./module-templates.service";
import { moduleTemplatesKeys } from "./module-templates.queries";

function useInvalidateModuleTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: moduleTemplatesKeys.all });
}

export function useCreateModuleTemplateMutation() {
  const invalidate = useInvalidateModuleTemplates();
  return useMutation({ mutationFn: createModuleTemplate, onSuccess: invalidate });
}

export function useUpdateModuleTemplateMutation() {
  const invalidate = useInvalidateModuleTemplates();
  return useMutation({ mutationFn: updateModuleTemplate, onSuccess: invalidate });
}

export function useDeleteModuleTemplateMutation() {
  const invalidate = useInvalidateModuleTemplates();
  return useMutation({ mutationFn: deleteModuleTemplate, onSuccess: invalidate });
}
