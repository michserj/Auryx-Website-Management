export function siteUrl(path = "") {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || vercel || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
