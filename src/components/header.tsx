"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logOut } from "@/actions";
// import LogOut from "@/components/auth/logout-btn";

export interface User {
  user: {
    id: number;
    email: string;
    role: string;
    name?: string | null;
    username?: string | null;
  } | null;
}

export default function Header({ user }: User) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logOut();
  };

  // Fechar menu ao mudar de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest("nav")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b-2 border-black/40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-foreground font-bold text-2xl">
            <Image
              className="m-0"
              src="/images/navbar.svg"
              alt={process.env.NEXT_PUBLIC_APP_NAME!}
              width={38}
              height={38}
              priority
            />
            {process.env.NEXT_PUBLIC_APP_NAME}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-foreground/60">
                  Olá, {user.name || user.email}
                </span>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm hover:text-foreground/80 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="text-sm hover:text-foreground/80 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/90"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foreground/20"
            aria-expanded={isMenuOpen}
            aria-label="Menu principal"
          >
            <span className="sr-only">Abrir menu</span>
            {isMenuOpen ? (
              // X icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-t border-foreground/10 mt-2">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-foreground/60 border-b border-foreground/10 mb-2">
                  Olá, {user.name || user.email}
                </div>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-foreground/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {/* <LogOutLink className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors" /> */}
                <button
                  onClick={handleLogout}
                  className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-foreground/10 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}