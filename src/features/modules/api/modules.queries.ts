import { useQuery } from "@tanstack/react-query";
import { getModules } from "./modules.service";
import { GetModulesParams } from "../types";

export const modulesKeys = {
  all: ["modules"] as const,
  lists: () => [...modulesKeys.all, "list"] as const,
  /** Keyed by project: switching a worklog row's project must refetch. */
  list: (params: GetModulesParams) => [...modulesKeys.lists(), params] as const,
};

/**
 * Modules available on a project.
 *
 * Disabled until a project is chosen — the API rejects the call without one,
 * and a worklog row has no project until the user picks it.
 */
export function useGetModulesQuery(project?: string, includeInactive = false) {
  return useQuery({
    queryKey: modulesKeys.list({ project: project ?? "", includeInactive }),
    queryFn: () => getModules({ project: project as string, includeInactive }),
    enabled: !!project,
    staleTime: 5 * 60 * 1000,
  });
}
