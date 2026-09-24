import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, publicUser } from "@/lib/auth";

const DEMO_EMAIL = "demo@deepthink.dev";

/** One-click demo access so the agent can be tried without signing up. */
export async function POST() {
  let [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email: DEMO_EMAIL,
        name: "Demo Builder",
        passwordHash: hashPassword("demo-password-123"),
        plan: "Demo",
      })
      .returning();
  }
  await createSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
