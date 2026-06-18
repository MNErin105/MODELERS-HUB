import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AppProvider } from "@/lib/context/AppContext";
import { LocaleProvider } from "@/lib/context/LocaleContext";

// ─── Google Fonts ─────────────────────────────────────────────────────────

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// ─── Smooch Sans (Variable Font / local) ──────────────────────────────────
// Source : public/fonts/SmoochSans-VariableFont_wght.ttf
// CSS var: --font-smooch   (applied to the logo in Header.tsx only)
// Body / heading fonts are unchanged.

const smoochSans = localFont({
  src: "../public/fonts/SmoochSans-VariableFont_wght.ttf",
  variable: "--font-smooch",
  display: "swap",
  weight: "100 800",
});

// ─── Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Modelers Hub — Scale Model Archive",
  description: "A technical archive for scale modelers — Gunpla, dioramas, and more.",
};

// ─── Root Layout ──────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${smoochSans.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <LocaleProvider>
          <AppProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AppProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
