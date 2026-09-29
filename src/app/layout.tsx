import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const description =
  "Auryx Software helps businesses turn ideas and operational challenges into practical software solutions: maritime school systems, business process automation, custom software development, and IT consultation.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Auryx Software, The Silent Force Behind Smarter Software",
    template: "%s · Auryx Software",
  },
  description,
  applicationName: "Auryx Software",
  openGraph: {
    type: "website",
    siteName: "Auryx Software",
    locale: "en_PH",
    title: "Auryx Software, The Silent Force Behind Smarter Software",
    description,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0e2c4b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
