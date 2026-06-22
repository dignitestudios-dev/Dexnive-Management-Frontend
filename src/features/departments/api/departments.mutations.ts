import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDepartment, updateDepartment, deleteDepartment } from "./departments.service";
import { departmentKeys } from "./departments.queries";
import { optionKeys } from "@/features/users/api/options.queries";

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: optionKeys.departments() });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.departmentId) });
      queryClient.invalidateQueries({ queryKey: optionKeys.departments() });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: optionKeys.departments() });
    },
  });
}
