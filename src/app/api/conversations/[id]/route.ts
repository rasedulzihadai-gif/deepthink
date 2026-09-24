import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { api } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return row ?? null;
}

export const GET = api(async (_req: Request, ctx: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const conversation = await owned(user.id, id);
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));
  return Response.json({ conversation, messages: rows });
});

export const PATCH = api(async (req: Request, ctx: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; model?: string };
  const [row] = await db
    .update(conversations)
    .set({
      ...(body.title ? { title: body.title.slice(0, 80) } : {}),
      ...(body.model ? { model: body.model } : {}),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id))
    .returning();
  return Response.json({ conversation: row });
});

export const DELETE = api(async (_req: Request, ctx: Ctx) => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await owned(user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  await db.delete(conversations).where(eq(conversations.id, id));
  return Response.json({ ok: true });
});
