import { useQuery } from "@tanstack/react-query";
import { getDivisions, getDivisionById } from "./divisions.service";
import { GetDivisionsParams } from "../types";

export const divisionKeys = {
  all: ["divisions"] as const,
  lists: () => [...divisionKeys.all, "list"] as const,
  list: (filters: GetDivisionsParams) => [...divisionKeys.lists(), filters] as const,
  details: () => [...divisionKeys.all, "detail"] as const,
  detail: (id: string) => [...divisionKeys.details(), id] as const,
};

export function useGetDivisionsQuery(params?: GetDivisionsParams) {
  return useQuery({
    queryKey: divisionKeys.list(params || {}),
    queryFn: () => getDivisions(params),
  });
}

export function useGetDivisionByIdQuery(divisionId: string) {
  return useQuery({
    queryKey: divisionKeys.detail(divisionId),
    queryFn: () => getDivisionById(divisionId),
    enabled: !!divisionId,
  });
}
