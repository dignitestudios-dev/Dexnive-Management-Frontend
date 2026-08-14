import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorklog,
  resetWorklogDay,
  saveDraft,
  submitMissingReason,
  submitWorklog,
} from "./worklogs.service";
import {
  MissingReasonPayload,
  ResetWorklogDayParams,
  SaveDraftPayload,
  SubmitWorklogPayload,
} from "../types";
import { worklogKeys } from "./worklogs.queries";

/**
 * Any write to a day can move totals on the calendar, the missing-day list and
 * the summary at once, so every worklog mutation invalidates the whole
 * `worklogs` tree plus the specific day it touched.
 */
function useInvalidateWorklogs() {
  const queryClient = useQueryClient();
  return (shiftDate?: string) => {
    if (shiftDate) {
      queryClient.invalidateQueries({ queryKey: worklogKeys.my(shiftDate) });
    }
    queryClient.invalidateQueries({ queryKey: worklogKeys.all });
  };
}

export function useSaveDraftMutation() {
  const invalidate = useInvalidateWorklogs();

  return useMutation({
    mutationFn: (payload: SaveDraftPayload) => saveDraft(payload),
    onSuccess: (_, variables) => invalidate(variables.shiftDate),
  });
}

export function useSubmitWorklogMutation() {
  const invalidate = useInvalidateWorklogs();

  return useMutation({
    mutationFn: (payload: SubmitWorklogPayload) => submitWorklog(payload),
    onSuccess: (_, variables) => invalidate(variables.shiftDate),
  });
}

export function useSubmitMissingReasonMutation() {
  const invalidate = useInvalidateWorklogs();

  return useMutation({
    mutationFn: (payload: MissingReasonPayload) => submitMissingReason(payload),
    onSuccess: (_, variables) => invalidate(variables.shiftDate),
  });
}

export function useDeleteWorklogMutation() {
  const invalidate = useInvalidateWorklogs();

  return useMutation({
    mutationFn: (id: string) => deleteWorklog(id),
    onSuccess: () => invalidate(),
  });
}

/** Admin/Lead: clear a locked day so the user can log it again. */
export function useResetWorklogDayMutation() {
  const invalidate = useInvalidateWorklogs();

  return useMutation({
    mutationFn: (params: ResetWorklogDayParams) => resetWorklogDay(params),
    onSuccess: (_, variables) => invalidate(variables.shiftDate),
  });
}
