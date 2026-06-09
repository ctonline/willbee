import type { Metadata } from "next";
import { Archivo, Spectral, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReferralCapture } from "@/components/referral-capture";
import { SITE } from "@/lib/constants";

// Civic Scotch direction: a sturdy grotesque for UI/forms, paired on a
// contrast axis with a Scotch/transitional text serif for headings — the
// look of an official Scottish deed or register, made readable.
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Scottish Will generator`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_GB",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${archivo.variable} ${spectral.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={150}>{children}</TooltipProvider>
        <ReferralCapture />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
