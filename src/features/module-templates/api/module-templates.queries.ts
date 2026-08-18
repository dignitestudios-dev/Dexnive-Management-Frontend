import { useQuery } from "@tanstack/react-query";
import { getModuleTemplates } from "./module-templates.service";
import { GetModuleTemplatesParams } from "../types";

export const moduleTemplatesKeys = {
  all: ["module-templates"] as const,
  lists: () => [...moduleTemplatesKeys.all, "list"] as const,
  list: (params?: GetModuleTemplatesParams) =>
    [...moduleTemplatesKeys.lists(), params ?? {}] as const,
};

export function useGetModuleTemplatesQuery(params?: GetModuleTemplatesParams) {
  return useQuery({
    queryKey: moduleTemplatesKeys.list(params),
    queryFn: () => getModuleTemplates(params),
  });
}
