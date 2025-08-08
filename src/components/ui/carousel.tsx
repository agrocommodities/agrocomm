"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDE_INTERVAL = 3000;
const FADE_DURATION = 500;

interface Slide {
  id: number
  image: string
  alt: string
}

interface Watermark {
  logo: string
  alt: string
  opacity?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  size?: 'sm' | 'md' | 'lg'
}

export function Carousel({
  slides,
  watermark,
}: {
  slides: Slide[]
  watermark: Watermark
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setFade(true)
      }, FADE_DURATION)
    }, SLIDE_INTERVAL)

    return () => clearInterval(interval)
  }, [slides.length])

  // Classes dinâmicas para posicionamento da marca d'água
  const getWatermarkPosition = () => {
    switch (watermark.position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      default:
        return 'bottom-4 right-4'
    }
  }

  // Tamanho da marca d'água
  const getWatermarkSize = () => {
    switch (watermark.size) {
      case 'sm':
        return 'w-16 h-16'
      case 'md':
        return 'w-24 h-24'
      case 'lg':
        return 'w-32 h-32'
      default:
        return 'w-24 h-24'
    }
  }

  return (
    <div className="relative w-full h-48 md:h-96 overflow-hidden rounded-xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          } ${fade ? 'ease-in' : 'ease-out'}`}
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

      {/* Marca d'água */}
      <div
        className={`absolute ${getWatermarkPosition()} ${getWatermarkSize()} z-10`}
        style={{ opacity: watermark.opacity || 0.7 }}
      >
        <Image
          src={watermark.logo}
          alt={watermark.alt}
          fill
          className="object-contain"
        />
      </div>
    </div>
  )
}