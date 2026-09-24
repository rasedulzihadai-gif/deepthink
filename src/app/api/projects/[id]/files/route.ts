import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { buildPreviewDocument, listFiles, writeFile } from "@/lib/agent/vfs";

async function guard(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .limit(1);
  if (!row) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { ok: true as const };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const files = await listFiles(id);
  return NextResponse.json({ files, preview: files.length ? buildPreviewDocument(files) : null });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const body = (await req.json().catch(() => ({}))) as { path?: string; content?: string };
  if (!body.path) return NextResponse.json({ error: "path required" }, { status: 400 });
  await writeFile(id, body.path, body.content ?? "");
  const files = await listFiles(id);
  return NextResponse.json({ files, preview: buildPreviewDocument(files) });
}
