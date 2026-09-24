import { TOOLS } from "./tools";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  index?: number;
  function: { name: string; arguments: string };
};

export type StreamChunk =
  | { kind: "content"; delta: string }
  | { kind: "reasoning"; delta: string }
  | { kind: "tool_calls"; calls: ToolCall[] }
  | { kind: "finish" };

const API_URL = process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1/chat/completions";

export function hasDeepSeekKey() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function* streamDeepSeek(
  model: string,
  messages: ChatMessage[],
  opts: { tools?: boolean; temperature?: number } = {},
): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.4,
    max_tokens: 8000,
  };
  if (opts.tools !== false) {
    body.tools = TOOLS;
    body.tool_choice = "auto";
  }

  let res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok && opts.tools !== false) {
    // Some models reject tool payloads — retry once without tools.
    delete body.tools;
    delete body.tool_choice;
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${text.slice(0, 400)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const pending = new Map<number, ToolCall>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let json: {
        choices?: {
          delta?: {
            content?: string | null;
            reasoning_content?: string | null;
            tool_calls?: {
              index: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }[];
          };
          finish_reason?: string | null;
        }[];
      };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const choice = json.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta ?? {};
      if (delta.reasoning_content) yield { kind: "reasoning", delta: delta.reasoning_content };
      if (delta.content) yield { kind: "content", delta: delta.content };
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = pending.get(tc.index) ?? {
            id: tc.id ?? `call_${tc.index}`,
            type: "function" as const,
            index: tc.index,
            function: { name: "", arguments: "" },
          };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.function.name += tc.function.name;
          if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
          pending.set(tc.index, existing);
        }
      }
      if (choice.finish_reason) {
        if (pending.size) yield { kind: "tool_calls", calls: [...pending.values()] };
        yield { kind: "finish" };
        return;
      }
    }
  }
  if (pending.size) yield { kind: "tool_calls", calls: [...pending.values()] };
  yield { kind: "finish" };
}

export async function completeOnce(model: string, messages: ChatMessage[], maxTokens = 40) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: false }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() ?? null;
}
