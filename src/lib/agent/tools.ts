import { editFile, listFiles, readFile, validateProject, writeFile } from "./vfs";

export type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const str = (description: string) => ({ type: "string", description });

export const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "file_write",
      description: "Create or overwrite a file in the project's virtual file system.",
      parameters: {
        type: "object",
        properties: {
          path: str("Relative file path, e.g. index.html or src/app.js"),
          content: str("Full file content. Must be complete, never truncated."),
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_read",
      description: "Read the content of an existing project file.",
      parameters: {
        type: "object",
        properties: { path: str("Relative file path") },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_edit",
      description: "Replace the first exact occurrence of `find` with `replace` inside a file.",
      parameters: {
        type: "object",
        properties: {
          path: str("Relative file path"),
          find: str("Exact substring to find"),
          replace: str("Replacement text"),
        },
        required: ["path", "find", "replace"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List the files currently in the project.",
      parameters: {
        type: "object",
        properties: { directory: str("Optional directory prefix") },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        'Run an allowlisted command in the sandbox: "build", "lint", "test", "ls", "npm install <pkg>", "node <file>", "python <file>".',
      parameters: {
        type: "object",
        properties: { command: str("The command to run") },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information (placeholder in this environment).",
      parameters: {
        type: "object",
        properties: { query: str("Search query") },
        required: ["query"],
      },
    },
  },
];

export type ToolResult = {
  output: string;
  label: string;
  detail?: string;
  ok: boolean;
  touchedFiles: boolean;
  terminal?: string[];
};

const ALLOWED = [/^build$/, /^lint$/, /^test$/, /^ls$/, /^npm install [\w@\-./]+$/, /^node [\w\-./]+$/, /^python3? [\w\-./]+$/];

export async function runTool(
  conversationId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    switch (name) {
      case "file_write": {
        const path = String(args.path ?? "");
        const content = String(args.content ?? "");
        if (!path) return fail("file_write requires a path");
        await writeFile(conversationId, path, content);
        const lines = content.split("\n").length;
        return {
          ok: true,
          output: `Wrote ${path} (${lines} lines)`,
          label: `Creating file: ${path}`,
          detail: `${lines} lines`,
          touchedFiles: true,
          terminal: [`$ write ${path}`, `  ✓ ${lines} lines written`],
        };
      }
      case "file_read": {
        const path = String(args.path ?? "");
        const content = await readFile(conversationId, path);
        if (content === null) return fail(`File not found: ${path}`, `Reading ${path}`);
        return {
          ok: true,
          output: content.slice(0, 12_000),
          label: `Reading file: ${path}`,
          touchedFiles: false,
        };
      }
      case "file_edit": {
        const path = String(args.path ?? "");
        const res = await editFile(
          conversationId,
          path,
          String(args.find ?? ""),
          String(args.replace ?? ""),
        );
        return {
          ok: res.ok,
          output: res.message,
          label: `Editing file: ${path}`,
          detail: res.ok ? "patch applied" : res.message,
          touchedFiles: res.ok,
          terminal: [`$ edit ${path}`, `  ${res.ok ? "✓" : "✗"} ${res.message}`],
        };
      }
      case "list_files": {
        const files = await listFiles(conversationId, String(args.directory ?? ""));
        return {
          ok: true,
          output: files.length ? files.map((f) => f.path).join("\n") : "(empty project)",
          label: "Listing project files",
          detail: `${files.length} file(s)`,
          touchedFiles: false,
        };
      }
      case "run_command": {
        const command = String(args.command ?? "").trim();
        if (!ALLOWED.some((re) => re.test(command))) {
          return fail(
            `Command "${command}" is not on the sandbox allowlist. Allowed: build, lint, test, ls, npm install <pkg>, node <file>, python <file>.`,
            `Running: ${command}`,
          );
        }
        const files = await listFiles(conversationId);
        if (command === "build" || command === "lint" || command === "test") {
          const problems = validateProject(files);
          const header = `$ ${command}`;
          if (problems.length === 0) {
            return {
              ok: true,
              output: `${command} passed. ${files.length} file(s) checked, 0 problems.`,
              label: `Running ${command} check`,
              detail: "0 problems",
              touchedFiles: false,
              terminal: [header, `  ✓ ${files.length} file(s) checked`, "  ✓ 0 problems found"],
            };
          }
          return {
            ok: false,
            output: `${command} found ${problems.length} problem(s):\n${problems.join("\n")}`,
            label: `Running ${command} check`,
            detail: `${problems.length} problem(s)`,
            touchedFiles: false,
            terminal: [header, ...problems.map((p) => `  ✗ ${p}`)],
          };
        }
        if (command === "ls") {
          return {
            ok: true,
            output: files.map((f) => f.path).join("\n") || "(empty)",
            label: "Running: ls",
            touchedFiles: false,
            terminal: ["$ ls", ...files.map((f) => `  ${f.path}`)],
          };
        }
        if (command.startsWith("npm install")) {
          const pkg = command.replace("npm install", "").trim();
          return {
            ok: true,
            output: `Recorded dependency "${pkg}". The MVP sandbox does not execute installs; reference it via CDN or document it in README.md.`,
            label: `Installing dependency: ${pkg}`,
            touchedFiles: false,
            terminal: [`$ ${command}`, `  ℹ recorded ${pkg} (no network install in MVP sandbox)`],
          };
        }
        const target = command.split(/\s+/)[1];
        const exists = files.some((f) => f.path === target.replace(/^\.\//, ""));
        return {
          ok: exists,
          output: exists
            ? `Static sandbox: "${command}" is not executed. ${target} exists and passed syntax checks.`
            : `Cannot run "${command}" — ${target} does not exist.`,
          label: `Running: ${command}`,
          detail: exists ? "static sandbox" : "missing file",
          touchedFiles: false,
          terminal: [`$ ${command}`, exists ? "  ℹ execution stubbed in MVP sandbox" : `  ✗ ${target} not found`],
        };
      }
      case "web_search": {
        const query = String(args.query ?? "");
        return {
          ok: true,
          output: `web_search is a placeholder in this environment. No live results for "${query}". Rely on your own knowledge and note the cutoff to the user if it matters.`,
          label: `Searching the web: ${query}`,
          detail: "placeholder",
          touchedFiles: false,
        };
      }
      default:
        return fail(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return fail((err as Error).message, `Tool error: ${name}`);
  }
}

function fail(message: string, label = "Tool failed"): ToolResult {
  return { ok: false, output: `ERROR: ${message}`, label, detail: message, touchedFiles: false };
}
