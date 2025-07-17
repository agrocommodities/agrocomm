import localFont from "next/font/local";
import Header from "@/components/header";
import Footer from "@/components/footer";
import type { Metadata } from "next";
import "@/styles/main.scss";

const nunito = localFont({
  src: "../../public/fonts/nunito.woff2",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Agrocomm",
  description: process.env.NEXT_PUBLIC_APP_DESC || "Commodities Agropecuárias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = { id: "1", email: "email", role: "user", name: "username" };

  return (
    <html lang="en">
      <body className={`${nunito.className} antialiased`}>
        <Header user={user} />
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
