import { headers } from "next/headers";
import { Toaster, toast } from "sonner";
import { Nunito } from "next/font/google";
import { Header } from "@/components/header";
import { SideBar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";
import "@/styles/globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});


// ...

// function App() {
//   return (
//     <div>
//       <Toaster />
//       <button onClick={() => toast('My first toast')}>
//         Give me a toast
//       </button>
//     </div>
//   )
// }

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

const sidebarPaths = ["/about"];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const pathname = (await headers()).get('next-url')

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
          <div className={`container mx-auto flex flex-col lg:flex-row flex-grow pt-20 pb-16 ${pathname === '/' ? 'items-center justify-center' : ''}`}>
            <main className="flex-grow p-3">
              {children}
            </main>
            {pathname && sidebarPaths.includes(pathname) && (
              <aside className="w-full md:w-72 p-3">
                <SideBar />
              </aside>
            )}
          </div>
          
          <Footer />
        </div>
      </body>
    </html>
  );
}