import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BPKMCH Sujhaab Portal | बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल",
    template: "%s | BPKMCH Sujhaab",
  },
  description:
    "Official Patient Suggestion & Grievance Redressal Portal for B.P. Koirala Memorial Cancer Hospital (BPKMCH), Bharatpur-7, Chitwan, Nepal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BPKMCH Sujhaab",
  },
  icons: {
    icon: [
      { url: "/bkmch-logo.png", href: "/bkmch-logo.png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/bkmch-logo.png",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/bkmch-logo.png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#27548b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ne"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#27548b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BPKMCH Sujhaab" />
        <link rel="icon" type="image/png" sizes="32x32" href="/bkmch-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/bkmch-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/bkmch-logo.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
