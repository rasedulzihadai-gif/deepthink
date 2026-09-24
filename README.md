# DeepThink — Think deep. Build fast.

An autonomous AI agent platform with a Claude.ai-style interface, running on the **DeepSeek API**.
Give it one instruction ("build me a portfolio site", "write a CSV cleaning script") and it plans,
calls tools, writes real files, validates them and hands back a finished project you can preview
and export.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | API routes live in-process with the UI — one deploy target, no cross-service auth juggling |
| Styling | Tailwind CSS v4 + custom shadcn-style primitives | Token-driven light/dark theme (`--canvas`, `--surface`, `--accent`) |
| Animation | Framer Motion | Message fade-in, trace steps, sidebar/workspace transitions |
| State | Zustand | `src/store/chat.ts` holds chat, stream, workspace state |
| LLM | DeepSeek (`deepseek-chat`, `deepseek-reasoner`) | Streaming SSE + OpenAI-style function calling |
| DB | PostgreSQL + **Drizzle ORM** | Drizzle (not Prisma) because this environment is provisioned for it; schema in `src/db/schema.ts`, client created lazily so a missing `DATABASE_URL` degrades instead of crashing boot |
| Auth | Cookie sessions in Postgres (scrypt hashes) | Same session table an OAuth provider would plug into; avoids a NextAuth adapter for the MVP |
| Fonts | Self-hosted Inter (`@fontsource-variable/inter`) | No `next/font/google` fetch at build time — `next build` works offline / in air-gapped CI |
| Sandbox | Virtual file system + static validation + iframe preview | Per spec: no arbitrary code execution in v1 |

## Getting started

```bash
npm install
cp .env.example .env    # set DATABASE_URL; DEEPSEEK_API_KEY is optional
npm run db:push         # create tables (drizzle-kit, reads DATABASE_URL)
npm run dev
```

Open http://localhost:3000. Use **Continue with demo account** on the login page for one-click access.

> Without `DEEPSEEK_API_KEY`, DeepThink runs a built-in offline agent. It still plans, writes real
> files into the virtual FS, runs the build check and streams the trace — so the whole loop is
> demonstrable with no key.

> Without `DATABASE_URL`, the app still boots: the landing, login and signup pages render, and the
> API routes answer `503 {"error":"Database not configured"}` instead of crashing. The database
> client is created lazily on first query (`src/db/index.ts`), so nothing that doesn't need Postgres
> is blocked by it. `/api/health` reports `not_configured` / `unreachable` / `connected`.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run build       # next build — no network needed (Inter is self-hosted via @fontsource-variable/inter)
```

## The agent loop

1. `POST /api/chat` persists the user turn and opens an SSE stream.
2. `runAgent()` (`src/lib/agent/run.ts`) sends the conversation + tool schema to DeepSeek.
3. Content deltas stream to the client; `reasoning_content` (Reasoner) streams into a collapsible
   "Chain of thought" block.
4. Tool calls are executed server-side and reported as **Working trace** steps.
5. After writes, the model calls `run_command("build")`; failures come back as tool output and the
   model self-corrects (max 12 agent turns, failure circuit-breaker at 6).
6. Final message, trace and reasoning are written back to Postgres.

### Tools

| Tool | Behaviour |
| --- | --- |
| `file_write(path, content)` | Upserts into `project_files` |
| `file_read(path)` | Reads a file |
| `file_edit(path, find, replace)` | First-match replacement |
| `list_files(directory)` | Project tree |
| `run_command(command)` | Allowlist: `build`, `lint`, `test`, `ls`, `npm install <pkg>`, `node <file>`, `python <file>`. Build/lint/test run static validation (JSON parse, brace balance, missing asset refs) |
| `web_search(query)` | Documented placeholder |

## Routes

- `/` landing page · `/login`, `/signup` · `/chat`, `/chat/[id]`
- `POST /api/chat` (SSE) · `/api/conversations[/id]` · `/api/projects/[id]/files` · `/api/projects/[id]/export` (ZIP)
- `/api/auth/{signup,login,logout,demo}` · `/api/health`

Every handler is wrapped in `api()` (`src/lib/api.ts`), so a thrown error becomes JSON rather than
Next's 500 HTML page: `401` unauthenticated, `503` when the database is missing/unreachable,
`500` for anything unexpected.

## Deployment

Deploy to Vercel (frontend + API routes) with a managed Postgres (Neon/Railway/Render). Set
`DATABASE_URL`, `DEEPSEEK_API_KEY`, and run `npm run db:push` against the production database.

## Roadmap

- WebContainers / Docker sandbox for real execution
- S3-compatible storage for exported projects
- Google OAuth on top of the existing session table
