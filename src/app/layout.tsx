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
  title: {
    default: "BPKMCH Gunaso Portal | बी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल",
    template: "%s | BPKMCH Gunaso",
  },
  description:
    "Official Patient Grievance & Complaint Redressal Portal for B.P. Koirala Memorial Cancer Hospital (BPKMCH), Bharatpur-7, Chitwan, Nepal.",
  icons: {
    icon: [
      { url: "/bkmch-logo.png", href: "/bkmch-logo.png" },
      { url: "/logo.png", href: "/logo.png" },
    ],
    shortcut: "/bkmch-logo.png",
    apple: "/bkmch-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
