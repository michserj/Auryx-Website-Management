import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface ChatProvider {
  readonly name: string;
  reply(input: { system: string; history: ChatTurn[] }): Promise<string>;
}

/* --------------------------------- Anthropic -------------------------------- */
// Default: Claude Haiku 4.5 — a lightweight, low-cost, low-latency model, which
// matches the BA's preference for a cost-conscious chatbot model. Override with AI_MODEL.
class AnthropicProvider implements ChatProvider {
  readonly name = "anthropic";
  private client = new Anthropic({
    apiKey: process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    timeout: 20_000,
    maxRetries: 1,
  });
  private model = process.env.AI_MODEL || "claude-haiku-4-5";

  async reply({ system, history }: { system: string; history: ChatTurn[] }) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    });
    if (response.stop_reason === "refusal") {
      return "I'm sorry, I can't help with that here. For questions about Auryx, please send us a message or book a consultation. [[contact]] [[book]]";
    }
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  }
}

/* ----------------------------- OpenAI-compatible ---------------------------- */
// Lets Auryx switch to another vendor exposing the common /chat/completions API
// (e.g. OpenAI, Groq, Mistral, a self-hosted model) purely via env configuration.
class OpenAICompatibleProvider implements ChatProvider {
  readonly name = "openai-compatible";
  async reply({ system, history }: { system: string; history: ChatTurn[] }) {
    const base = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        max_tokens: 1024,
        messages: [{ role: "system", content: system }, ...history],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`AI provider error (${res.status})`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return (json.choices?.[0]?.message?.content ?? "").trim();
  }
}

/**
 * AI_PROVIDER = anthropic | openai-compatible | none
 * Returns null when no AI provider is configured; the FAQ matcher is used instead.
 */
export function getChatProvider(): ChatProvider | null {
  const name = process.env.AI_PROVIDER ?? (process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY ? "anthropic" : "none");
  if (name === "anthropic" && (process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY)) return new AnthropicProvider();
  if (name === "openai-compatible" && process.env.AI_API_KEY && process.env.AI_MODEL) return new OpenAICompatibleProvider();
  return null;
}

export function describeProvider() {
  const p = getChatProvider();
  if (!p) return "FAQ matcher (no AI provider configured)";
  return `${p.name} · ${process.env.AI_MODEL || (p.name === "anthropic" ? "claude-haiku-4-5" : "")}`;
}
