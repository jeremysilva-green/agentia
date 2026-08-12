import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { copy } from "@/lib/copy";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const clashDisplay = localFont({
  src: "../../font/ClashDisplay-Semibold.otf",
  variable: "--font-display",
  display: "swap",
});

const clashDisplayLight = localFont({
  src: "../../font/ClashDisplay-Regular.otf",
  variable: "--font-display-light",
  display: "swap",
});

const rubik = localFont({
  src: "../../font/Rubik-Medium.ttf",
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${copy.brand} — Plataforma para agentes inmobiliarios`,
  description: copy.home.subtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${clashDisplay.variable} ${clashDisplayLight.variable} ${rubik.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-white font-sans text-slate-900">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
