"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const KEY = "deepthink-theme";

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(KEY, theme);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(((localStorage.getItem(KEY) as Theme) || "system") ?? "system");
  }, []);

  const set = (t: Theme) => {
    setTheme(t);
    applyTheme(t);
  };

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn("flex items-center gap-0.5 rounded-xl bg-surface-2 p-0.5", compact && "scale-95")}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={`${label} theme`}
          title={`${label} theme`}
          onClick={() => set(value)}
          className={cn(
            "rounded-[10px] p-1.5 text-muted transition",
            theme === value && "bg-surface text-ink shadow-sm",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
