import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectFiles } from "@/db/schema";

export type VFile = { path: string; content: string };

function normalize(path: string) {
  return path.replace(/^\.?\/+/, "").replace(/\/+/g, "/").trim();
}

export async function listFiles(conversationId: string, directory = ""): Promise<VFile[]> {
  const rows = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.conversationId, conversationId))
    .orderBy(asc(projectFiles.path));
  const dir = normalize(directory);
  return rows
    .filter((r) => (dir ? r.path.startsWith(dir) : true))
    .map((r) => ({ path: r.path, content: r.content }));
}

export async function readFile(conversationId: string, path: string): Promise<string | null> {
  const p = normalize(path);
  const rows = await db
    .select()
    .from(projectFiles)
    .where(and(eq(projectFiles.conversationId, conversationId), eq(projectFiles.path, p)))
    .limit(1);
  return rows[0]?.content ?? null;
}

export async function writeFile(conversationId: string, path: string, content: string) {
  const p = normalize(path);
  await db
    .insert(projectFiles)
    .values({ conversationId, path: p, content })
    .onConflictDoUpdate({
      target: [projectFiles.conversationId, projectFiles.path],
      set: { content, updatedAt: new Date() },
    });
  return p;
}

export async function editFile(
  conversationId: string,
  path: string,
  find: string,
  replace: string,
): Promise<{ ok: boolean; message: string }> {
  const current = await readFile(conversationId, path);
  if (current === null) return { ok: false, message: `File not found: ${path}` };
  if (!current.includes(find)) return { ok: false, message: `Pattern not found in ${path}` };
  const next = current.replace(find, replace);
  await writeFile(conversationId, path, next);
  return { ok: true, message: `Edited ${path}` };
}

export async function deleteProjectFiles(conversationId: string) {
  await db.delete(projectFiles).where(eq(projectFiles.conversationId, conversationId));
}

/** Lightweight static validation used by the `run_command` build check. */
export function validateProject(files: VFile[]): string[] {
  const problems: string[] = [];
  const paths = new Set(files.map((f) => f.path));
  for (const f of files) {
    if (f.path.endsWith(".json")) {
      try {
        JSON.parse(f.content);
      } catch (err) {
        problems.push(`${f.path}: invalid JSON (${(err as Error).message})`);
      }
    }
    if (/\.(js|jsx|ts|tsx|css)$/.test(f.path)) {
      const open = (f.content.match(/{/g) ?? []).length;
      const close = (f.content.match(/}/g) ?? []).length;
      if (open !== close) problems.push(`${f.path}: unbalanced braces (${open} open / ${close} close)`);
    }
    if (f.path.endsWith(".html")) {
      const refs = [...f.content.matchAll(/(?:src|href)="(?!https?:|#|mailto:|data:)([^"]+)"/g)].map(
        (m) => m[1].replace(/^\.?\//, ""),
      );
      for (const ref of refs) {
        if (!paths.has(ref)) problems.push(`${f.path}: references missing file "${ref}"`);
      }
    }
  }
  return problems;
}

/** Build a single self-contained HTML doc for the preview iframe. */
export function buildPreviewDocument(files: VFile[]): string {
  const entry =
    files.find((f) => f.path === "index.html") ?? files.find((f) => f.path.endsWith(".html"));
  if (!entry) {
    const listing = files.map((f) => `<li>${f.path}</li>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:ui-sans-serif,system-ui;padding:40px;color:#44403c;background:#faf9f7}
      h1{font-size:18px;margin:0 0 12px} ul{padding-left:18px;line-height:1.8;font-family:ui-monospace,monospace;font-size:13px}
    </style></head><body><h1>No HTML entry point to preview</h1><ul>${listing}</ul></body></html>`;
  }
  let html = entry.content;
  const dirOf = (p: string) => p.split("/").slice(0, -1).join("/");
  const base = dirOf(entry.path);
  const resolve = (ref: string) => {
    const clean = ref.replace(/^\.\//, "").replace(/^\//, "");
    return base ? `${base}/${clean}` : clean;
  };
  html = html.replace(
    /<link[^>]+href="(?!https?:)([^"]+)"[^>]*>/g,
    (match, href: string) => {
      const file = files.find((f) => f.path === resolve(href));
      return file ? `<style>\n${file.content}\n</style>` : match;
    },
  );
  html = html.replace(
    /<script([^>]*)src="(?!https?:)([^"]+)"([^>]*)><\/script>/g,
    (match, _a: string, src: string) => {
      const file = files.find((f) => f.path === resolve(src));
      return file ? `<script type="module">\n${file.content}\n</script>` : match;
    },
  );
  return html;
}
