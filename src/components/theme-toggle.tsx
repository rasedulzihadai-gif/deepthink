"use client";

import { useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark" | "system";
const KEY = "deepthink-theme";

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(KEY, theme);
}

/** The stored theme is external state (localStorage), so subscribe to it instead of copying it into state in an effect. */
function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredTheme(): Theme {
  const value = localStorage.getItem(KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function getServerTheme(): Theme {
  return "system";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const stored = useSyncExternalStore(subscribeToStorage, getStoredTheme, getServerTheme);
  // A click in this tab wins over the stored value until the store catches up.
  const [pending, setPending] = useState<Theme | null>(null);
  const theme = pending ?? stored;

  const set = (t: Theme) => {
    setPending(t);
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
