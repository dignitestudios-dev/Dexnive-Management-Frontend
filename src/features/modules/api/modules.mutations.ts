import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createModule, deleteModule, updateModule } from "./modules.service";
import { modulesKeys } from "./modules.queries";

function useInvalidateModules() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: modulesKeys.all });
}

export function useCreateModuleMutation() {
  const invalidate = useInvalidateModules();
  return useMutation({ mutationFn: createModule, onSuccess: invalidate });
}

export function useUpdateModuleMutation() {
  const invalidate = useInvalidateModules();
  return useMutation({ mutationFn: updateModule, onSuccess: invalidate });
}

export function useDeleteModuleMutation() {
  const invalidate = useInvalidateModules();
  return useMutation({ mutationFn: deleteModule, onSuccess: invalidate });
}
