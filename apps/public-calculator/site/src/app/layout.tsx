import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Cost Calculator",
  description: "Objective cost comparison across AI models, APIs, and developer tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
