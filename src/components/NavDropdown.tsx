"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavLink } from "@/config";

export default function NavDropdown({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function leave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  if (!link.children) return null;

  return (
    <nav className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <Link
        href={link.href}
        className="text-sm font-medium hover:text-green-300 transition-colors inline-flex items-center gap-1"
      >
        {link.name}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Link>

      <div
        className={`absolute left-0 top-full pt-2 z-50 transition-all duration-200 origin-top
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="bg-[#2d3a28] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-40">
          <Link
            href={link.href}
            className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors text-green-400 font-medium"
          >
            Ver todos
          </Link>
          <div className="border-t border-white/10 my-1" />
          {link.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
