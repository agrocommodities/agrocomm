"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavLinkClient } from "@/config";

export default function MobileNavDropdown({ link }: { link: NavLinkClient }) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: Math.max(8, rect.left - 4),
        zIndex: 9999,
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  if (!link.children) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggle()}
        className={`text-sm font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1 cursor-pointer
          ${open ? "text-green-300" : "hover:text-green-300"}`}
      >
        {link.name}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-[#2a3326] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-40 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <Link
            href={link.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-green-400 hover:bg-white/5 hover:text-green-300 transition-colors border-b border-white/10"
          >
            Ver todos
          </Link>
          {link.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
