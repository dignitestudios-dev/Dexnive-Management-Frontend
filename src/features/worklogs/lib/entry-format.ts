"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * How a project entry describes its work.
 *
 * The API takes exactly one of `tasks` or `description` per entry, so this is a
 * genuine either/or rather than two fields that can both be filled.
 */
export type EntryFormat = "tasks" | "notes";

/**
 * Departments whose work always decomposes into module/task/difficulty, so they
 * log a structured breakdown and are not offered free-form notes.
 *
 * Compared case-insensitively against the department name.
 */
const STRUCTURED_ONLY_DEPARTMENTS = ["web", "backend"];

const STORAGE_KEY = "worklog-entry-format";

/** Read a department name off a user, whether it is populated or just an id. */
function departmentName(user: unknown): string {
  const department = (user as any)?.department;
  if (!department) return "";
  if (typeof department === "string") return department;
  return department.name ?? "";
}

/**
 * Whether this user may choose free-form notes instead of a task breakdown.
 *
 * Leads always may, whatever department they sit in — the role wins over the
 * department rule. Everyone else may unless they are in a structured-only
 * department.
 */
export function canUseFreeForm(user: unknown, isLead: boolean): boolean {
  if (isLead) return true;
  const name = departmentName(user).trim().toLowerCase();
  if (!name) return true; // no department on record — don't withhold the choice
  return !STRUCTURED_ONLY_DEPARTMENTS.includes(name);
}

function readStoredFormat(): EntryFormat | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "tasks" || stored === "notes" ? stored : null;
  } catch {
    // Private mode or blocked storage — fall back to the default.
    return null;
  }
}

function writeStoredFormat(format: EntryFormat): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, format);
  } catch {
    // Persisting the preference is a convenience, never a requirement.
  }
}

/**
 * The user's remembered choice of entry format, used as the default for new
 * project rows.
 *
 * Asking on every entry would be noise, so the last choice sticks. It is still
 * only a *default* — the per-entry toggle can override it for a single row
 * without changing the preference.
 *
 * Starts at "tasks" on first render and syncs from storage in an effect, so the
 * server and client agree on the first paint.
 */
export function useEntryFormatPreference(): [EntryFormat, (next: EntryFormat) => void] {
  const [format, setFormat] = useState<EntryFormat>("tasks");

  useEffect(() => {
    const stored = readStoredFormat();
    if (stored) setFormat(stored);
  }, []);

  const remember = useCallback((next: EntryFormat) => {
    setFormat(next);
    writeStoredFormat(next);
  }, []);

  return [format, remember];
}
