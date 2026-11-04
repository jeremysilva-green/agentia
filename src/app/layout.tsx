import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
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

const META_PIXEL_ID = "1159351416547695";

// Only the real site reports to Meta — localhost and preview deployments
// would otherwise pollute the pixel's data with test traffic.
const META_PIXEL_HOST = "agentia.com.py";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const metaPixelEnabled = new URL(getSiteUrl()).hostname === META_PIXEL_HOST;

  return (
    <html
      lang="es"
      className={`${inter.variable} ${clashDisplay.variable} ${clashDisplayLight.variable} ${rubik.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="h-full flex flex-col bg-white font-sans text-slate-900">
        {metaPixelEnabled && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
        <NavBar />
        <OnboardingTour />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
