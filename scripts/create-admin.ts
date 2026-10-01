import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { createDb } from "../src/lib/db/connect";
import * as schema from "../src/lib/db/schema";
import { passwordProblem } from "../src/lib/password-policy";

// Creates the Admin account, or — as the account-recovery path — resets its
// password and two-factor authentication if it already exists.
// Credentials are read interactively (or from ADMIN_EMAIL / ADMIN_PASSWORD for
// non-interactive setups) and are never written anywhere except as a bcrypt hash.
async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const email = (process.env.ADMIN_EMAIL || (await rl.question("Admin username (email): "))).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (await rl.question("Admin password (min. 10 chars, letters and numbers): "));
  rl.close();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  const db = await createDb();
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
  if (existing) {
    await db
      .update(schema.adminUsers)
      .set({
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
        totpEnabled: false,
        totpSecretEnc: null,
        sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminUsers.id, existing.id));
    console.log(`✔ Password reset for ${email}; MFA cleared (re-enable it in Settings) and existing sessions signed out`);
  } else {
    await db.insert(schema.adminUsers).values({ email, passwordHash });
    console.log(`✔ Admin account created for ${email}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
