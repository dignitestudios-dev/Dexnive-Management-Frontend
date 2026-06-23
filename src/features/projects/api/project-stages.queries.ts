import { useQuery } from "@tanstack/react-query";
import { projectStagesService } from "./project-stages.service";

export const projectStagesKeys = {
  all: ["projectStages"] as const,
  byProject: (projectId: string) => [...projectStagesKeys.all, "project", projectId] as const,
  detail: (stageId: string) => [...projectStagesKeys.all, "detail", stageId] as const,
};

export function useGetStagesByProjectQuery(projectId: string) {
  return useQuery({
    queryKey: projectStagesKeys.byProject(projectId),
    queryFn: () => projectStagesService.getStagesByProject(projectId),
    enabled: !!projectId,
  });
}

export function useGetStageByIdQuery(stageId: string) {
  return useQuery({
    queryKey: projectStagesKeys.detail(stageId),
    queryFn: () => projectStagesService.getStageById(stageId),
    enabled: !!stageId,
  });
}
