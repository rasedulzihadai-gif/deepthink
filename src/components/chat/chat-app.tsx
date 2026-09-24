"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PanelRightOpen, Sparkles } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Composer } from "./composer";
import { MessageItem } from "./message-item";
import { Workspace } from "./workspace";
import { Toaster } from "@/components/ui/toast";
import { Logo } from "@/components/logo";
import { useChat } from "@/store/chat";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Build a portfolio website with a projects grid",
  "Create a to-do app with localStorage",
  "Write a Python script to clean a CSV",
  "Explain event loops like I'm five",
];

export function ChatApp({
  user,
  initialConversationId,
}: {
  user: { name: string; email: string; plan: string };
  initialConversationId?: string;
}) {
  const {
    messages,
    messagesLoading,
    loadConversations,
    openConversation,
    send,
    retryLast,
    sidebarOpen,
    setSidebarOpen,
    workspaceOpen,
    setWorkspaceOpen,
    files,
    streaming,
  } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void loadConversations();
    if (initialConversationId) void openConversation(initialConversationId);
    if (window.innerWidth < 900) setSidebarOpen(false);
  }, [initialConversationId, loadConversations, openConversation, setSidebarOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  const empty = messages.length === 0 && !messagesLoading;

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* desktop sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="hidden overflow-hidden md:block"
          >
            <Sidebar user={user} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="h-full w-[260px] bg-canvas"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar user={user} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-line px-3 sm:px-5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
            className={cn(
              "rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink",
              sidebarOpen && "md:hidden",
            )}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <Logo size={22} />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">DeepThink</span>
          </div>
          <span className="ml-auto text-[12.5px] text-muted">
            {streaming ? "Agent working…" : "Tell it once, it finishes the job."}
          </span>
          {(files.length > 0 || workspaceOpen) && (
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              aria-label="Toggle workspace"
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-muted transition hover:text-ink"
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
              Workspace
              {files.length > 0 && (
                <span className="rounded-md bg-accent-soft px-1.5 text-[11px] text-accent">
                  {files.length}
                </span>
              )}
            </button>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="scrollbar-slim flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                {messagesLoading && (
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="dt-skeleton h-16 rounded-2xl" />
                    ))}
                  </div>
                )}

                {empty ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex min-h-[55vh] flex-col items-center justify-center text-center"
                  >
                    <Logo size={40} />
                    <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">
                      What should we build today?
                    </h1>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                      Describe the outcome once. DeepThink plans the steps, writes the files and
                      checks its own work.
                    </p>
                    <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => void send(ex)}
                          className="flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[13px] text-muted shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:text-ink"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                          {ex}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-7 pb-4">
                    {messages.map((m) => (
                      <MessageItem key={m.id} message={m} onRetry={() => void retryLast()} />
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
            <Composer />
          </div>

          {/* desktop workspace */}
          <AnimatePresence>
            {workspaceOpen && (
              <div className="hidden lg:block">
                <Workspace onClose={() => setWorkspaceOpen(false)} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* mobile workspace overlay */}
        <AnimatePresence>
          {workspaceOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 bg-canvas lg:hidden"
            >
              <Workspace embedded onClose={() => setWorkspaceOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster />
    </div>
  );
}
