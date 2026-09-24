"use client";

import { create } from "zustand";
import type { AgentEvent, ModelId, TraceStep } from "@/lib/agent/events";
import { toast } from "@/components/ui/toast";

export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  trace?: TraceStep[];
  model?: string;
  streaming?: boolean;
  failed?: boolean;
};

export type ConversationSummary = {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
};

export type VFile = { path: string; content: string };

type ChatState = {
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  activeId: string | null;
  messages: UIMessage[];
  messagesLoading: boolean;
  streaming: boolean;
  model: ModelId;
  files: VFile[];
  preview: string | null;
  terminal: string[];
  workspaceOpen: boolean;
  sidebarOpen: boolean;
  activeFile: string | null;

  setModel: (m: ModelId) => void;
  setWorkspaceOpen: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  setActiveFile: (p: string | null) => void;
  loadConversations: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  newChat: () => void;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshFiles: (id?: string) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<void>;
  send: (content: string) => Promise<void>;
  retryLast: () => Promise<void>;
};

const uid = () => Math.random().toString(36).slice(2);

export const useChat = create<ChatState>((set, get) => ({
  conversations: [],
  conversationsLoading: true,
  activeId: null,
  messages: [],
  messagesLoading: false,
  streaming: false,
  model: "deepseek-chat",
  files: [],
  preview: null,
  terminal: [],
  workspaceOpen: false,
  sidebarOpen: true,
  activeFile: null,

  setModel: (model) => set({ model }),
  setWorkspaceOpen: (workspaceOpen) => set({ workspaceOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveFile: (activeFile) => set({ activeFile }),

  async loadConversations() {
    set({ conversationsLoading: true });
    try {
      const res = await fetch("/api/conversations");
      const data = (await res.json()) as { conversations?: ConversationSummary[] };
      set({ conversations: data.conversations ?? [], conversationsLoading: false });
    } catch {
      set({ conversationsLoading: false });
      toast("Couldn't load chat history", { variant: "error" });
    }
  },

  async openConversation(id) {
    set({ activeId: id, messagesLoading: true, messages: [], terminal: [], files: [], preview: null });
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("not found");
      const data = (await res.json()) as {
        conversation: ConversationSummary;
        messages: {
          id: string;
          role: string;
          content: string;
          reasoning: string | null;
          trace: TraceStep[] | null;
          model: string | null;
        }[];
      };
      set({
        messages: data.messages.map((m) => ({
          id: m.id,
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
          reasoning: m.reasoning ?? undefined,
          trace: m.trace ?? undefined,
          model: m.model ?? undefined,
        })),
        model: (data.conversation.model as ModelId) ?? "deepseek-chat",
        messagesLoading: false,
      });
      window.history.replaceState(null, "", `/chat/${id}`);
      await get().refreshFiles(id);
    } catch {
      set({ messagesLoading: false });
      toast("Couldn't open that conversation", { variant: "error" });
    }
  },

  newChat() {
    set({
      activeId: null,
      messages: [],
      files: [],
      preview: null,
      terminal: [],
      workspaceOpen: false,
      activeFile: null,
    });
    window.history.replaceState(null, "", "/chat");
  },

  async renameConversation(id, title) {
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  },

  async deleteConversation(id) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) }));
    if (get().activeId === id) get().newChat();
    toast("Conversation deleted");
  },

  async refreshFiles(id) {
    const cid = id ?? get().activeId;
    if (!cid) return;
    try {
      const res = await fetch(`/api/projects/${cid}/files`);
      if (!res.ok) return;
      const data = (await res.json()) as { files: VFile[]; preview: string | null };
      set((s) => ({
        files: data.files,
        preview: data.preview,
        activeFile: s.activeFile && data.files.some((f) => f.path === s.activeFile)
          ? s.activeFile
          : data.files[0]?.path ?? null,
      }));
    } catch {
      /* ignore */
    }
  },

  async saveFile(path, content) {
    const cid = get().activeId;
    if (!cid) return;
    set((s) => ({ files: s.files.map((f) => (f.path === path ? { ...f, content } : f)) }));
    const res = await fetch(`/api/projects/${cid}/files`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    if (res.ok) {
      const data = (await res.json()) as { files: VFile[]; preview: string | null };
      set({ files: data.files, preview: data.preview });
    } else {
      toast("Couldn't save file", { variant: "error" });
    }
  },

  async send(content) {
    const trimmed = content.trim();
    if (!trimmed || get().streaming) return;

    const userMsg: UIMessage = { id: uid(), role: "user", content: trimmed };
    const assistantId = uid();
    set((s) => ({
      messages: [
        ...s.messages,
        userMsg,
        { id: assistantId, role: "assistant", content: "", streaming: true, model: s.model },
      ],
      streaming: true,
    }));

    const patch = (fn: (m: UIMessage) => UIMessage) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === assistantId ? fn(m) : m)) }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: get().activeId,
          content: trimmed,
          model: get().model,
        }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          let event: AgentEvent;
          try {
            event = JSON.parse(line.slice(5).trim()) as AgentEvent;
          } catch {
            continue;
          }
          switch (event.type) {
            case "meta": {
              if (!get().activeId) {
                set({ activeId: event.conversationId });
                window.history.replaceState(null, "", `/chat/${event.conversationId}`);
                void get().loadConversations();
              }
              break;
            }
            case "title": {
              const id = get().activeId;
              set((s) => ({
                conversations: s.conversations.map((c) =>
                  c.id === id ? { ...c, title: event.title } : c,
                ),
              }));
              void get().loadConversations();
              break;
            }
            case "delta":
              patch((m) => ({ ...m, content: m.content + event.delta }));
              break;
            case "reasoning":
              patch((m) => ({ ...m, reasoning: (m.reasoning ?? "") + event.delta }));
              break;
            case "trace":
              patch((m) => {
                const trace = [...(m.trace ?? [])];
                const idx = trace.findIndex((t) => t.id === event.step.id);
                if (idx >= 0) trace[idx] = event.step;
                else trace.push(event.step);
                return { ...m, trace };
              });
              break;
            case "terminal":
              set((s) => ({ terminal: [...s.terminal, ...event.lines] }));
              break;
            case "files":
              set({ workspaceOpen: true });
              void get().refreshFiles();
              break;
            case "error":
              toast("Agent error", { description: event.message, variant: "error" });
              patch((m) => ({ ...m, failed: true }));
              break;
            case "done":
              break;
          }
        }
      }
      patch((m) => ({ ...m, streaming: false }));
      set({ streaming: false });
      void get().refreshFiles();
      void get().loadConversations();
    } catch (err) {
      patch((m) => ({
        ...m,
        streaming: false,
        failed: true,
        content: m.content || `Request failed: ${(err as Error).message}`,
      }));
      set({ streaming: false });
      toast("Message failed", { description: (err as Error).message, variant: "error" });
    }
  },

  async retryLast() {
    const msgs = get().messages;
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const lastIdx = msgs.findIndex((m) => m.id === lastUser.id);
    set({ messages: msgs.slice(0, lastIdx) });
    await get().send(lastUser.content);
  },
}));
