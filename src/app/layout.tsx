import { Nunito } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
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
        <link rel="shortcut icon" href="/images/logo.svg" type="image/svg+xml" sizes="any" />
      </head>
      <body className={nunito.variable}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="grow p-4">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
