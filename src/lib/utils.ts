import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupLabel(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = startOfToday.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const day = 86_400_000;
  if (diff <= 0) return "Today";
  if (diff <= day) return "Yesterday";
  if (diff <= 7 * day) return "Previous 7 days";
  if (diff <= 30 * day) return "Previous 30 days";
  return "Older";
}

export function guessLanguage(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
    sh: "bash",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] ?? "text";
}
