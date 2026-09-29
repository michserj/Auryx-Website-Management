import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { getContent } from "@/lib/settings";
import { getPublishedServices } from "@/lib/content";

// Content is managed in the Admin Dashboard, so pages render per request.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, services, chatbot, retention] = await Promise.all([
    getContent("site"),
    getPublishedServices(),
    getContent("chatbot"),
    getContent("retention"),
  ]);
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site={site} services={services.map((s) => ({ slug: s.slug, title: s.title }))} />
      {chatbot.enabled && <ChatLauncher greeting={chatbot.greeting} retentionMonths={retention.chatMonths} />}
    </>
  );
}
