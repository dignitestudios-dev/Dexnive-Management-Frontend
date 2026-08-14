"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { DATE_FORMATS, formatDay } from "@/lib/datetime";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useResetWorklogDayMutation } from "../api/worklogs.mutations";

/**
 * "Reset this day" — clears a user's submission, its entries and any
 * missing-entry excuse for one date, so they can log it again from scratch.
 *
 * Admin/Lead only, and destructive, so it always confirms first and names the
 * person and date being reset.
 */
export function ResetDayButton({
  userId,
  userName,
  shiftDate,
  hasData,
  onReset,
}: {
  userId: string;
  userName?: string;
  shiftDate: string;
  /** Nothing to reset on an empty day — the endpoint 404s. */
  hasData: boolean;
  onReset?: () => void;
}) {
  const { isFullManager } = useAuth();
  const [open, setOpen] = useState(false);
  const mutation = useResetWorklogDayMutation();

  if (!isFullManager || !hasData || !userId) return null;

  const person = userName || "This user";

  const confirm = () => {
    mutation.mutate(
      { userId, shiftDate },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success(`Day reset — ${person} can log it again.`);
          onReset?.();
        },
        onError: (error: any) =>
          toast.error(error?.message || "Failed to reset this day"),
      },
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 text-xs font-medium border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
        Reset this day
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reset this day?</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-700">
              This permanently deletes {person}&apos;s worklog for{" "}
              <span className="font-semibold text-gray-900">
                {formatDay(shiftDate, DATE_FORMATS.DAY_LONG)}
              </span>
              , including every project entry and any absence reason on file.
            </p>
            <p className="text-sm text-gray-500">
              They&apos;ll be able to log the day again from scratch. This cannot be
              undone.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirm}
              disabled={mutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[130px]"
            >
              {mutation.isPending ? <Loader className="w-4 h-4 mr-2" /> : null}
              Reset day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
