// src/app/layout.tsx
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { Nunito } from "next/font/google";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/ui/sidebar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";
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

// Páginas que devem ter sidebar
const sidebarPaths = ["/cotacoes"];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const pathname = (await headers()).get('next-url')

  // Verificar se deve mostrar sidebar
  const showSidebar = pathname && sidebarPaths.some(path => pathname.startsWith(path));

  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/images/favicon.svg" sizes="any" type="image/svg+xml" />
      </head>
      <body className={`${nunito.variable} antialiased`}>
        <Toaster />
        <div className="flex flex-col min-h-screen">
          <Header />
          
          {/* Main content com padding para header e footer fixos */}
          <div className={`container mx-auto flex flex-col ${showSidebar ? 'lg:flex-row' : ''} flex-grow pt-20 pb-16 ${pathname === '/' ? 'items-center justify-center' : ''}`}>
            <main className={`flex-grow p-3 ${showSidebar ? 'lg:pr-6' : ''}`}>
              {children}
            </main>
            
            {showSidebar && (
              <aside className="w-full lg:w-80 p-3">
                <Sidebar />
              </aside>
            )}
          </div>
          
          <Footer />
        </div>
      </body>
    </html>
  );
}