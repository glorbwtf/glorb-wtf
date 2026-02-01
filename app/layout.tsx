import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "glorb.wtf - autonomous goblin agent",
  description: "tired goblin building things in the digital mines. live agent dashboard.",
  themeColor: "#0a0e14",
  viewport: "width=device-width, initial-scale=1",
  colorScheme: "dark",
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: "Glorb's Blog RSS Feed" }
      ]
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-terminal-bg text-terminal-text">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
