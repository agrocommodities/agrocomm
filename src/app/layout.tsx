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
  title: "AgroComm",
  description: "Commodities Agropecuárias",
  openGraph: {
    title: "AgroComm",
    description: "Commodities Agropecuárias",
    url: "https://agrocomm.com.br",
    siteName: "AgroComm",
    images: [
      {
        url: "https://agrocomm.com.br/images/ogp.png",
        width: 256,
        height: 256,
        alt: "AgroComm",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
