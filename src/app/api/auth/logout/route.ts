import { destroySession } from "@/lib/auth";
import { api } from "@/lib/api";

export const POST = api(async () => {
  await destroySession();
  return Response.json({ ok: true });
});
