"use client";

import Link from "next/link";
import { navLinks } from "@/config";
import { MobileMenu, UserMenu } from "@/components/ui/usermenu";
import type { User } from "@/types";

interface NavbarProps {
  user?: User | null;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Espaço vazio à esquerda no mobile para balancear */}
      <div className="md:hidden w-8"></div>

      {/* Desktop Navigation - Centralizado */}
      <nav className="hidden md:flex items-center justify-center flex-1">
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="transition duration-300 bg-black/30 hover:bg-black/45 px-4 py-2 rounded-md text-white font-semibold"
            >
              {link.name}
            </Link>
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