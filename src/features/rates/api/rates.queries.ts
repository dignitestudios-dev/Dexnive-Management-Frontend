import { useQuery } from "@tanstack/react-query";
import { getRates } from "./rates.service";

export const ratesKeys = {
  all: ["rates"] as const,
  byYear: (year: number) => [...ratesKeys.all, year] as const,
};

export function useGetRatesQuery(year: number) {
  return useQuery({
    queryKey: ratesKeys.byYear(year),
    queryFn: () => getRates(year),
  });
}
