import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navigation } from "@/components/desengine/system/Navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import "./tool-ui.css";

const inter = localFont({
  src: [
    {
      path: "./fonts/InterVariable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/InterVariable-Italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
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
        <TooltipProvider>
          <div className="min-h-screen">
            <Navigation />
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
