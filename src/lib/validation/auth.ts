import { z } from "zod";

export const ALLOWED_EMAIL_DOMAIN = "@northeastern.edu";
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

// Red-stage stub (#4): accepts any strings and enforces no rules yet.
export const signupSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

export type SignupInput = z.infer<typeof signupSchema>;
