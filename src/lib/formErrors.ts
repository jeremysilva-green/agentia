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
