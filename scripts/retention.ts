// CLI wrapper for environments with a system cron (e.g. a VPS). On platforms
// with HTTP cron (e.g. Vercel Cron), call GET /api/cron/retention instead.
async function main() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/cron/retention`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log(res.status, await res.text());
  if (!res.ok) process.exit(1);
}
main();
