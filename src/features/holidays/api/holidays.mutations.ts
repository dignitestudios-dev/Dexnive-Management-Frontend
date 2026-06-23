import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHoliday, deleteHoliday } from "./holidays.service";
import { CreateHolidayPayload } from "../types";
import { holidaysKeys } from "./holidays.queries";

export function useCreateHolidayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHolidayPayload) => createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidaysKeys.lists() });
    },
  });
}

export function useDeleteHolidayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidaysKeys.lists() });
    },
  });
}
