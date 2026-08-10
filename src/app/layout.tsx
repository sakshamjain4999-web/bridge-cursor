import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TransportAI — Intelligent Fleet & Transport Management",
  description:
    "Professional transport management SaaS platform for Indian logistics. Manage trips, fleet, drivers, expenses, and invoices with AI-powered insights.",
  keywords: [
    "transport management",
    "fleet management",
    "logistics",
    "Indian transport",
    "truck management",
    "trip management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}