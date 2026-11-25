import { z } from "zod";

export const ALLOWED_EMAIL_DOMAIN = "@northeastern.edu";
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  // The domain check runs on the normalized (trimmed, lowercased) value. A
  // suffix match on "@northeastern.edu" rejects subdomains and look-alikes.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address."))
    .refine((email) => email.endsWith(ALLOWED_EMAIL_DOMAIN), {
      message: `Use your ${ALLOWED_EMAIL_DOMAIN} email address.`,
    }),
  // Passwords are never trimmed or normalized.
  // .min() counts Unicode code points (Zod 4.6.7), so one emoji counts as 1
  // character. The 72-byte cap below is what prevents bcrypt truncation.
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .refine((password) => new TextEncoder().encode(password).length <= PASSWORD_MAX_BYTES, {
      message: `Use ${PASSWORD_MAX_BYTES} bytes or fewer.`,
    }),
});

export type SignupInput = z.infer<typeof signupSchema>;
