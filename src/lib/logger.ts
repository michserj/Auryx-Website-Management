/**
 * Minimal structured logger. Never pass personal data (names, emails, message
 * bodies) or secrets as context — log identifiers and error messages only.
 */
type Ctx = Record<string, string | number | boolean | null | undefined>;

function write(level: "info" | "warn" | "error", msg: string, ctx?: Ctx, err?: unknown) {
  const entry: Record<string, unknown> = { level, msg, time: new Date().toISOString(), ...ctx };
  if (err) entry.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, ctx?: Ctx) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Ctx, err?: unknown) => write("warn", msg, ctx, err),
  error: (msg: string, ctx?: Ctx, err?: unknown) => write("error", msg, ctx, err),
};
