// Deterministic, AI-free responder used when no AI provider is configured or the
// provider fails. It only ever returns approved knowledge verbatim.
import type { KnowledgeItem } from "./knowledge";

const STOP = new Set(
  "a an the is are was be to of and or in on for with do does can could would will i you we us our your my me it this that what which how who where when why about any have has please tell know".split(
    " ",
  ),
);

// "you"/"your" in a visitor's question refer to Auryx.
const SYNONYMS: Record<string, string> = { you: "auryx", your: "auryx", yours: "auryx", app: "application", apps: "application" };

function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w)
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
}

export function tokenize(text: string) {
  return words(text).filter((w) => w.length >= 2 && !STOP.has(w));
}

export function bestMatch(message: string, items: KnowledgeItem[]) {
  // 1. The visitor asked (almost) exactly an approved question, e.g. a suggested question chip.
  const asked = words(message).join(" ");
  const exact = items.find((i) => words(i.title).join(" ") === asked);
  if (exact) return exact;

  const tokens = new Set(tokenize(message));
  if (tokens.size === 0) return null;
  let best: { item: KnowledgeItem; score: number } | null = null;
  for (const item of items) {
    const title = new Set(tokenize(item.title));
    const keywords = new Set(tokenize(item.keywords));
    let score = 0;
    for (const w of tokens) {
      if (keywords.has(w)) score += 2;
      if (title.has(w)) score += 1.5;
    }
    score = score / Math.sqrt(Math.max(tokens.size, 1));
    if (!best || score > best.score) best = { item, score };
  }
  return best && best.score >= 1.4 ? best.item : null;
}

const GREETING = /^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|musta|hallo|hei)\b/i;
const PRICING = /\b(price|pricing|cost|quote|quotation|how much|budget|rate|fee)s?\b/i;
const HUMAN = /\b(human|person|real person|agent|staff|someone)\b/i;

export type Tag = "contact" | "book" | "lead";

export function faqReply(message: string, items: KnowledgeItem[]): { text: string; tags: Tag[] } {
  if (PRICING.test(message)) {
    return {
      text: "Pricing depends on the scope of each project, so I can't give a price here. The best next step is to book a consultation or send us a message describing what you need, and the team will follow up.",
      tags: ["book", "contact", "lead"],
    };
  }
  if (HUMAN.test(message)) {
    return {
      text: "I'm an AI assistant. To reach the Auryx team directly, send a message through the Contact page or book a consultation.",
      tags: ["contact", "book"],
    };
  }
  const match = bestMatch(message, items);
  if (match) {
    const isBooking = /consult|book|meeting|schedule/i.test(match.title);
    return { text: match.content, tags: isBooking ? ["book"] : [] };
  }
  if (GREETING.test(message.trim())) {
    return {
      text: "Hello! You can ask me what Auryx does, about our services, maritime systems, or how to book a consultation.",
      tags: [],
    };
  }
  return {
    text: "I'm sorry, I don't have that information. The Auryx team can help, please send us a message or book a consultation.",
    tags: ["contact", "book"],
  };
}
