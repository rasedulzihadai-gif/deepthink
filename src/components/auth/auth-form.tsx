"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"form" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function post(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("form");
    try {
      await post(mode === "login" ? "/api/auth/login" : "/api/auth/signup", form);
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  }

  async function demo() {
    setError(null);
    setLoading("demo");
    try {
      await post("/api/auth/demo");
      router.push("/chat");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  }

  const input =
    "h-11 w-full rounded-xl bg-canvas px-3.5 text-[15px] ring-1 ring-line transition placeholder:text-muted/70 focus:ring-2 focus:ring-accent focus:outline-none";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px]"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo size={30} />
          <span className="text-[19px] font-semibold tracking-[-0.02em]">DeepThink</span>
        </Link>

        <div className="rounded-2xl bg-surface p-7 shadow-[0_1px_2px_rgba(28,25,23,.05),0_30px_60px_-36px_rgba(28,25,23,.45)] ring-1 ring-line">
          <h1 className="text-[21px] font-semibold tracking-[-0.02em]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            {mode === "login" ? "Log in to keep building." : "Start building in under a minute."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium" htmlFor="name">Name</label>
                <input
                  id="name"
                  className={input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={input}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading !== null}>
              {loading === "form" && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[12px] text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={demo} disabled={loading !== null}>
            {loading === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
            Continue with demo account
          </Button>

          <p className="mt-6 text-center text-[13.5px] text-muted">
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link className="font-medium text-accent hover:underline" href="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link className="font-medium text-accent hover:underline" href="/login">Log in</Link>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-muted">
          Sessions are cookie-based and stored in Postgres. Google OAuth can be added by dropping a
          provider into the same session layer.
        </p>
      </motion.div>
    </div>
  );
}
