"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CommodityBulletinsBanner from "./CommodityBulletinsBanner";

export default function HomeCalculatorBanner() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="bg-background pt-3 md:pt-5">
      <div className="mx-auto grid max-w-7xl gap-4 px-2 md:px-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Link
          href="/ferramentas/calculadora-pecuaria"
          aria-label="Abrir a calculadora de lucro na pecuária"
          className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-green-400/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/20"
        >
          <Image
            src="/images/banner-calculadora-pecuaria.svg"
            alt="Calculadora de lucro na pecuária AgroComm"
            width={1200}
            height={460}
            priority
            unoptimized
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.005]"
          />

          <span className="pointer-events-none absolute left-[5.05%] top-[9.75%] block aspect-square w-[3.5%] min-w-4">
            <Image
              src="/images/logo.svg"
              alt=""
              fill
              unoptimized
              sizes="(max-width: 768px) 20px, 42px"
              className="object-contain"
            />
          </span>
        </Link>

        <CommodityBulletinsBanner />
      </div>
    </div>
  );
}
