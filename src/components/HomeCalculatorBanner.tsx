"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeCalculatorBanner() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="bg-background px-2 pt-3 md:px-4 md:pt-5">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/ferramentas/calculadora-pecuaria"
          aria-label="Abrir a calculadora de lucro na pecuária"
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-green-400/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/20"
        >
          <Image
            src="/images/banner-calculadora-pecuaria.svg"
            alt="Calculadora de lucro na pecuária AgroComm"
            width={1200}
            height={460}
            priority
            unoptimized
            className="h-auto w-full transition duration-500 group-hover:scale-[1.005]"
          />
        </Link>
      </div>
    </div>
  );
}
