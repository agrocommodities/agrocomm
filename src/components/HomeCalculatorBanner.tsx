"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import CommodityBulletinsBanner from "./CommodityBulletinsBanner";

type Slide = {
  href: string;
  ariaLabel: string;
  src: string;
  alt: string;
  showLogo?: boolean;
};

const SLIDES: Slide[] = [
  {
    href: "/ferramentas/calculadora-pecuaria",
    ariaLabel: "Abrir a calculadora de lucro na pecuária",
    src: "/images/banner/calculadora-pecuaria.svg",
    alt: "Calculadora de lucro na pecuária AgroComm",
    showLogo: true,
  },
  {
    href: "/vagas",
    ariaLabel: "Ver vagas de emprego no agronegócio",
    src: "/images/banner/empregos.png",
    alt: "Vagas de emprego no agronegócio AgroComm",
  },
];

const AUTOPLAY_MS = 6000;

export default function HomeCalculatorBanner() {
  const pathname = usePathname();
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  if (pathname !== "/") return null;

  return (
    <div className="bg-background pt-3 md:pt-5">
      <div className="mx-auto grid max-w-7xl gap-4 px-2 md:px-4 md:gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section
          aria-label="Destaques AgroComm"
          className="group/carousel relative overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-lg shadow-black/15"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            setIsPaused(true);
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 40) {
              goTo(active + (delta < 0 ? 1 : -1));
            }
            touchStartX.current = null;
            setIsPaused(false);
          }}
        >
          <div className="relative aspect-[1200/460] w-full">
            {SLIDES.map((slide, index) => (
              <Link
                key={slide.href}
                href={slide.href}
                aria-label={slide.ariaLabel}
                aria-hidden={index !== active}
                tabIndex={index === active ? 0 : -1}
                className={`absolute inset-0 block transition-opacity duration-700 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/20 ${
                  index === active
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover object-center transition duration-500 group-hover/carousel:scale-[1.005]"
                />

                {slide.showLogo && (
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
                )}
              </Link>
            ))}
          </div>

          {SLIDES.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Slide anterior"
                className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-0 backdrop-blur-sm transition duration-200 hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50 group-hover/carousel:opacity-100 md:size-9"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Próximo slide"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white opacity-0 backdrop-blur-sm transition duration-200 hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50 group-hover/carousel:opacity-100 md:size-9"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                {SLIDES.map((slide, index) => (
                  <button
                    key={slide.href}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Ir para o slide ${index + 1}`}
                    aria-current={index === active}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === active
                        ? "w-6 bg-green-400"
                        : "w-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <CommodityBulletinsBanner />
      </div>
    </div>
  );
}
