import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "@/styles/globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  title: process.env.NEXT_PUBLIC_APP_NAME!,
  description: process.env.NEXT_PUBLIC_APP_DESC!,
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME!,
    description: process.env.NEXT_PUBLIC_APP_DESC!,
    url: process.env.NEXT_PUBLIC_APP_URL!,
    siteName: process.env.NEXT_PUBLIC_APP_NAME!,
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.svg" sizes="any" type="image/svg+xml" />
      </head>
      <body className={`${nunito.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="container mx-auto flex flex-col md:flex-row flex-grow">
            <main className="flex-grow p-4 order-2 md:order-1">
              {children}
            </main>
            <aside className="w-full md:w-64 p-4 bg-background order-1 md:order-2">
              Sidebar
            </aside>
          </div>          
          <Footer />
        </div>
      </body>
    </html>
  );
}
