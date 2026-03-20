"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: { id: number; url: string; position: number }[];
  title: string;
}

export default function ClassifiedGallery({ images, title }: Props) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-white/5 flex items-center justify-center text-white/20">
        Sem imagens
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main image */}
      <div className="aspect-video bg-white/5 overflow-hidden">
        {/* biome-ignore lint/performance/noImgElement: user uploaded images */}
        <img
          src={images[current].url}
          alt={`${title} - ${current + 1}`}
          className="w-full h-full object-contain bg-black/30"
        />
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrent((p) => (p === 0 ? images.length - 1 : p - 1))
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrent((p) => (p === images.length - 1 ? 0 : p + 1))
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition ${i === current ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === current
                  ? "border-green-500"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* biome-ignore lint/performance/noImgElement: user uploaded images */}
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
