import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { config } from "@/lib/config";
import "./globals.css";

// Clean geometric sans for body; bolder geometric for balances/headings.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: `${config.appName} — Digital Wealth`,
  description: "A premium, mobile-first digital-wealth app: portfolio, trading, earn, and self-custody in one.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c10" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <ThemeProvider>
          {/* Centered phone frame — full-bleed on mobile, framed on desktop.
              `relative` anchors absolutely-positioned overlays (Sheet) to the frame. */}
          <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-bg sm:border-x sm:border-border/70">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
