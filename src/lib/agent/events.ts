import type { TraceStep } from "@/db/schema";

export type AgentEvent =
  | { type: "meta"; conversationId: string; userMessageId: string; assistantMessageId: string }
  | { type: "title"; title: string }
  | { type: "trace"; step: TraceStep }
  | { type: "reasoning"; delta: string }
  | { type: "delta"; delta: string }
  | { type: "terminal"; lines: string[] }
  | { type: "files" }
  | { type: "done" }
  | { type: "error"; message: string };

export type { TraceStep };

export const MODELS = [
  { id: "deepseek-chat", label: "DeepSeek Chat", hint: "Fast · general purpose" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner", hint: "Chain-of-thought · harder tasks" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export function isBuildRequest(text: string) {
  return /\b(build|create|make|generate|write|code|implement|fix|debug|refactor|add|design|scaffold|set up|script|app|website|landing page|component|dashboard|game|api)\b/i.test(
    text,
  );
}
