import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "glorb.wtf - digital goblin portfolio",
  description: "tired goblin building things in the digital mines",
  themeColor: "#0a0e14",
  viewport: "width=device-width, initial-scale=1",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-terminal-bg text-terminal-text">{children}</body>
    </html>
  );
}
