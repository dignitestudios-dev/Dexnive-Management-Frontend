"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { formatMinutes } from "../lib/day-balance";

/**
 * Gate on the rare case where non-billable time couldn't be attributed to any
 * project — a project's own logged minutes were too small to carry its share.
 * The API refuses to submit until the user explains it.
 */
export function UnassignedNoteDialog({
  open,
  onOpenChange,
  minutes,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minutes: number;
  isSubmitting?: boolean;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const trimmed = note.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>One last thing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                {formatMinutes(minutes)} couldn&apos;t be assigned to a project
              </p>
              <p className="text-amber-800 mt-1 text-xs leading-relaxed">
                Your projects didn&apos;t log enough time between them to absorb all
                the non-billable time for this day, so this amount sits at the day
                level. Tell us briefly what it was.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="unassigned-note"
              className="text-sm font-medium text-gray-700"
            >
              What was this time spent on?
            </label>
            <Textarea
              id="unassigned-note"
              autoFocus
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Company all-hands and onboarding session"
              className="bg-white border-gray-200 text-sm resize-none"
            />
            <p className="text-[11px] text-gray-400">Required to submit this day.</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed || isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px]"
          >
            {isSubmitting ? <Loader className="w-4 h-4 mr-2" /> : null}
            Submit day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
