import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, deleteCategory, updateCategory } from "./categories.service";
import { categoriesKeys } from "./categories.queries";

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: categoriesKeys.all });
}

export function useCreateCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: createCategory, onSuccess: invalidate });
}

export function useUpdateCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: updateCategory, onSuccess: invalidate });
}

export function useDeleteCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: deleteCategory, onSuccess: invalidate });
}
