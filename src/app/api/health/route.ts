import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { ok: false, database: "not_configured", hint: "Set DATABASE_URL in .env" },
      { status: 503 },
    );
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected" });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        detail: process.env.NODE_ENV === "production" ? undefined : (err as Error).message,
      },
      { status: 503 },
    );
  }
}
