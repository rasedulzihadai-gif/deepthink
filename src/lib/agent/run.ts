import { randomUUID } from "crypto";
import type { AgentEvent } from "./events";
import { hasDeepSeekKey, streamDeepSeek, type ChatMessage, type ToolCall } from "./deepseek";
import { runFallbackAgent } from "./fallback";
import { SYSTEM_PROMPT } from "./prompt";
import { runTool } from "./tools";

const MAX_TURNS = 12;

function traceEvent(
  id: string,
  label: string,
  kind: "plan" | "tool" | "validate" | "fix" | "done" | "error",
  status: "running" | "done" | "error",
  detail?: string,
): AgentEvent {
  return { type: "trace", step: { id, label, kind, status, detail } };
}

function kindFor(toolName: string): "tool" | "validate" {
  return toolName === "run_command" ? "validate" : "tool";
}

export async function* runAgent(opts: {
  conversationId: string;
  model: string;
  history: ChatMessage[];
  prompt: string;
}): AsyncGenerator<AgentEvent> {
  const { conversationId, model, history, prompt } = opts;

  if (!hasDeepSeekKey()) {
    yield* runFallbackAgent(
      conversationId,
      prompt,
      "_Demo mode — no `DEEPSEEK_API_KEY` is configured, so I'm running the built-in offline agent. Every tool call, file write and build check below is real._",
    );
    return;
  }

  const convo: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  let producedOutput = false;
  let failureCount = 0;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let content = "";
      let calls: ToolCall[] = [];

      for await (const chunk of streamDeepSeek(model, convo)) {
        if (chunk.kind === "content") {
          content += chunk.delta;
          producedOutput = true;
          yield { type: "delta", delta: chunk.delta };
        } else if (chunk.kind === "reasoning") {
          yield { type: "reasoning", delta: chunk.delta };
        } else if (chunk.kind === "tool_calls") {
          calls = chunk.calls;
        }
      }

      if (!calls.length) {
        if (turn > 0) yield traceEvent(randomUUID(), "Task complete", "done", "done");
        return;
      }

      convo.push({
        role: "assistant",
        content,
        tool_calls: calls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.function.name, arguments: c.function.arguments || "{}" },
        })),
      });

      for (const call of calls) {
        let args: Record<string, unknown> = {};
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          args = {};
        }
        const stepId = randomUUID();
        const kind = kindFor(call.function.name);
        yield traceEvent(stepId, describe(call.function.name, args), kind, "running");

        const result = await runTool(conversationId, call.function.name, args);
        if (!result.ok) failureCount += 1;

        yield traceEvent(
          stepId,
          result.label,
          result.ok ? kind : "fix",
          result.ok ? "done" : "error",
          result.detail,
        );
        if (result.terminal?.length) yield { type: "terminal", lines: result.terminal };
        if (result.touchedFiles) yield { type: "files" };
        producedOutput = true;

        convo.push({ role: "tool", tool_call_id: call.id, content: result.output });
      }

      if (failureCount > 6) {
        convo.push({
          role: "user",
          content:
            "Several tool calls failed. Stop retrying, summarise what works, what does not, and what you'd try next.",
        });
        failureCount = 0;
      }
    }
    yield {
      type: "delta",
      delta: "\n\n_Stopped after the maximum number of agent turns. Ask me to continue and I'll pick up where I left off._",
    };
  } catch (err) {
    const message = (err as Error).message;
    if (!producedOutput) {
      yield {
        type: "delta",
        delta: `_DeepSeek call failed (${message}). Falling back to the offline agent._\n\n`,
      };
      yield* runFallbackAgent(conversationId, prompt, "");
      return;
    }
    yield { type: "error", message };
  }
}

function describe(tool: string, args: Record<string, unknown>) {
  switch (tool) {
    case "file_write":
      return `Creating file: ${args.path ?? "?"}`;
    case "file_read":
      return `Reading file: ${args.path ?? "?"}`;
    case "file_edit":
      return `Editing file: ${args.path ?? "?"}`;
    case "list_files":
      return "Listing project files";
    case "run_command":
      return `Running: ${args.command ?? "?"}`;
    case "web_search":
      return `Searching: ${args.query ?? "?"}`;
    default:
      return `Calling ${tool}`;
  }
}
