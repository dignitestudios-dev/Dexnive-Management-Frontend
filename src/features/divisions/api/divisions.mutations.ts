import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDivision, updateDivision, deleteDivision } from "./divisions.service";
import { divisionKeys } from "./divisions.queries";

export function useCreateDivisionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
    },
  });
}

export function useUpdateDivisionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDivision,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: divisionKeys.detail(variables.divisionId) });
    },
  });
}

export function useDeleteDivisionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDivision,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: divisionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: divisionKeys.detail(id) });
    },
  });
}
