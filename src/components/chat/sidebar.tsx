"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LogOut, MoreHorizontal, PanelLeftClose, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "@/store/chat";
import { cn, groupLabel } from "@/lib/utils";

const ORDER = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"];

export function Sidebar({ user }: { user: { name: string; email: string; plan: string } }) {
  const {
    conversations,
    conversationsLoading,
    activeId,
    openConversation,
    newChat,
    renameConversation,
    deleteConversation,
    setSidebarOpen,
  } = useChat();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, typeof conversations>();
    for (const c of conversations) {
      const key = groupLabel(c.updatedAt);
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return ORDER.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [conversations]);

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col border-r border-line bg-surface-2/50">
      <div className="flex items-center gap-2 px-3 pt-3">
        <Logo size={24} />
        <span className="text-[15px] font-semibold tracking-[-0.02em]">DeepThink</span>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Collapse sidebar"
          className="ml-auto rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <Button onClick={newChat} variant="outline" className="w-full justify-start" size="md">
          <Plus className="h-4 w-4 text-accent" /> New chat
        </Button>
      </div>

      <nav className="scrollbar-slim flex-1 overflow-y-auto px-2 pb-2" aria-label="Chat history">
        {conversationsLoading ? (
          <div className="space-y-2 px-1 pt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="dt-skeleton h-8 rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 pt-4 text-[13px] leading-relaxed text-muted">
            No conversations yet. Start with something like &ldquo;build me a landing page&rdquo;.
          </p>
        ) : (
          groups.map(([label, items]) => (
            <div key={label} className="mb-3">
              <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted/80">
                {label}
              </p>
              <ul className="space-y-0.5">
                {items.map((c) => (
                  <li key={c.id} className="group relative">
                    {editing === c.id ? (
                      <div className="flex items-center gap-1 px-1.5 py-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              void renameConversation(c.id, draft.trim() || c.title);
                              setEditing(null);
                            }
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="h-8 min-w-0 flex-1 rounded-lg bg-surface px-2 text-[13.5px] ring-1 ring-accent focus:outline-none"
                          aria-label="Rename conversation"
                        />
                        <button
                          onClick={() => {
                            void renameConversation(c.id, draft.trim() || c.title);
                            setEditing(null);
                          }}
                          className="rounded-md p-1 text-accent"
                          aria-label="Save title"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-md p-1 text-muted"
                          aria-label="Cancel rename"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => void openConversation(c.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] transition",
                          activeId === c.id
                            ? "bg-surface text-ink shadow-sm"
                            : "text-muted hover:bg-surface/70 hover:text-ink",
                        )}
                      >
                        <span className="truncate">{c.title}</span>
                      </button>
                    )}

                    {editing !== c.id && (
                      <button
                        onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                        aria-label="Conversation options"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted opacity-0 transition hover:bg-surface-2 hover:text-ink group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <AnimatePresence>
                      {menuFor === c.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="absolute right-1 top-9 z-20 w-36 overflow-hidden rounded-xl bg-surface p-1 shadow-[0_10px_30px_-12px_rgba(28,25,23,.5)] ring-1 ring-line"
                        >
                          <button
                            onClick={() => {
                              setDraft(c.title);
                              setEditing(c.id);
                              setMenuFor(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-surface-2"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              void deleteConversation(c.id);
                              setMenuFor(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-ink">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium">{user.name}</p>
            <p className="truncate text-[11.5px] text-muted">{user.plan} plan · unlimited chats</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
            aria-label="Log out"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-muted">Theme</span>
          <ThemeToggle compact />
        </div>
      </div>
    </div>
  );
}
