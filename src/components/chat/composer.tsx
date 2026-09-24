"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, Loader2, Paperclip } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MODELS, type ModelId } from "@/lib/agent/events";
import { useChat } from "@/store/chat";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function Composer() {
  const { send, streaming, model, setModel } = useChat();
  const [value, setValue] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    setValue("");
    void send(text);
  };

  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl bg-surface p-2 shadow-[0_1px_2px_rgba(28,25,23,.05),0_18px_40px_-28px_rgba(28,25,23,.4)] ring-1 ring-line transition focus-within:ring-2 focus-within:ring-accent/60">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Describe what you want built…"
            aria-label="Message DeepThink"
            className="scrollbar-slim max-h-60 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed placeholder:text-muted/70 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 px-1 pb-0.5">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void file.text().then((text) => {
                  setValue(
                    (v) =>
                      `${v}\n\nAttached file \`${file.name}\`:\n\n\`\`\`\n${text.slice(0, 6000)}\n\`\`\``,
                  );
                  toast("File attached", { description: file.name });
                });
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Attach a file"
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setModelOpen((v) => !v)}
                aria-expanded={modelOpen}
                aria-label="Select model"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                {current.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {modelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    className="absolute bottom-11 left-0 z-30 w-60 overflow-hidden rounded-xl bg-surface p-1 shadow-[0_18px_44px_-18px_rgba(28,25,23,.5)] ring-1 ring-line"
                  >
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id as ModelId);
                          setModelOpen(false);
                        }}
                        className={cn(
                          "w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-surface-2",
                          m.id === model && "bg-surface-2",
                        )}
                      >
                        <p className="text-[13.5px] font-medium">{m.label}</p>
                        <p className="text-[11.5px] text-muted">{m.hint}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="ml-auto hidden pr-1 text-[11.5px] text-muted sm:block">
              <kbd className="font-sans">Enter</kbd> to send ·{" "}
              <kbd className="font-sans">Shift+Enter</kbd> for newline
            </span>

            <button
              onClick={submit}
              disabled={!value.trim() || streaming}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-ink transition hover:brightness-110 disabled:opacity-40"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11.5px] text-muted">
          DeepThink runs tools autonomously. Review generated code before shipping it.
        </p>
      </div>
    </div>
  );
}
