"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileCode2, RefreshCw, Save, TerminalSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/store/chat";
import { cn, guessLanguage } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type Tab = "preview" | "code" | "terminal";

export function Workspace({ onClose, embedded = false }: { onClose: () => void; embedded?: boolean }) {
  const { files, preview, terminal, activeId, activeFile, setActiveFile, saveFile, refreshFiles } =
    useChat();
  const [tab, setTab] = useState<Tab>("preview");
  const [width, setWidth] = useState(520);
  const [draft, setDraft] = useState<{ path: string; content: string } | null>(null);
  const dragging = useRef(false);

  const file = files.find((f) => f.path === activeFile) ?? files[0] ?? null;
  // The draft is keyed by path, so switching files can never surface stale edits
  // (and no effect is needed to reset it).
  const editing = draft && file && draft.path === file.path ? draft.content : null;

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const next = Math.min(Math.max(window.innerWidth - e.clientX, 360), window.innerWidth - 420);
    setWidth(next);
  }, []);

  useEffect(() => {
    const stop = () => (dragging.current = false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [onPointerMove]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
    { id: "terminal", label: "Terminal" },
  ];

  return (
    <motion.aside
      initial={embedded ? false : { x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      style={embedded ? undefined : { width }}
      className={cn(
        "relative flex h-full min-w-0 flex-col border-l border-line bg-surface",
        embedded && "w-full border-l-0",
      )}
      aria-label="Workspace"
    >
      {!embedded && (
        <div
          onPointerDown={() => (dragging.current = true)}
          role="separator"
          aria-orientation="vertical"
          className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize bg-transparent transition hover:bg-accent/40"
        />
      )}

      <header className="flex items-center gap-1 border-b border-line px-3 py-2">
        <div className="flex items-center gap-0.5 rounded-xl bg-surface-2 p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium transition",
                tab === t.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => void refreshFiles()}
            aria-label="Refresh workspace"
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <Button
            size="sm"
            variant="outline"
            disabled={!files.length || !activeId}
            onClick={() => {
              window.location.href = `/api/projects/${activeId}/export`;
              toast("Preparing ZIP download");
            }}
          >
            <Download className="h-3.5 w-3.5" /> Export ZIP
          </Button>
          <button
            onClick={onClose}
            aria-label="Close workspace"
            className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {tab === "preview" && (
          preview ? (
            <iframe
              title="Project preview"
              srcDoc={preview}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="h-full w-full bg-white"
            />
          ) : (
            <Empty icon={FileCode2} text="Nothing to preview yet. Ask DeepThink to build something." />
          )
        )}

        {tab === "code" && (
          files.length === 0 ? (
            <Empty icon={FileCode2} text="No files in this project yet." />
          ) : (
            <div className="flex h-full min-h-0">
              <ul className="scrollbar-slim w-44 shrink-0 overflow-y-auto border-r border-line p-2">
                {files.map((f) => (
                  <li key={f.path}>
                    <button
                      onClick={() => setActiveFile(f.path)}
                      className={cn(
                        "w-full truncate rounded-lg px-2.5 py-1.5 text-left font-mono text-[11.5px] transition",
                        file?.path === f.path
                          ? "bg-surface-2 text-ink"
                          : "text-muted hover:bg-surface-2/60 hover:text-ink",
                      )}
                      title={f.path}
                    >
                      {f.path}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-line px-3 py-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    {file ? guessLanguage(file.path) : ""}
                  </span>
                  <span className="truncate font-mono text-[11.5px] text-muted">{file?.path}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    disabled={editing === null}
                    onClick={() => {
                      if (file && editing !== null) {
                        void saveFile(file.path, editing);
                        setDraft(null);
                        toast("File saved", { description: file.path });
                      }
                    }}
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
                <textarea
                  key={file?.path}
                  value={editing ?? file?.content ?? ""}
                  onChange={(e) => {
                    if (!file) return;
                    setDraft({ path: file.path, content: e.target.value });
                  }}
                  spellCheck={false}
                  aria-label={`Contents of ${file?.path ?? "file"}`}
                  className="scrollbar-slim min-h-0 flex-1 resize-none bg-code p-4 font-mono text-[12.5px] leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          )
        )}

        {tab === "terminal" && (
          <div className="scrollbar-slim h-full overflow-y-auto bg-code p-4 font-mono text-[12.5px] leading-relaxed">
            {terminal.length === 0 ? (
              <Empty icon={TerminalSquare} text="No commands have run in this session yet." />
            ) : (
              terminal.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    line.startsWith("$") ? "text-ink" : "text-muted",
                    line.includes("✗") && "text-amber-600 dark:text-amber-400",
                    line.includes("✓") && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-line px-3 py-1.5 text-[11.5px] text-muted">
        {files.length} file{files.length === 1 ? "" : "s"} · virtual file system · exports as ZIP
      </footer>
    </motion.aside>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof FileCode2; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted">
        <Icon className="h-5 w-5" />
      </span>
      <p className="max-w-[240px] text-[13.5px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}
