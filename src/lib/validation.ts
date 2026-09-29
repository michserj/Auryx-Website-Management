import { z } from "zod";

// Shared by client forms (instant feedback) and API routes (authoritative checks).

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const phoneRegex = /^\+?[0-9()\-.\s]{7,20}$/;

export const contactSchema = z.object({
  name: trimmed(120).min(1, "Please enter your name or nickname."),
  message: trimmed(5000).min(1, "Please enter a message.").min(5, "Your message is a little short."),
  email: optionalText(254).pipe(z.email("Please enter a valid email address.").optional()),
  phone: optionalText(40).pipe(
    z.string().regex(phoneRegex, "Please enter a valid contact number.").optional(),
  ),
  privacyAck: z.literal(true, { error: "Please acknowledge the Privacy Notice to continue." }),
  // Spam protection: hidden honeypot must stay empty; form must not be submitted instantly.
  website: z.string().max(0).optional(),
  startedAt: z.number().optional(),
});
export type ContactInput = z.input<typeof contactSchema>;

export const bookingSchema = z.object({
  start: z.iso.datetime({ offset: true, error: "Please choose a time slot." }),
  name: trimmed(120).min(1, "Please enter your name."),
  email: trimmed(254).pipe(z.email("Please enter a valid email address.")),
  phone: trimmed(40).regex(phoneRegex, "Please enter a valid contact number."),
  topic: trimmed(1000).optional().default(""),
  privacyAck: z.literal(true, { error: "Please acknowledge the Privacy Notice to continue." }),
  website: z.string().max(0).optional(),
});
export type BookingInput = z.input<typeof bookingSchema>;

export const rescheduleSchema = z.object({
  token: z.string().min(20).max(100),
  start: z.iso.datetime({ offset: true, error: "Please choose a new time slot." }),
});

export const chatSchema = z.object({
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  message: trimmed(1000).min(1),
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
