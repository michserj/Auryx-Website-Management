import type { MetadataRoute } from "next";
import { getPublishedCaseStudies, getPublishedServices } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, cases] = await Promise.all([getPublishedServices(), getPublishedCaseStudies()]);
  const pages = ["", "/about", "/services", "/case-studies", "/contact", "/consultation", "/privacy"];
  return [
    ...pages.map((p) => ({ url: siteUrl(p || "/"), changeFrequency: "monthly" as const, priority: p ? 0.7 : 1 })),
    ...services.map((s) => ({ url: siteUrl(`/services/${s.slug}`), lastModified: s.updatedAt, priority: 0.8 })),
    ...cases.map((c) => ({ url: siteUrl(`/case-studies/${c.slug}`), lastModified: c.updatedAt, priority: 0.6 })),
  ];
}
