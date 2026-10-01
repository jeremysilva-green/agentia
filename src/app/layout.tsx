import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { OnboardingTour } from "@/components/OnboardingTour";

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
  title: "AGENTIA | Portal Inmobiliario Inteligente",
  // Doubles as the "/" landing page's description — /agentes (the
  // marketplace, formerly at "/") has its own route-level metadata override.
  description:
    "Tu oficina inmobiliaria, potenciada por IA. CRM · Chatbot · Afiliados · WhatsApp. Única con sistema de afiliados en Paraguay.",
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
        <OnboardingTour />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
