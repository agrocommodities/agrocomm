"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavLink } from "@/config";

export default function MobileNavDropdown({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);

  if (!link.children) return null;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium whitespace-nowrap hover:text-green-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
      >
        {link.name}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`flex flex-col gap-1 overflow-hidden transition-all duration-200
          ${open ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
      >
        <Link
          href={link.href}
          className="text-xs whitespace-nowrap text-green-400 hover:text-green-300 transition-colors pl-2"
        >
          Ver todos
        </Link>
        {link.children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            className="text-xs whitespace-nowrap hover:text-green-300 transition-colors pl-2"
          >
            {child.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
