"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, ShoppingBag } from "lucide-react";
import type { ClassifiedItem } from "@/actions/classifieds";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(dateStr: string) {
  const normalized = dateStr.includes("T")
    ? dateStr
    : `${dateStr.replace(" ", "T")}Z`;
  const now = Date.now();
  const date = new Date(normalized).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

function CompactCard({ item }: { item: ClassifiedItem }) {
  return (
    <Link
      href={`/classificados/${item.slug}`}
      className="group flex gap-3 bg-white/3 border border-white/10 rounded-xl p-2.5 hover:border-green-500/30 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
        {item.images[0] ? (
          // biome-ignore lint/performance/noImgElement: user uploaded images
          <img
            src={item.images[0].url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-between min-w-0 py-0.5">
        <div>
          <h4 className="text-xs font-semibold line-clamp-2 leading-tight group-hover:text-green-300 transition-colors">
            {item.title}
          </h4>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-green-400">
            {formatPrice(item.price)}
          </span>
          <span className="text-[10px] text-white/30 shrink-0">
            {timeAgo(item.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RotatingCard({ items }: { items: ClassifiedItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure card height after first render
  useEffect(() => {
    if (cardRef.current) {
      setHeight(cardRef.current.scrollHeight);
    }
  }, []);

  // Rotation cycle: 5s visible → fade out → switch → fade in
  useEffect(() => {
    if (items.length <= 1) return;

    const DISPLAY_TIME = 5000;
    const FADE_TIME = 500;

    function cycle() {
      // Start fade out
      setIsVisible(false);

      // After fade out, switch item and fade in
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        // Measure new height will happen in next effect
        setIsVisible(true);

        // Schedule next cycle
        timerRef.current = setTimeout(cycle, DISPLAY_TIME);
      }, FADE_TIME);
    }

    timerRef.current = setTimeout(cycle, DISPLAY_TIME);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items.length]);

  // Update measured height when item changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex triggers re-measure
  useEffect(() => {
    if (cardRef.current) {
      setHeight(cardRef.current.scrollHeight);
    }
  }, [currentIndex]);

  const item = items[currentIndex];

  return (
    <div
      className="transition-[height] duration-500 ease-in-out overflow-hidden"
      style={height ? { height } : undefined}
    >
      <div
        ref={cardRef}
        className={`transition-opacity duration-500 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <Link
          href={`/classificados/${item.slug}`}
          className="group flex gap-3 bg-white/3 border border-white/10 rounded-xl p-2.5 hover:border-green-500/30 transition-all duration-300"
        >
          {/* Thumbnail */}
          <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white/5">
            {item.images[0] ? (
              // biome-ignore lint/performance/noImgElement: user uploaded images
              <img
                src={item.images[0].url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between min-w-0 py-0.5">
            <div>
              <h4 className="text-xs font-semibold line-clamp-2 leading-tight group-hover:text-green-300 transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-1 text-[10px] text-white/30 mt-1">
                <MapPin className="w-2.5 h-2.5" />
                {item.cityName}, {item.stateCode}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-green-400">
                {formatPrice(item.price)}
              </span>
              <span className="text-[10px] text-white/30 shrink-0">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          </div>
        </Link>

        {/* Dots indicator */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {items.map((_, i) => (
              <span
                key={items[i].id}
                className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                  i === currentIndex ? "bg-green-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassifiedsSidebar({
  items,
}: {
  items: ClassifiedItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-green-400" />
          Classificados
        </h3>
        <Link
          href="/classificados"
          className="text-[10px] text-green-400 hover:underline flex items-center gap-0.5"
        >
          Ver todos <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Content */}
      {items.length === 1 ? (
        <CompactCard item={items[0]} />
      ) : (
        <RotatingCard items={items} />
      )}
    </div>
  );
}
