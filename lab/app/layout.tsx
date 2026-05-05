import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ru" className="font-sans">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
