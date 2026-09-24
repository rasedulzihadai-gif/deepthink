"use client";

import { motion } from "framer-motion";
import { Check, FileCode2, Loader2, Terminal } from "lucide-react";

const steps = [
  { label: "Planning approach", done: true },
  { label: "Creating file: index.html", done: true },
  { label: "Creating file: styles.css", done: true },
  { label: "Running build check", done: false },
];

export function ProductMockup() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-16 -bottom-10 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft),transparent_70%)]"
      />
      <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_2px_4px_rgba(28,25,23,.04),0_40px_80px_-32px_rgba(28,25,23,.35)] ring-1 ring-line">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5695b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f6bd50]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#61c454]" />
          <div className="mx-auto hidden rounded-md bg-surface-2 px-24 py-1 text-[11px] text-muted sm:block">
            deepthink.app/chat
          </div>
        </div>

        <div className="grid h-[380px] grid-cols-1 text-[12px] sm:h-[420px] sm:grid-cols-[150px_1fr] lg:grid-cols-[170px_1.15fr_1fr]">
          {/* sidebar */}
          <aside className="hidden flex-col gap-2 border-r border-line bg-surface-2/60 p-3 sm:flex">
            <div className="rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-medium text-accent-ink">
              + New chat
            </div>
            <p className="px-1 pt-2 text-[10px] uppercase tracking-wider text-muted">Today</p>
            {["Portfolio website", "CSV analysis script", "Pricing page redesign"].map((t, i) => (
              <div
                key={t}
                className={`truncate rounded-lg px-2.5 py-1.5 text-[11px] ${i === 0 ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
              >
                {t}
              </div>
            ))}
          </aside>

          {/* chat */}
          <section className="flex flex-col gap-3 overflow-hidden p-4">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-surface-2 px-3 py-2 text-[11.5px]">
              Build me a portfolio website with a projects grid
            </div>
            <div className="space-y-2">
              <div className="rounded-xl bg-surface-2/70 p-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium text-muted">
                  <Terminal className="h-3 w-3" /> Working · 4 steps
                </p>
                <ul className="space-y-1.5">
                  {steps.map((s, i) => (
                    <motion.li
                      key={s.label}
                      initial={{ opacity: 0, x: -6 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.18 }}
                      className="flex items-center gap-2 text-[11px] text-ink/80"
                    >
                      {s.done ? (
                        <Check className="h-3 w-3 text-accent" />
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      )}
                      {s.label}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <p className="text-[11.5px] leading-relaxed text-ink/85">
                Here&apos;s the plan: scaffold the markup, add a responsive grid, then wire the
                filter interactions
                <span className="dt-caret" />
              </p>
            </div>
          </section>

          {/* workspace */}
          <section className="hidden flex-col border-l border-line lg:flex">
            <div className="flex items-center gap-1 border-b border-line px-3 py-2 text-[11px]">
              <span className="rounded-md bg-surface-2 px-2 py-1 font-medium">Preview</span>
              <span className="px-2 py-1 text-muted">Code</span>
              <span className="px-2 py-1 text-muted">Terminal</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted">
                <FileCode2 className="h-3 w-3" /> 4 files
              </span>
            </div>
            <div className="flex-1 space-y-3 bg-canvas p-4">
              <div className="h-3 w-24 rounded bg-line" />
              <div className="h-8 w-44 rounded-lg bg-accent/25" />
              <div className="h-2.5 w-full rounded bg-line" />
              <div className="h-2.5 w-4/5 rounded bg-line" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="h-14 rounded-xl bg-surface shadow-sm ring-1 ring-line"
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
