"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { audit } from "@/lib/audit";
import { log } from "@/lib/logger";

export type LoginState = { error?: string; needTotp?: boolean; email?: string } | null;

const schema = z.object({
  email: z.string().trim().max(254),
  password: z.string().min(1).max(200),
  totp: z.string().trim().max(10).optional(),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totp: formData.get("totp") || undefined,
  });
  if (!parsed.success) return { error: "Please enter your username and password." };

  if (!(await rateLimit("admin-login", 10, 900))) {
    log.warn("admin.login_rate_limited");
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const result = await login(parsed.data.email, parsed.data.password, parsed.data.totp);
  if (!result.ok) {
    return { error: result.error, needTotp: result.needTotp, email: parsed.data.email };
  }
  await audit(parsed.data.email.toLowerCase(), "admin.login");
  redirect("/admin");
}
