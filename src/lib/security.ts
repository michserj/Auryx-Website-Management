import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getDb, schema } from "./db";

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function authSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (min. 32 characters) in production");
    }
    return "dev-only-insecure-secret-change-me-please-0123456789";
  }
  return s;
}

export function secretKey(purpose: string) {
  return crypto.createHmac("sha256", authSecret()).update(purpose).digest();
}

/** AES-256-GCM encryption for small secrets stored at rest (e.g. TOTP seeds). */
export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey("enc:v1"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey("enc:v1"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Client IP as reported by the (trusted) proxy. Only ever stored hashed. */
export async function clientIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function ipKey() {
  return crypto.createHmac("sha256", secretKey("ip")).update(await clientIp()).digest("hex").slice(0, 32);
}

/**
 * Fixed-window rate limiter stored in the database, so it works across
 * serverless instances. Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number) {
  const key = `${bucket}:${await ipKey()}`;
  const db = await getDb();
  const rows = await db
    .insert(schema.rateLimits)
    .values({ key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`CASE WHEN ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE ${schema.rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE ${schema.rateLimits.windowStart} END`,
      },
    })
    .returning({ count: schema.rateLimits.count });
  return (rows[0]?.count ?? 0) <= limit;
}

/** Rejects cross-site requests to JSON endpoints (defence in depth alongside SameSite cookies). */
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return; // same-origin fetches from older browsers / server calls
  const host = h.get("x-forwarded-host") ?? h.get("host");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    /* invalid */
  }
  if (!host || originHost !== host) {
    throw new HttpError(403, "Forbidden");
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
