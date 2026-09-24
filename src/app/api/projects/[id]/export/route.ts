import JSZip from "jszip";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { listFiles } from "@/lib/agent/vfs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .limit(1);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files = await listFiles(id);
  if (!files.length) return NextResponse.json({ error: "Project is empty" }, { status: 400 });

  const zip = new JSZip();
  for (const file of files) zip.file(file.path, file.content);
  const buffer = await zip.generateAsync({ type: "uint8array" });
  const slug =
    conversation.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "deepthink-project";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
    },
  });
}
