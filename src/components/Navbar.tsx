"use client";

import { useState } from "react";
import Link from "next/link";
import { navLinks } from "../config";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative w-full flex justify-end items-center md:w-auto">
      {/* wrapper to position dropdown under the button */}
      <div className="relative">
        <button
          type="button"
          className="md:hidden p-2 focus:outline-none transform transition-transform duration-300"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <X className="w-6 h-6 rotate-90" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* mobile dropdown: small panel right-aligned under icon */}
        <div
          className={`absolute right-0 mt-2 w-auto flex flex-col items-center gap-2
            overflow-hidden transform transition-transform duration-300 origin-top-right
            ${open ? "scale-y-100" : "scale-y-0"}
            md:static md:flex-row md:justify-end md:overflow-visible md:scale-y-100 md:w-auto
          `}
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 hover:text-primary transition"
              onClick={() => setOpen(false)}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
