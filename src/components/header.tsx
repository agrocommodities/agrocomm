// src/components/header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { StateSelector } from "@/components/ui/state-selector";
import { UserMenu } from "@/components/ui/user-menu";
import { AuthButtons } from "./header/auth-buttons";
import { MobileMenu } from "./header/mobile-menu";
import type { User } from "@/types";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b-2 border-black/40"
      >
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground font-bold text-xl md:text-2xl"
            >
              <Image
                className="w-8 h-8 md:w-10 md:h-10"
                src="/images/navbar.svg"
                alt={process.env.NEXT_PUBLIC_APP_NAME!}
                width={40}
                height={40}
                priority
              />
              {process.env.NEXT_PUBLIC_APP_NAME}
            </Link>

            {/* Navegação Central - Desktop */}
            <div className="flex-1 flex justify-center">
              <NavigationMenu />
            </div>

            {/* Controles da Direita */}
            <div className="flex items-center gap-3">
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-3">
                <StateSelector />
                {user ? (
                  <UserMenu user={user} />
                ) : (
                  <AuthButtons />
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-label="Menu principal"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
      />
    </>
  );
}