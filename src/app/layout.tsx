import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { OnboardingTour } from "@/components/OnboardingTour";
import { getSiteUrl } from "@/lib/siteUrl";

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

// Default share image for every page without its own (listing pages and
// short links set their own openGraph, which replaces this one). 1640x856 is
// ~1.91:1, the ratio WhatsApp/Facebook show as a full-width preview.
// og:title/description are deliberately left out so each page's own <title>
// and description are used as the fallback instead of the root's.
const SHARE_IMAGE = { url: "/Agentia-Thumbnail.png", width: 1640, height: 856, alt: "Agentia — Portal Inmobiliario Inteligente" };

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  openGraph: { type: "website", siteName: "Agentia", locale: "es_PY", images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
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
      <body className="h-full flex flex-col bg-white font-sans text-slate-900">
        <NavBar />
        <OnboardingTour />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
