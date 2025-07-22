import localFont from "next/font/local";
import HeaderWrapper from "@/components/header-wrapper";
import Footer from "@/components/footer";
import type { Metadata } from "next";
import "@/styles/main.scss";

const nunito = localFont({
  src: "../../public/fonts/nunito.woff2",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Agrocomm",
  description: process.env.NEXT_PUBLIC_APP_DESC || "Commodities Agropecuárias",
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME || "Agrocomm",
    description:
      process.env.NEXT_PUBLIC_APP_DESC || "Commodities Agropecuárias",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://agrocomm.com.br",
    siteName: process.env.NEXT_PUBLIC_APP_NAME || "AgroComm",
    images: [
      {
        url: "/images/ogp.png",
        width: 256,
        height: 256,
        alt: "AgroComm",
      },
    ],
    locale: "pt-BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="icon"
          href="/images/favicon.svg"
          sizes="any"
          type="image/svg+xml"
        />
      </head>
      <body className={`h-full antialiased ${nunito.className}`}>
        <div className="min-h-full flex flex-col">
          <HeaderWrapper />
            <main className="container mx-auto py-20">
              <div className="flex-1">
                {children}
              </div>
            </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
