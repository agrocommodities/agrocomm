import React from "react";
import Link from "next/link";

interface CardProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  href: string;
  className?: string;
}

export default function ImageCard({ imageUrl, title, subtitle, href, className }: CardProps) {
  return (
    <Link href={href}>
      <div
        className={`relative overflow-hidden rounded-xl shadow-lg ${className}`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        <div className="absolute inset-0 bg-black/30 z-10" />

        <div className="relative z-20 p-6 h-full flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h3>
          <p className="text-lg text-white/90">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
