/**
 * How a department records what it worked on.
 *
 * Every category block on a worklog entry carries either a structured task
 * breakdown or a plain description — the API requires exactly one of the two.
 * Which one is decided by the logging user's *department*, not by the user and
 * not by their role: a Backend Lead logs like the Backend team, a Design Lead
 * logs like the Design team.
 *
 * The reason it cannot be a free choice: `module` is a required field on every
 * task line, so a department that should not see a Module field cannot use the
 * task format at all.
 *
 * The backend enforces no department rule of its own, so this module is the
 * only place the distinction exists.
 */

export type EntryFormat = "tasks" | "notes";

/**
 * Departments that log a structured breakdown — Category, Module, Description,
 * Complexity.
 *
 * Matched case-insensitively after trimming. Department records are created at
 * runtime rather than seeded, so this is the one place to correct if a name
 * differs in the database.
 */
const STRUCTURED_DEPARTMENTS = ["web", "backend", "frontend"];

/**
 * Aliases for the descriptive departments, kept only so an unexpected spelling
 * is still classified deliberately rather than by the fallback.
 *
 * Design, Project Management and SQA log Category + Description only.
 */
const DESCRIPTIVE_DEPARTMENTS = [
  "design",
  "project management",
  "pm",
  "sqa",
  "qa",
  "quality assurance",
];

/** Read a department name off a user, whether it is populated or just an id. */
function departmentName(user: unknown): string {
  const department = (user as any)?.department;
  if (!department) return "";
  if (typeof department === "string") return department;
  return department.name ?? "";
}

/**
 * The format this user's department logs in.
 *
 * Unknown departments fall back to "notes" on purpose: the task format depends
 * on the project already having modules seeded, so defaulting an unrecognised
 * department to it could leave those users unable to log at all. A description
 * always works.
 */
export function entryFormatForUser(user: unknown): EntryFormat {
  const name = departmentName(user).trim().toLowerCase();
  if (!name) return "notes";
  if (STRUCTURED_DEPARTMENTS.includes(name)) return "tasks";
  if (DESCRIPTIVE_DEPARTMENTS.includes(name)) return "notes";
  return "notes";
}

/** Whether the Module field is shown at all for this user. */
export function showsModuleField(user: unknown): boolean {
  return entryFormatForUser(user) === "tasks";
}
