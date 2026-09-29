import type { Metadata } from "next";
import { getContent } from "@/lib/settings";
import { Markdown } from "@/components/Markdown";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Auryx Software collects, uses, stores and protects personal information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const privacy = await getContent("privacy");
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Notice" />
      <section className="container-page max-w-3xl py-16">
        <p className="text-sm text-muted">
          Version {privacy.version} · Last updated {privacy.lastUpdated}
        </p>
        <Markdown className="mt-8">{privacy.body}</Markdown>
      </section>
    </>
  );
}
