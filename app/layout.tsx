import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import "./tool-ui.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-ui",
  fallback: ["Segoe UI", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "desengine",
  description: "Лаборатория задач и уровней для генерации React-компонентов по PNG-референсам.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
