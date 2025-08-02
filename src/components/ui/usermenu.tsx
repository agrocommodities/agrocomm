"use client";

import { useState, useEffect, useRef } from "react";
import { navLinks } from "@/config";
import Link from "next/link";
import Image from "next/image";
import { logOut } from "@/actions/auth";
import type { User } from "@/types";

interface UserMenuProps {
  user?: User | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenu = () => {
    setIsUserMenuOpen(false);
  };

  // Fecha menu quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/entrar"
          className="rounded-md bg-black/30 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black/40 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md bg-black/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/40 transition-colors"
        >
          Cadastro
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleUserMenu}
        className="flex items-center gap-2 p-2 rounded-md hover:bg-black/20 transition-colors"
        aria-label="Menu do usuário"
      >
        <Image
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ffffff&color=000&size=32`}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          width={32}
          height={32}
        />
        <svg 
          className={`w-4 h-4 text-white transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-100 z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.role && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full">
                {user.role}
              </span>
            )}
          </div>
          <div className="py-1">
            <Link
              href="/ajustes"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:!text-black transition-colors"
            >
              Configurações
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Administração
              </Link>
            )}
          </div>
          <div className="border-t border-gray-100">
            <form action={logOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


interface MobileMenuProps {
  user?: User | null;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Fecha menu quando a tela é redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="md:hidden">
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="relative z-50 p-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
              isMenuOpen ? "rotate-45 translate-y-1.5" : "-translate-y-1"
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
              isMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out ${
              isMenuOpen ? "-rotate-45 -translate-y-1.5" : "translate-y-1"
            }`}
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-background border-l-2 border-black/50 z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          {/* User Info Section (Mobile) */}
          {user && (
            <div className="bg-black/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=394634&color=fff&size=40`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-300 text-sm">{user.email}</p>
                </div>
              </div>
              {user.role && (
                <span className="inline-block px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full">
                  {user.role}
                </span>
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-4 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="text-white font-semibold text-lg py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions (Mobile) */}
          <div className="flex flex-col space-y-3 mt-auto mb-8">
            {user ? (
              <>
                <Link
                  href="/perfil"
                  onClick={closeMenu}
                  className="text-white font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                >
                  Meu Perfil
                </Link>
                <Link
                  href="/ajustes"
                  onClick={closeMenu}
                  className="text-white font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                >
                  Configurações
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="text-white font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                  >
                    Administração
                  </Link>
                )}
                <form action={logOut}>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  onClick={closeMenu}
                  className="rounded-md bg-black/30 px-5 py-3 text-center font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  onClick={closeMenu}
                  className="rounded-md bg-black/30 px-5 py-3 text-center font-medium text-teal-600 hover:bg-gray-200 transition-colors"
                >
                  Cadastro
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}