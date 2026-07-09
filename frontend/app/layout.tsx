import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ToastProvider from "./_components/ToastProvider";
import CardMorphProvider from "./_components/CardMorph";
import ParticleBackground from "./_components/ParticleBackground";
import CursorFollower from "./_components/CursorFollower";
import ButtonRipple from "./_components/ButtonRipple";

/* Type pairing — "Scouting Report" direction. Self-hosted (no external <link>):
     --font-grotesk  Clash Display  (display headings, with personality)
     --font-sans     General Sans   (body, replaces Inter)
     --font-mono     Space Mono     (eyebrows / data labels — kept from the DNA) */
const display = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/SpaceMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/SpaceMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Job Fit",
  description: "Match your resume to live job listings and see exactly where you fit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <ParticleBackground />
        <CardMorphProvider>
          <ToastProvider>{children}</ToastProvider>
        </CardMorphProvider>
        <CursorFollower />
        <ButtonRipple />
      </body>
    </html>
  );
}
