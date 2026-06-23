import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectStagesService } from "./project-stages.service";
import { projectStagesKeys } from "./project-stages.queries";
import { 
  CreateProjectStagePayload, 
  UpdateStageStatusPayload, 
  UpdateStageDetailsPayload, 
  ReorderStagesPayload 
} from "../types";

export function useCreateStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectStagePayload) => projectStagesService.createStage(payload),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: projectStagesKeys.byProject(variables.project) });
    },
  });
}

export function useUpdateStageStatusMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStageStatusPayload) => projectStagesService.updateStageStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectStagesKeys.byProject(projectId) });
    },
  });
}

export function useUpdateStageDetailsMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStageDetailsPayload) => projectStagesService.updateStageDetails(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectStagesKeys.byProject(projectId) });
    },
  });
}

export function useReorderStagesMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderStagesPayload) => projectStagesService.reorderStages(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectStagesKeys.byProject(projectId) });
    },
  });
}

export function useDeleteStageMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stageId: string) => projectStagesService.deleteStage(stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectStagesKeys.byProject(projectId) });
    },
  });
}
