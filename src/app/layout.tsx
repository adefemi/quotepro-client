import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BrandMark } from "@/components/brand-mark";
import { MonitoringBootstrap } from "@/components/monitoring-bootstrap";
import { BRAND_OWNER } from "@/lib/brand";
import { Providers } from "./providers";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "QuotePro",
  description: "Quote-to-cash over WhatsApp.",
  icons: {
    icon: "/quotepro-icon.svg",
    shortcut: "/quotepro-icon.svg",
    apple: "/quotepro-icon.svg",
  },
  openGraph: {
    title: "QuotePro",
    description: "Quote-to-cash over WhatsApp.",
    siteName: "QuotePro",
    images: [
      {
        url: "/quotepro-og.svg",
        width: 1200,
        height: 630,
        alt: "QuotePro",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuotePro",
    description: "Quote-to-cash over WhatsApp.",
    images: ["/quotepro-og.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Providers>
          <MonitoringBootstrap />
          <header className="site-header" data-print-hide="true">
            <div className="nav-brand">
              <span className="nav-brand-mark">
                <BrandMark size={20} title="QuotePro" />
              </span>
              <span>QuotePro</span>
            </div>
          </header>
          {children}
          <footer className="site-footer" data-print-hide="true">
            <span className="nav-brand">
              <span className="nav-brand-mark">
                <BrandMark size={16} />
              </span>
              <span>QuotePro</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Powered by <strong>{BRAND_OWNER}</strong>
            </span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
