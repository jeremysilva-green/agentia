import type { z } from "zod";

// Shared by every "use server" action that validates FormData with Zod —
// turns a ZodError into a { fieldName: message } map so the client can show
// each error next to the field it's actually about, instead of one generic
// message the user has to guess the source of.
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

// For the one top-level `error` string shown when a form has no visible
// field next to the failing one (e.g. a value computed/derived rather than
// directly typed, like Modelo's `city` fallback) — prefixes the field name
// so a generic Zod message ("Invalid input: expected string, received
// undefined") is at least traceable to its source instead of a dead end.
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Datos inválidos";
  const field = issue.path[0];
  return field ? `${String(field)}: ${issue.message}` : issue.message;
}
