import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0f2e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tomame - Event Voting & Award Platform",
    template: "%s | Tomame",
  },
  description:
    "Tomame is a modern event voting and award platform. Create events, manage nominations, and engage your audience with seamless voting experiences.",
  keywords: [
    "event voting",
    "award platform",
    "nomination management",
    "voting system",
    "event management",
    "audience engagement",
    "awards",
    "contests",
    "polls",
  ],
  authors: [{ name: "Tomame" }],
  creator: "Tomame",
  publisher: "Tomame",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Tomame",
    title: "Tomame - Event Voting & Award Platform",
    description:
      "Create events, manage nominations, and engage your audience with seamless voting experiences.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Tomame - Event Voting & Award Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomame - Event Voting & Award Platform",
    description:
      "Create events, manage nominations, and engage your audience with seamless voting experiences.",
    images: ["/logo.png"],
    creator: "@tomame",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/logo.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/logo.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "/",
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
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
