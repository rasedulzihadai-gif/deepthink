import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildPreviewDocument, listFiles, writeFile } from "@/lib/agent/vfs";
import { api } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

type Guard = { error: Response } | { ok: true };

async function guard(id: string): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .limit(1);
  if (!row) return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  return { ok: true as const };
}

export const GET = api(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const files = await listFiles(id);
  return Response.json({ files, preview: files.length ? buildPreviewDocument(files) : null });
});

export const PUT = api(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const body = (await req.json().catch(() => ({}))) as { path?: string; content?: string };
  if (!body.path) return Response.json({ error: "path required" }, { status: 400 });
  await writeFile(id, body.path, body.content ?? "");
  const files = await listFiles(id);
  return Response.json({ files, preview: buildPreviewDocument(files) });
});
