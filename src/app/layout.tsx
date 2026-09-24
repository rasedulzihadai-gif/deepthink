import type { Metadata } from "next";
import type { ReactNode } from "react";
// Self-hosted variable Inter (woff2 from node_modules). Unlike next/font/google this
// needs no network access at build time, so `next build` works offline / in CI.
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepThink — Think deep. Build fast.",
  description:
    "DeepThink is an autonomous AI agent that plans, writes code, runs tools and ships working websites, apps and scripts from a single instruction. Powered by DeepSeek.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("deepthink-theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
