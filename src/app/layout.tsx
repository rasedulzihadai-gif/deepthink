import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "DeepThink — Think deep. Build fast.",
  description:
    "DeepThink is an autonomous AI agent that plans, writes code, runs tools and ships working websites, apps and scripts from a single instruction. Powered by DeepSeek.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("deepthink-theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
