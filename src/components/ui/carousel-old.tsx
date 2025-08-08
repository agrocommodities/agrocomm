"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDE_INTERVAL = 3000;
const FADE_DURATION = 500;

interface Slide {
  id: number;
  image: string;
  alt: string;
}

export function Carousel({ slides }: { slides: Slide[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, FADE_DURATION);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`
            absolute inset-0 transition-opacity duration-500 
            ${index === currentSlide ? "opacity-100" : "opacity-0"} 
            ${fade ? "ease-in" : "ease-out"}
          `}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={index === currentSlide}
          />
        </div>
      ))}
    </div>
  )
}