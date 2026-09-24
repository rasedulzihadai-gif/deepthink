"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Check, ChevronRight, Copy, RefreshCw } from "lucide-react";
import { Markdown } from "./markdown";
import { WorkingTrace } from "./working-trace";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "@/store/chat";
import { cn } from "@/lib/utils";

export function MessageItem({ message, onRetry }: { message: UIMessage; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-[15px] leading-relaxed">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex gap-3"
    >
      <div className="mt-0.5 shrink-0">
        <Logo size={26} />
      </div>
      <div className="min-w-0 flex-1">
        {message.reasoning && (
          <div className="mb-3 overflow-hidden rounded-xl bg-surface-2/60 ring-1 ring-line">
            <button
              onClick={() => setShowReasoning((v) => !v)}
              aria-expanded={showReasoning}
              className="flex w-full items-center gap-2 px-3 py-2 text-[12.5px] font-medium text-muted transition hover:text-ink"
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", showReasoning && "rotate-90")} />
              <Brain className="h-3.5 w-3.5 text-accent" /> Chain of thought
            </button>
            {showReasoning && (
              <p className="whitespace-pre-wrap px-3 pb-3 text-[13px] leading-relaxed text-muted">
                {message.reasoning}
              </p>
            )}
          </div>
        )}

        {message.trace && message.trace.length > 0 && (
          <WorkingTrace steps={message.trace} live={Boolean(message.streaming)} />
        )}

        {message.content ? (
          <div className="relative">
            <Markdown content={message.content} />
            {message.streaming && <span className="dt-caret" aria-hidden />}
          </div>
        ) : message.streaming ? (
          <div className="flex items-center gap-2 py-1 text-[14px] text-muted">
            <span className="dt-caret" aria-hidden /> Thinking…
          </div>
        ) : null}

        {message.failed && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-red-500/8 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            Something went wrong generating this reply.
            <Button size="sm" variant="outline" onClick={onRetry} className="ml-auto">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}

        {!message.streaming && message.content && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={copy}
              aria-label="Copy reply"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onRetry}
              aria-label="Regenerate reply"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
            {message.model && (
              <span className="ml-1 font-mono text-[11px] text-muted/80">{message.model}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
