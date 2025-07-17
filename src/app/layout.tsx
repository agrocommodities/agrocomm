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

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <head>
//         <link
//           rel="icon"
//           href="/images/favicon.svg"
//           sizes="any"
//           type="image/svg+xml"
//         />
//       </head>
//       <body className={`${nunito.className} antialiased`}>
//         <HeaderWrapper />
//         <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//           <main className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//             <div className="container mx-auto">
//               {children}
//             </div>
//           </main>
//         </div>
//         <Footer />
//       </body>
//     </html>
//   );
// }

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
      <body className={`h-full flex flex-col antialiased ${nunito.className}`}>
        <HeaderWrapper />
          <main className="flex-1 pt-16 pb-12 min-h-screen">
            <div className="container mx-auto">
              {children}        
            </div>
          </main>
        <Footer />
      </body>
    </html>
  );
}



        
        
        
