"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileCode2,
  Hammer,
  ListChecks,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import type { TraceStep } from "@/lib/agent/events";
import { cn } from "@/lib/utils";

const icons = {
  plan: ListChecks,
  tool: FileCode2,
  validate: Hammer,
  fix: Wrench,
  done: Check,
  error: AlertTriangle,
} as const;

export function WorkingTrace({ steps, live }: { steps: TraceStep[]; live: boolean }) {
  const [open, setOpen] = useState(true);
  const running = steps.some((s) => s.status === "running") && live;
  const errors = steps.filter((s) => s.status === "error").length;

  return (
    <div className="mb-3 overflow-hidden rounded-xl bg-surface-2/70 ring-1 ring-line">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-muted transition hover:text-ink"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        ) : errors ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Check className="h-3.5 w-3.5 text-accent" />
        )}
        <span>{running ? "Working…" : "Working trace"}</span>
        <span className="ml-auto font-normal">
          {steps.length} step{steps.length === 1 ? "" : "s"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-1.5 px-3 pb-3"
          >
            {steps.map((step) => {
              const Icon = icons[step.kind] ?? FileCode2;
              return (
                <motion.li
                  key={step.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                >
                  <span className="mt-0.5">
                    {step.status === "running" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    ) : step.status === "error" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    ) : step.kind === "validate" || step.kind === "plan" ? (
                      <Icon className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn(step.status === "error" ? "text-amber-600 dark:text-amber-400" : "text-ink/85")}>
                      {step.label}
                    </span>
                    {step.detail && (
                      <span className="ml-2 font-mono text-[11.5px] text-muted">{step.detail}</span>
                    )}
                  </span>
                </motion.li>
              );
            })}
            {steps.length === 0 && (
              <li className="flex items-center gap-2 text-[13px] text-muted">
                <Search className="h-3.5 w-3.5" /> Thinking about the approach…
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
