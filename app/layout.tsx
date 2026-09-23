import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Nasdaq Event Calendar",
  description: "Significant Nasdaq market events from September through November 2026.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
