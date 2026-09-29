import { NextResponse } from "next/server";
import { chatSchema } from "@/lib/validation";
import { assertSameOrigin, HttpError, rateLimit } from "@/lib/security";
import { handleChatMessage } from "@/lib/chatbot/engine";
import { getContent } from "@/lib/settings";
import { log } from "@/lib/logger";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const chatbot = await getContent("chatbot");
    if (!chatbot.enabled) {
      return NextResponse.json({ message: "The assistant is currently unavailable." }, { status: 503 });
    }
    const parsed = chatSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: "Please enter a shorter message." }, { status: 400 });

    if (!(await rateLimit("chat", 30, 600))) {
      return NextResponse.json(
        {
          message: "You're sending messages quickly, please wait a moment. You can also send us a message or book a consultation.",
          actions: ["contact", "book"],
        },
        { status: 429 },
      );
    }
    const result = await handleChatMessage(parsed.data.sessionId, parsed.data.message);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ message: err.message }, { status: err.status });
    log.error("chat.failed", {}, err);
    return NextResponse.json(
      { message: "Sorry, I'm having trouble right now. Please send us a message or book a consultation." },
      { status: 500 },
    );
  }
}
