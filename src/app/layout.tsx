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
  title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer — Bordeaux",
  description:
    "Portfolio de Yoann Beugré — Freelance Software Engineer, AI Engineer et Quant Developer basé à Bordeaux. Spécialisé en IA, algorithmes, trading quantitatif, systèmes distribués. Disponible Bordeaux, France, Abidjan (Côte d'Ivoire), remote.",
  keywords: [
    "Yoann Beugré",
    "freelance Bordeaux",
    "développeur Bordeaux",
    "développeur IA Bordeaux",
    "Software Engineer Bordeaux",
    "AI Engineer Bordeaux",
    "Quant Developer",
    "Algorithm Designer",
    "Trading Bot",
    "Machine Learning Bordeaux",
    "développeur freelance Côte d'Ivoire",
    "développeur Abidjan",
    "IA Abidjan",
    "ingénieur logiciel Bordeaux",
    "React Next.js Bordeaux",
    "Python developer Bordeaux",
    "développeur Python",
    "LangChain OpenAI",
    "Portfolio",
    "freelance France",
  ],
  authors: [{ name: "Yoann Beugré", url: "https://yoannbeugre.fr" }],
  creator: "Yoann Beugré",
  metadataBase: new URL("https://yoannbeugre.fr"),
  alternates: { canonical: "https://yoannbeugre.fr" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://yoannbeugre.fr",
    title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer — Bordeaux",
    description: "Freelance Software Engineer & AI Engineer basé à Bordeaux — Systèmes complexes, IA, Trading Quantitatif, Algorithmes. Disponible France & international.",
    siteName: "Yoann Beugré Portfolio",
    images: [{ url: "/yoann.jpg", width: 800, height: 800, alt: "Yoann Beugré" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yoann Beugré | Software Engineer · AI Engineer · Quant Developer",
    description: "Freelance Software Engineer & AI Engineer — Bordeaux, France.",
    images: ["/yoann.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  verification: {
    google: "",   // à remplir après Google Search Console
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Yoann Beugré",
    "url": "https://yoannbeugre.fr",
    "image": "https://yoannbeugre.fr/yoann.jpg",
    "jobTitle": "Software Engineer · AI Engineer · Quant Developer",
    "description": "Freelance Software Engineer & AI Engineer basé à Bordeaux, spécialisé en IA, trading quantitatif et systèmes distribués.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bordeaux",
      "addressCountry": "FR"
    },
    "email": "yoann.beugre1@gmail.com",
    "sameAs": [
      "https://github.com/Beugre",
      "https://www.linkedin.com/in/yoann-beugré-236b20153"
    ],
    "knowsAbout": ["Python", "TypeScript", "AI", "Machine Learning", "LangChain", "Trading Quantitatif", "React", "Next.js", "Docker", "PostgreSQL"],
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "Université de Bordeaux"
    },
    "offers": {
      "@type": "Offer",
      "name": "Développement logiciel freelance",
      "description": "Développement web, IA, algorithmes, trading quantitatif — remote ou hybride France & international"
    }
  };

  return (
    <html lang="fr" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[#030712] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
