"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, CalendarDays, Loader2, MessageSquare, SendHorizonal, ShieldCheck, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; actions?: ("contact" | "book")[] };

const SESSION_KEY = "auryx_chat_session";
const ACK_KEY = "auryx_chat_ack";

function safeGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — continue without persistence */
  }
}

function newSessionId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const SUGGESTIONS = ["What does Auryx do?", "Do you work with maritime schools?", "How do I book a consultation?"];

export function ChatPanel({
  greeting,
  retentionMonths,
  onClose,
}: {
  greeting: string;
  retentionMonths: number;
  onClose: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(() => safeGet(ACK_KEY) === "1");
  const [sessionId] = useState(() => {
    const existing = safeGet(SESSION_KEY);
    if (existing) return existing;
    const id = newSessionId();
    safeSet(SESSION_KEY, id);
    return id;
  });
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (acknowledged) inputRef.current?.focus();
  }, [acknowledged]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      const json = await res.json().catch(() => ({}));
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: "assistant", content: json.reply, actions: json.actions }
          : {
              role: "assistant",
              content: json.message ?? "Sorry, I'm having trouble right now. Please send us a message or book a consultation.",
              actions: ["contact", "book"],
            },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect. Please try again, or send us a message instead.",
          actions: ["contact"],
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section
      id="auryx-chat"
      role="dialog"
      aria-label="Auryx chat assistant"
      className="flex h-[min(620px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(8,27,48,0.45)] animate-fade-up"
    >
      <header className="flex items-center gap-3 bg-navy-900 px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Bot className="h-5 w-5 text-gold-400" aria-hidden />
        </span>
        <div className="flex-1 leading-tight">
          <p className="font-semibold">Auryx Assistant</p>
          <p className="text-xs text-navy-200">AI assistant · answers from approved Auryx information</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10" aria-label="Close chat">
          <X className="h-5 w-5" />
        </button>
      </header>

      {!acknowledged ? (
        <div className="flex flex-1 flex-col justify-center gap-4 p-6">
          <ShieldCheck className="h-8 w-8 text-navy-600" aria-hidden />
          <h2 className="text-lg font-semibold">Before you start</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>You&apos;re chatting with an AI assistant, not a person. It can make mistakes; the Auryx team can confirm details.</li>
            <li>
              Conversations are stored for up to {retentionMonths} months so we can review questions and follow up on
              requests. Please don&apos;t share sensitive personal information.
            </li>
            <li>
              See our{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-navy-700 underline">
                Privacy Notice
              </Link>{" "}
              for details and your rights.
            </li>
          </ul>
          <button
            type="button"
            className="btn-navy mt-2"
            onClick={() => {
              safeSet(ACK_KEY, "1");
              setAcknowledged(true);
            }}
          >
            I understand, start chat
          </button>
        </div>
      ) : (
        <>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-surface p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    m.role === "user" ? "rounded-br-sm bg-navy-600 text-white" : "rounded-bl-sm border border-line bg-white text-ink"
                  }`}
                >
                  <span className="sr-only">{m.role === "user" ? "You said: " : "Assistant: "}</span>
                  {m.content}
                  {m.actions && m.actions.length > 0 && (
                    <span className="mt-3 flex flex-wrap gap-2">
                      {m.actions.includes("contact") && (
                        <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Send a Message
                        </Link>
                      )}
                      {m.actions.includes("book") && (
                        <Link href="/consultation" className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-gold-500/25">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Book a Consultation
                        </Link>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-line bg-white px-3.5 py-2.5 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Thinking…
                </div>
              </div>
            )}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form
            className="flex items-end gap-2 border-t border-line bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about Auryx…"
              className="field max-h-28 min-h-[42px] resize-none py-2"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-navy-600 text-white hover:bg-navy-700 disabled:opacity-40"
              aria-label="Send"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </form>
          <p className="bg-white px-4 pb-2.5 text-center text-[11px] text-muted">
            AI assistant · Conversations stored up to {retentionMonths} months ·{" "}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
