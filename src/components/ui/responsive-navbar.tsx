// src/components/ui/responsive-navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { navLinks } from "@/config";

export function ResponsiveNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="flex items-center">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-x-4">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="transition duration-500 bg-black/30 hover:bg-black/45 px-4 py-2 rounded-md text-white font-semibold"
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Desktop User Menu */}
      <div className="hidden md:flex items-center gap-2 ml-6">
        <Link
          href="/entrar"
          className="rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 hover:bg-gray-200 transition-colors"
        >
          Register
        </Link>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden relative z-50 p-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md"
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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-background border-l-2 border-black/50 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
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

          {/* User Menu */}
          <div className="flex flex-col space-y-3 mt-auto mb-8">
            <Link
              href="/entrar"
              onClick={closeMenu}
              className="rounded-md bg-teal-600 px-5 py-3 text-center font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/cadastro"
              onClick={closeMenu}
              className="rounded-md bg-gray-100 px-5 py-3 text-center font-medium text-teal-600 hover:bg-gray-200 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}