import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { api } from "@/lib/api";

export const GET = api(async () => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt));
  return Response.json({ conversations: rows });
});

export const POST = api(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; model?: string };
  const [row] = await db
    .insert(conversations)
    .values({
      userId: user.id,
      title: body.title?.slice(0, 80) || "New chat",
      model: body.model ?? "deepseek-chat",
    })
    .returning();
  return Response.json({ conversation: row });
});
