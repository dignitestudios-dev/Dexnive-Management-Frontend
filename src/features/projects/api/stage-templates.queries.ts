import { useQuery } from "@tanstack/react-query";
import { getStageTemplates } from "./stage-templates.service";

export const stageTemplatesKeys = {
  all: ["stage-templates"] as const,
  lists: () => [...stageTemplatesKeys.all, "list"] as const,
  list: (isActive?: boolean) => [...stageTemplatesKeys.lists(), { isActive }] as const,
};

export const useGetStageTemplatesQuery = (isActive?: boolean) => {
  return useQuery({
    queryKey: stageTemplatesKeys.list(isActive),
    queryFn: () => getStageTemplates(isActive),
  });
};
