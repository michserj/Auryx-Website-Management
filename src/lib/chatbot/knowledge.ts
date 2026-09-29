import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { getContent } from "../settings";

export type KnowledgeItem = {
  category: string;
  title: string;
  content: string;
  keywords: string;
};

/**
 * Approved knowledge = admin-managed knowledge entries (enabled only)
 * + published service descriptions + published case studies + core company facts.
 * Nothing else is given to the model.
 */
export async function loadKnowledge(): Promise<KnowledgeItem[]> {
  const db = await getDb();
  const [entries, services, cases, about, site, booking] = await Promise.all([
    db
      .select()
      .from(schema.knowledgeEntries)
      .where(eq(schema.knowledgeEntries.enabled, true))
      .orderBy(asc(schema.knowledgeEntries.sortOrder), asc(schema.knowledgeEntries.createdAt)),
    db
      .select()
      .from(schema.services)
      .where(eq(schema.services.published, true))
      .orderBy(asc(schema.services.sortOrder)),
    db.select().from(schema.caseStudies).where(eq(schema.caseStudies.status, "published")),
    getContent("about"),
    getContent("site"),
    getContent("booking"),
  ]);

  const items: KnowledgeItem[] = [
    {
      category: "company",
      title: "About Auryx Software",
      content: `${about.description} Tagline: ${site.tagline} Location: ${site.location}. Contact email: ${site.contactEmail}.`,
      keywords: "about company auryx who",
    },
    {
      category: "company",
      title: `Founder: ${about.founderName}`,
      content: about.founderBio,
      keywords: "founder captain knut bentzrod",
    },
    {
      category: "company",
      title: "Consultations",
      content: booking.enabled
        ? `Visitors can book a consultation on the website's Book a Consultation page (/consultation). Availability: Monday to Friday, ${booking.dayStart} to ${booking.dayEnd} Philippine time. Consultations are ${booking.durationMinutes} minutes.`
        : "Online consultation booking is temporarily unavailable; visitors can use the Contact page instead.",
      keywords: "consultation book meeting schedule appointment call availability",
    },
  ];

  for (const e of entries) {
    items.push({ category: e.category, title: e.question, content: e.answer, keywords: e.keywords });
  }
  for (const s of services) {
    items.push({
      category: "service",
      title: `Service: ${s.title}`,
      content: `${s.summary} ${s.body} Includes: ${s.features.join(", ")}. More: /services/${s.slug}`,
      keywords: `${s.title} ${s.features.join(" ")}`,
    });
  }
  for (const c of cases) {
    items.push({
      category: "case_study",
      title: `Case study: ${c.title}`,
      content: [c.summary, c.clientContext, c.challenge, c.solution, c.features.length ? `Features: ${c.features.join(", ")}.` : "", c.technology, c.outcome, `More: /case-studies/${c.slug}`]
        .filter(Boolean)
        .join(" "),
      keywords: `${c.title} ${c.features.join(" ")} case study project example`,
    });
  }
  return items;
}

export function knowledgeToText(items: KnowledgeItem[]) {
  return items
    .map((k, i) => `[${i + 1}] (${k.category}) ${k.title}\n${k.content}`)
    .join("\n\n");
}
