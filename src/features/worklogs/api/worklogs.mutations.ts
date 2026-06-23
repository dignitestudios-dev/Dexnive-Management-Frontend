import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveDraft, submitWorklog, createNonBillableReason, updateNonBillableReason, deleteNonBillableReason } from "./worklogs.service";
import { SaveDraftPayload, SubmitWorklogPayload } from "../types";
import { worklogKeys } from "./worklogs.queries";

export function useSaveDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveDraftPayload) => saveDraft(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.my(variables.shiftDate) });
      queryClient.invalidateQueries({ queryKey: worklogKeys.list() });
      queryClient.invalidateQueries({ queryKey: worklogKeys.summary() });
    },
  });
}

export function useSubmitWorklogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitWorklogPayload) => submitWorklog(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.my(variables.shiftDate) });
      queryClient.invalidateQueries({ queryKey: worklogKeys.list() });
      queryClient.invalidateQueries({ queryKey: worklogKeys.summary() });
    },
  });
}

export function useCreateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNonBillableReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.reasons() });
    },
  });
}

export function useUpdateReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNonBillableReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.reasons() });
    },
  });
}

export function useDeleteReasonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNonBillableReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.reasons() });
    },
  });
}
