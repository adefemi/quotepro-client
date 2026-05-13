import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BrandMark } from "@/components/brand-mark";
import { MonitoringBootstrap } from "@/components/monitoring-bootstrap";
import { BRAND_OWNER } from "@/lib/brand";
import { Providers } from "./providers";

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
  title: "QuotePro",
  description: "Quote-to-cash over WhatsApp.",
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
