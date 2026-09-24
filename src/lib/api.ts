import { NextResponse } from "next/server";
import { DatabaseNotConfiguredError, isDbUnavailable } from "@/db";

type Handler<A extends unknown[]> = (...args: A) => Promise<Response>;

/** Maps a thrown error onto the JSON response the client should see. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (err instanceof DatabaseNotConfiguredError) {
    return NextResponse.json(
      {
        error: "Database not configured",
        detail: err.message,
      },
      { status: 503 },
    );
  }

  if (isDbUnavailable(err)) {
    return NextResponse.json(
      {
        error: "Database unavailable",
        detail: process.env.NODE_ENV === "production" ? undefined : (err as Error).message,
      },
      { status: 503 },
    );
  }

  console.error("[api] unhandled error", err);
  return NextResponse.json(
    {
      error: "Internal server error",
      detail: process.env.NODE_ENV === "production" ? undefined : (err as Error).message,
    },
    { status: 500 },
  );
}

/**
 * Wraps a route handler so a thrown error becomes a JSON response instead of
 * Next.js' generic 500 HTML page. Usage:
 *
 *   export const GET = api(async (req: Request, ctx: { params: Promise<{ id: string }> }) => { ... })
 */
export function api<A extends unknown[]>(handler: Handler<A>): Handler<A> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
