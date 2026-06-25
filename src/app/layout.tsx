import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer",
  description:
    "Portfolio de Yoann Beugré — Software Engineer spécialisé en IA, algorithmes, trading quantitatif et systèmes distribués.",
  keywords: [
    "Yoann Beugré",
    "Software Engineer",
    "AI Engineer",
    "Quant Developer",
    "Algorithm Designer",
    "Trading Bot",
    "Machine Learning",
    "React",
    "Next.js",
    "Python",
    "Portfolio",
  ],
  authors: [{ name: "Yoann Beugré" }],
  creator: "Yoann Beugré",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer",
    description: "Portfolio — Systèmes complexes, IA, Trading Quantitatif, Algorithmes.",
    siteName: "Yoann Beugré Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer",
    description: "Portfolio — Systèmes complexes, IA, Trading Quantitatif.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#030712] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
