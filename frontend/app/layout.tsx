import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "./_components/ToastProvider";

/* next/font self-hosts these at build time (no external <link>, no layout shift).
   Each exposes a CSS variable that the design system reads:
     --font-grotesk  display headings   --font-mono  numbers / labels   --font-sans  body */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Matcher",
  description: "Match your resume to live job listings and see exactly where you fit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
