import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";

// Display — characterful grotesque (headings, wordmark, big figures)
const display = Bricolage_Grotesque({
  variable: "--ff-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});
// Body — neutral, legible
const body = Inter({ variable: "--ff-body", subsets: ["latin"] });
// Data/ledger — codes, RM amounts, dates
const mono = IBM_Plex_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
// Handwritten accent — wordmark + teacher's notes ONLY
const hand = Caveat({ variable: "--ff-hand", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "cikgurohani LMS",
  description: "Sistem LMS & Portal Ibu Bapa / Pelajar — cikgurohani.com",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ms"
      className={`${display.variable} ${body.variable} ${mono.variable} ${hand.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
