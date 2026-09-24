import { cn } from "@/lib/utils";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 22.5V9.5h5.2c4 0 6.6 2.5 6.6 6.5s-2.6 6.5-6.6 6.5H9Z"
        fill="var(--accent-ink)"
        fillOpacity="0.95"
      />
      <circle cx="22.5" cy="11" r="2.1" fill="var(--accent-ink)" fillOpacity="0.55" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">DeepThink</span>
    </span>
  );
}
