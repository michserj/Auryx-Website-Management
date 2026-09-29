"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

// The panel (and its logic) is only downloaded when a visitor opens the chat,
// so the assistant never slows down the initial page load.
const ChatPanel = dynamic(() => import("./ChatPanel").then((m) => m.ChatPanel), { ssr: false });

export function ChatLauncher({ greeting, retentionMonths }: { greeting: string; retentionMonths: number }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {loaded && (
        <div hidden={!open}>
          <ChatPanel greeting={greeting} retentionMonths={retentionMonths} onClose={() => setOpen(false)} />
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-controls="auryx-chat"
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="flex h-14 items-center gap-2 rounded-full bg-navy-900 pl-4 pr-5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(8,27,48,0.6)] ring-1 ring-white/10 transition-colors hover:bg-navy-800"
      >
        {open ? <X className="h-5 w-5 text-gold-400" aria-hidden /> : <MessageCircle className="h-5 w-5 text-gold-400" aria-hidden />}
        <span className={open ? "sr-only sm:not-sr-only" : ""}>{open ? "Close" : "Ask Auryx"}</span>
      </button>
    </div>
  );
}
