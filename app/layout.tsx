import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://craftedai.deven.network'),
  title: "CRAFTED AI - Your Alys Beach Event Guide",
  description: "Your intelligent guide to CRAFTED 2025 at Alys Beach, Florida (Nov 12-16). Get instant answers about event schedules, Firkin Fête, workshops, Spirited Soirée, and more.",
  keywords: ["Crafted", "Alys Beach", "Florida", "culinary events", "craft beer", "workshops", "makers market", "November 2025", "event guide", "AI assistant"],
  authors: [{ name: "CRAFTED at Alys Beach" }],
  creator: "CRAFTED Event Team",
  publisher: "Alys Beach",
  applicationName: "CRAFTED AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRAFTED AI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://craftedai.deven.network',
    siteName: 'CRAFTED AI',
    title: 'CRAFTED AI - Your Alys Beach Event Guide',
    description: 'Your intelligent guide to CRAFTED 2025 at Alys Beach, Florida (Nov 12-16). Get instant answers about events, schedules, and experiences.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CRAFTED AI - Alys Beach Event Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRAFTED AI - Your Alys Beach Event Guide',
    description: 'Your intelligent guide to CRAFTED 2025 at Alys Beach, Florida (Nov 12-16).',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#004978',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
