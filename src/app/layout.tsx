import { Nunito } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import type { Metadata } from "next";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agrocomm.com.br"),
  title: {
    default:
      "AgroComm — Cotações de Commodities Agropecuárias, Notícias e Classificados",
    template: "%s — AgroComm",
  },
  description:
    "Acompanhe cotações atualizadas de commodities agrícolas e pecuárias: soja, milho, feijão, boi gordo, vaca gorda. Notícias do agronegócio, Bolsa de Chicago (CBOT) e classificados de máquinas e implementos agrícolas.",
  keywords: [
    "AgroComm",
    "commodities agropecuárias",
    "commodities agrícolas",
    "cotações agropecuárias",
    "cotação soja",
    "cotação milho",
    "cotação boi gordo",
    "preço soja hoje",
    "preço milho hoje",
    "preço boi gordo hoje",
    "cotação feijão",
    "Bolsa de Chicago",
    "CBOT",
    "classificados trator",
    "classificados agrícolas",
    "máquinas agrícolas",
    "agronegócio",
    "notícias agropecuárias",
    "pecuária",
    "grãos",
  ],
  authors: [{ name: "AgroComm", url: "https://agrocomm.com.br" }],
  creator: "AgroComm",
  publisher: "AgroComm",
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
  alternates: {
    canonical: "https://agrocomm.com.br",
  },
  openGraph: {
    title:
      "AgroComm — Cotações de Commodities Agropecuárias, Notícias e Classificados",
    description:
      "Cotações atualizadas de soja, milho, feijão, boi gordo e vaca gorda. Notícias do agronegócio, Bolsa de Chicago e classificados agrícolas.",
    url: "https://agrocomm.com.br",
    siteName: "AgroComm",
    images: [
      {
        url: "/images/og-banner.png",
        width: 1200,
        height: 630,
        alt: "AgroComm — Cotações de Commodities Agropecuárias",
        type: "image/png",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgroComm — Cotações de Commodities Agropecuárias",
    description:
      "Cotações atualizadas de soja, milho, boi gordo. Notícias do agronegócio e classificados agrícolas.",
    images: ["/images/og-banner.png"],
  },
  verification: {},
  category: "agriculture",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="shortcut icon"
          href="/images/logo.svg"
          type="image/svg+xml"
          sizes="any"
        />
      </head>
      <body className={nunito.variable}>
        <PageTracker />
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="grow p-4">{children}</main>
          <Footer />
        </div>
        {modal}
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
