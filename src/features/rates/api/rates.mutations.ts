import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRates } from "./rates.service";
import { ratesKeys } from "./rates.queries";

export function useUpdateRatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRates,
    onSuccess: (_, variables) => {
      // Invalidate the specific year we updated
      queryClient.invalidateQueries({ queryKey: ratesKeys.byYear(variables.year) });
    },
  });
}
