import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, type TraceStep } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import type { AgentEvent } from "@/lib/agent/events";
import { runAgent } from "@/lib/agent/run";
import { completeOnce, hasDeepSeekKey, type ChatMessage } from "@/lib/agent/deepseek";
import { TITLE_PROMPT } from "@/lib/agent/prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

function sse(event: AgentEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function deriveTitle(prompt: string) {
  if (hasDeepSeekKey()) {
    const title = await completeOnce("deepseek-chat", [
      { role: "system", content: TITLE_PROMPT },
      { role: "user", content: prompt.slice(0, 800) },
    ]);
    if (title) return title.replace(/^["'#\s]+|["'.\s]+$/g, "").slice(0, 60);
  }
  const words = prompt.trim().split(/\s+/).slice(0, 6).join(" ");
  return (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 60) || "New chat";
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string;
    content?: string;
    model?: string;
  };
  const content = (body.content ?? "").trim();
  const model = body.model === "deepseek-reasoner" ? "deepseek-reasoner" : "deepseek-chat";
  if (!content) return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });

  let conversationId = body.conversationId ?? "";
  let conversation = conversationId
    ? (
        await db
          .select()
          .from(conversations)
          .where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)))
          .limit(1)
      )[0]
    : undefined;

  if (!conversation) {
    [conversation] = await db
      .insert(conversations)
      .values({ userId: user.id, title: "New chat", model })
      .returning();
  }
  conversationId = conversation.id;

  const [userMessage] = await db
    .insert(messages)
    .values({ conversationId, role: "user", content })
    .returning();

  const prior = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const history: ChatMessage[] = prior
    .slice(-24)
    .map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as ChatMessage["role"],
      content: m.content,
    }))
    .filter((m) => m.content.length > 0 || m.role === "user");

  const [assistantMessage] = await db
    .insert(messages)
    .values({ conversationId, role: "assistant", content: "", model })
    .returning();

  const needsTitle = conversation.title === "New chat";

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => controller.enqueue(encoder.encode(sse(event)));
      let answer = "";
      let reasoning = "";
      const trace: TraceStep[] = [];

      send({
        type: "meta",
        conversationId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      });

      if (needsTitle) {
        deriveTitle(content)
          .then(async (title) => {
            await db
              .update(conversations)
              .set({ title, updatedAt: new Date() })
              .where(eq(conversations.id, conversationId));
            send({ type: "title", title });
          })
          .catch(() => undefined);
      }

      try {
        for await (const event of runAgent({ conversationId, model, history, prompt: content })) {
          if (event.type === "delta") answer += event.delta;
          if (event.type === "reasoning") reasoning += event.delta;
          if (event.type === "trace") {
            const idx = trace.findIndex((s) => s.id === event.step.id);
            if (idx >= 0) trace[idx] = event.step;
            else trace.push(event.step);
          }
          send(event);
        }
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      }

      await db
        .update(messages)
        .set({
          content: answer || "_No response generated._",
          reasoning: reasoning || null,
          trace: trace.length ? trace : null,
        })
        .where(eq(messages.id, assistantMessage.id));
      await db
        .update(conversations)
        .set({ updatedAt: new Date(), model })
        .where(eq(conversations.id, conversationId));

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
