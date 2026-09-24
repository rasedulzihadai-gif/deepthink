"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, Cpu, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProductMockup } from "./product-mockup";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className={`mx-auto w-full max-w-6xl px-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}

const features = [
  {
    icon: Workflow,
    title: "Agentic workflows",
    body: "One instruction in. DeepThink writes the plan, calls its tools, checks its own work and self-corrects until the task is done.",
  },
  {
    icon: Boxes,
    title: "Websites & apps instantly",
    body: "Real files, not snippets. Watch them appear in the workspace, preview them live, and export the whole project as a ZIP.",
  },
  {
    icon: Cpu,
    title: "Powered by DeepSeek",
    body: "Switch between DeepSeek Chat for speed and DeepSeek Reasoner when the problem needs visible chain-of-thought.",
  },
];

const steps = [
  { n: "01", title: "Describe", body: "Say what you want in one sentence. No specs, no ticket, no hand-holding." },
  { n: "02", title: "Agent plans & builds", body: "It drafts a plan, writes files, runs build checks and fixes its own errors." },
  { n: "03", title: "Review & ship", body: "Preview the result, read every file, export the ZIP or ask for the next change." },
];

export function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="text-[16px] font-semibold tracking-[-0.02em]">DeepThink</span>
          </Link>
          <div className="mx-auto hidden items-center gap-7 text-sm text-muted md:flex">
            <a className="transition hover:text-ink" href="#features">Features</a>
            <a className="transition hover:text-ink" href="#how">How it works</a>
            <a className="transition hover:text-ink" href="#faq">FAQ</a>
          </div>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden sm:block">
              <ThemeToggle compact />
            </div>
            {signedIn ? (
              <Button asChild size="sm">
                <Link href="/chat">Open DeepThink</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Start Building</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* hero */}
      <Section className="pt-20 pb-14 sm:pt-28 md:pb-20">
        <motion.p
          variants={fade}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-medium text-accent"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Think deep. Build fast.
        </motion.p>
        <motion.h1
          variants={fade}
          className="max-w-3xl text-[clamp(2.4rem,6vw,4.1rem)] font-semibold leading-[1.04] tracking-[-0.035em]"
        >
          Your AI agent that thinks, then builds.
        </motion.h1>
        <motion.p variants={fade} className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
          Tell DeepThink once what you need. It plans the steps, writes the code, runs the checks
          and hands you a finished, working project.
        </motion.p>
        <motion.div variants={fade} className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={signedIn ? "/chat" : "/signup"}>
              Start Building Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how">See how it works</a>
          </Button>
        </motion.div>
        <motion.p variants={fade} className="mt-4 text-[13px] text-muted">
          No credit card. Try the agent in one click from the login page.
        </motion.p>
      </Section>

      <Section className="pb-24">
        <motion.div variants={fade}>
          <ProductMockup />
        </motion.div>
      </Section>

      {/* features */}
      <Section id="features" className="py-8 md:py-16">
        <motion.h2 variants={fade} className="text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold tracking-[-0.03em]">
          Not a chatbot. A builder.
        </motion.h2>
        <motion.p variants={fade} className="mt-3 max-w-lg text-muted">
          Every answer can become a real project — files, preview, terminal log and all.
        </motion.p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={fade}
              className="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(28,25,23,.05),0_18px_40px_-28px_rgba(28,25,23,.35)] ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(28,25,23,.05),0_26px_50px_-28px_rgba(28,25,23,.45)]"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="text-[16.5px] font-semibold tracking-[-0.01em]">{f.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* how it works */}
      <Section id="how" className="py-20 md:py-28">
        <motion.h2 variants={fade} className="text-[clamp(1.7rem,3.2vw,2.4rem)] font-semibold tracking-[-0.03em]">
          Three steps. One instruction.
        </motion.h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <motion.div key={s.n} variants={fade} className="border-t border-line pt-5">
              <span className="font-mono text-[13px] text-accent">{s.n}</span>
              <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* faq */}
      <Section id="faq" className="pb-24">
        <div className="rounded-2xl bg-surface p-8 shadow-[0_1px_2px_rgba(28,25,23,.05)] ring-1 ring-line md:p-12">
          <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.03em]">
            Questions, answered
          </h2>
          <dl className="mt-8 grid gap-8 md:grid-cols-2">
            {[
              {
                q: "What can it actually build?",
                a: "Static sites, landing pages, small interactive apps, scripts, docs and data write-ups. Everything lands in a virtual file system you can preview and export.",
              },
              {
                q: "Does it run code?",
                a: "The MVP sandbox generates files and validates them with static build/lint checks, then previews HTML/CSS/JS live in an iframe. Real execution sandboxes are next.",
              },
              {
                q: "Which model runs it?",
                a: "DeepSeek, over the OpenAI-compatible API, with streaming and function calling. Pick Chat for speed or Reasoner for deeper planning.",
              },
              {
                q: "Do I need an API key?",
                a: "Add DEEPSEEK_API_KEY for the real model. Without it, DeepThink runs a built-in offline agent so you can still see the full plan → build → validate loop.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-[15px] font-semibold">{item.q}</dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={signedIn ? "/chat" : "/signup"}>
                Start Building Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-[13px] text-muted">Tell it once, it finishes the job.</span>
          </div>
        </div>
      </Section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-[13px] text-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5 text-ink">
            <Logo size={22} />
            <span className="font-semibold tracking-[-0.02em]">DeepThink</span>
          </div>
          <div className="flex flex-wrap gap-5 sm:ml-auto">
            <a className="transition hover:text-ink" href="#features">Features</a>
            <a className="transition hover:text-ink" href="#how">How it works</a>
            <Link className="transition hover:text-ink" href="/login">Log in</Link>
            <a className="transition hover:text-ink" href="#faq">Privacy</a>
            <a className="transition hover:text-ink" href="#faq">Terms</a>
          </div>
          <p className="sm:ml-6">© {new Date().getFullYear()} DeepThink</p>
        </div>
      </footer>
    </div>
  );
}
