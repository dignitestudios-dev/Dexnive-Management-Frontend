/**
 * Backend-department task rows are stored inside a worklog entry's plain
 * `description` field, one task per line:
 *
 *   1.) Auth Module | Added refresh-token rotation | HIGH
 *
 * The same shape is produced on save, re-parsed when hydrating a saved draft,
 * and accepted on bulk paste — so the format lives here rather than being
 * written out three times.
 */

export interface BackendTask {
  module: string;
  task: string;
  difficulty: string;
}

export const BACKEND_TASK_LINE =
  /^\d+\.\)\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(HIGH|MEDIUM|LOW)\s*$/i;

export const EMPTY_BACKEND_TASK: BackendTask = {
  module: "",
  task: "",
  difficulty: "LOW",
};

/** Render task rows into the numbered pipe-delimited description format. */
export function serializeBackendTasks(tasks: BackendTask[] = []): string {
  return tasks
    .filter((task) => task.module && task.task)
    .map((task, i) => `${i + 1}.) ${task.module} | ${task.task} | ${task.difficulty}`)
    .join("\n");
}

/**
 * Parse a description back into task rows.
 *
 * Returns null unless *every* non-empty line parses — a partially matching
 * description is treated as free text so a normal note is never silently
 * shredded into malformed rows.
 */
export function parseBackendTasks(description?: string | null): BackendTask[] | null {
  if (!description) return null;

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return null;

  const parsed: BackendTask[] = [];
  for (const line of lines) {
    const match = line.match(BACKEND_TASK_LINE);
    if (!match) return null;
    parsed.push({
      module: match[1].trim(),
      task: match[2].trim(),
      difficulty: match[3].toUpperCase().trim(),
    });
  }

  return parsed.length > 0 ? parsed : null;
}
