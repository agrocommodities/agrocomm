// src/components/ui/navbar.tsx (atualizar a parte do dropdown)
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { navLinks } from "@/config";
import { MobileMenu, UserMenu } from "@/components/ui/usermenu";
import type { User } from "@/types";

interface NavbarProps {
  user?: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpenDropdown(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Espaço vazio à esquerda no mobile para balancear */}
      <div className="md:hidden w-8"></div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-center flex-1">
        <div className="flex items-center gap-2">
          {navLinks.map((link) => (
            <div key={link.name} className="relative" ref={link.subItems ? dropdownRef : null}>
              {link.href ? (
                <Link
                  href={link.href}
                  className="text-lg font-bold px-3 py-2 text-white hover:bg-white/10 transition-colors rounded-md"
                >
                  {link.name}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                    className="
                      text-lg font-bold px-3 py-2 text-white 
                      hover:bg-white/10 transition-colors 
                      rounded-md flex items-center gap-1 cursor-pointer
                    "
                  >
                    {link.name}
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        openDropdown === link.name ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDropdown === link.name && link.subItems && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border-2 border-white/20 z-50 overflow-hidden">
                      {link.subItems.map((subItem, index) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`
                            block px-4 py-3 text-sm font-medium text-white 
                            hover:bg-white/10 transition-colors
                            ${index !== link.subItems!.length - 1 ? 'border-b border-white/10' : ''}
                          `}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            {subItem.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Desktop User Menu - Direita */}
      <div className="hidden md:flex">
        <UserMenu user={user} />
      </div>

      {/* Mobile Menu - Direita */}
      <div className="md:hidden">
        <MobileMenu user={user} />
      </div>
    </div>
  );
}