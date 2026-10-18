import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yosr-sfaihi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Yosr Sfaihi – AI & Cloud Engineering Student",
  description:
    "Final-year Computer Engineering student specialising in IT Architecture & Cloud Engineering at ESPRIT. Seeking a 6-month end-of-studies internship in AI / Cloud & DevOps.",
  keywords: [
    "Yosr Sfaihi",
    "AI Engineer",
    "Cloud DevOps",
    "Internship",
    "ESPRIT",
    "Tunisia",
    "LangChain",
    "Kubernetes",
    "AWS",
  ],
  authors: [{ name: "Yosr Sfaihi", url: siteUrl }],
  openGraph: {
    type: "profile",
    title: "Yosr Sfaihi – AI & Cloud Engineering Student",
    description:
      "Seeking a 6-month end-of-studies internship in AI / Cloud & DevOps. Tap a card to connect.",
    url: siteUrl,
    siteName: "Yosr Sfaihi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yosr Sfaihi – AI & Cloud DevOps Intern",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yosr Sfaihi – AI & Cloud Engineering",
    description:
      "Final-year engineering student at ESPRIT, looking for a 6-month internship in AI / Cloud & DevOps.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
