import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { TOTP, Secret } from "otpauth";
import { getDb, schema } from "./db";
import { decrypt } from "./security";
import { signSession, verifySession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./session";

export type AdminSession = { id: string; email: string };

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
let dummyHash: Promise<string> | undefined;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function totpFor(secretBase32: string, email: string) {
  return new TOTP({
    issuer: "Auryx Admin",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

type LoginResult = { ok: true } | { ok: false; error: string; needTotp?: boolean };

export async function login(email: string, password: string, totpCode?: string): Promise<LoginResult> {
  const generic = "Invalid username, password or code.";
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email.trim().toLowerCase()));

  if (!user) {
    // Equalize timing with the bcrypt path to avoid user enumeration.
    dummyHash ??= bcrypt.hash("timing-equalizer", 12);
    await bcrypt.compare(password, await dummyHash);
    return { ok: false, error: generic };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: "Too many failed attempts. Please try again later." };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  let totpOk = true;
  if (passwordOk && user.totpEnabled && user.totpSecretEnc) {
    if (!totpCode) return { ok: false, error: "Enter your authenticator code.", needTotp: true };
    const delta = totpFor(decrypt(user.totpSecretEnc), user.email).validate({
      token: totpCode.replace(/\s/g, ""),
      window: 1,
    });
    totpOk = delta !== null;
  }

  if (!passwordOk || !totpOk) {
    const failed = user.failedLogins + 1;
    await db
      .update(schema.adminUsers)
      .set({
        failedLogins: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      })
      .where(eq(schema.adminUsers.id, user.id));
    return { ok: false, error: generic, needTotp: passwordOk && user.totpEnabled };
  }

  await db
    .update(schema.adminUsers)
    .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));

  const token = await signSession({ sub: user.id, ver: user.sessionVersion });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Validates the session cookie against the database (revocable via sessionVersion). */
export async function getAdmin(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const db = await getDb();
  const [user] = await db
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, ver: schema.adminUsers.sessionVersion })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, payload.sub));
  if (!user || user.ver !== payload.ver) return null;
  return { id: user.id, email: user.email };
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
