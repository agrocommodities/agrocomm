// src/components/ui/usermenu.tsx (atualizar a parte do UserMenu)
"use client";

import { useState, useEffect, useRef } from "react";
import { navLinks } from "@/config";
import Link from "next/link";
import Image from "next/image";
import { logOut } from "@/actions/auth";
import type { User } from "@/types";

interface MenuProps {
  user?: User | null;
}

interface SubscriptionInfo {
  isSubscribed: boolean;
  planName?: string;
  planInterval?: string;
  currentPeriodEnd?: string;
  status?: string;
}

export function UserMenu({ user }: MenuProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isSubscribed: false,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenu = () => {
    setIsUserMenuOpen(false);
  };

  // src/components/ui/usermenu.tsx (continuação)
  // Buscar informações da assinatura quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      fetch("/api/user/subscription-status")
        .then((res) => res.json())
        .then((data) => {
          if (data.isSubscribed && data.subscription) {
            const sub = data.subscription;
            const planName =
              sub.items?.data[0]?.price?.product?.name || "Plano Premium";
            const planInterval = sub.items?.data[0]?.price?.recurring?.interval;

            setSubscription({
              isSubscribed: true,
              planName,
              planInterval,
              currentPeriodEnd: new Date(
                sub.current_period_end * 1000
              ).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              status: sub.status,
            });
          } else {
            setSubscription({ isSubscribed: false });
          }
        })
        .catch(() => setSubscription({ isSubscribed: false }));
    }
  }, [user]);

  // Fecha menu quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          src={
            user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name
            )}&background=394634&color=fff&size=32`
          }
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
          width={32}
          height={32}
        />
        <div className="flex flex-col items-start">
          <span className="text-white text-sm font-medium">{user.name}</span>
          {subscription.isSubscribed && (
            <span className="text-green-400 text-xs">
              {subscription.planName} • Vence {subscription.currentPeriodEnd}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-white transition-transform ${
            isUserMenuOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isUserMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background/95 backdrop-blur-sm rounded-md shadow-lg border-2 border-white/20 z-50">
          <div className="p-4 border-b border-white/20">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-sm text-white/60">{user.email}</p>

            {/* Status da Assinatura */}
            <div className="mt-2">
              {subscription.isSubscribed ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-400 font-medium">
                    {subscription.planName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Conta gratuita</span>
                </div>
              )}
            </div>

            {user.role && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-white/20 text-white rounded-full">
                {user.role}
              </span>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/ajustes"
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Configurações
            </Link>

            {/* Link para assinatura */}
            {subscription.isSubscribed ? (
              <Link
                href="/ajustes#assinatura"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-green-400 hover:bg-white/10 transition-colors"
              >
                Gerenciar Assinatura
              </Link>
            ) : (
              <Link
                href="/#planos"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-blue-400 hover:bg-white/10 transition-colors"
              >
                Assinar Premium
              </Link>
            )}

            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Administração
              </Link>
            )}
          </div>

          <div className="border-t border-white/20">
            <form action={logOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
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

// Manter o MobileMenu igual, mas adicionar as mesmas informações de assinatura
export function MobileMenu({ user }: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    isSubscribed: false,
  });

  // Buscar informações da assinatura
  useEffect(() => {
    if (user) {
      fetch("/api/user/subscription-status")
        .then((res) => res.json())
        .then((data) => {
          if (data.isSubscribed && data.subscription) {
            const sub = data.subscription;
            const planName =
              sub.items?.data[0]?.price?.product?.name || "Plano Premium";

            setSubscription({
              isSubscribed: true,
              planName,
              currentPeriodEnd: new Date(
                sub.current_period_end * 1000
              ).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            });
          }
        })
        .catch(() => setSubscription({ isSubscribed: false }));
    }
  }, [user]);

  const toggleSubItems = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Fechar menu quando a tela é redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        <div className="fixed inset-0 bg-black/50 z-30" onClick={closeMenu} />
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
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=394634&color=fff&size=40`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-300 text-sm">{user.email}</p>
                  {subscription.isSubscribed && (
                    <p className="text-green-400 text-xs mt-1">
                      {subscription.planName} • Vence{" "}
                      {subscription.currentPeriodEnd}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {user.role && (
                  <span className="inline-block px-2 py-1 text-xs bg-white/20 text-white rounded-full">
                    {user.role}
                  </span>
                )}
                {subscription.isSubscribed ? (
                  <span className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                    Premium
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                    Gratuito
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-4 mb-8">
            {navLinks.map((link) => (
              <div key={link.name}>
                {link.href ? (
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="text-white font-semibold text-lg py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors block"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleSubItems(link.name)}
                      className="w-full text-left text-white font-semibold text-lg py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors flex justify-between items-center"
                    >
                      {link.name}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedItem === link.name ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {expandedItem === link.name && (
                      <div className="pl-4 mt-2 space-y-2">
                        {link.subItems?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={closeMenu}
                            className="text-white font-medium text-base py-2 px-4 rounded-md bg-black/20 hover:bg-black/35 transition-colors block"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Actions (Mobile) */}
          <div className="flex flex-col space-y-3 mt-auto mb-8">
            {user ? (
              <>
                <Link
                  href="/ajustes"
                  onClick={closeMenu}
                  className="text-white font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                >
                  Configurações
                </Link>

                {subscription.isSubscribed ? (
                  <Link
                    href="/ajustes#assinatura"
                    onClick={closeMenu}
                    className="text-green-400 font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                  >
                    Gerenciar Assinatura
                  </Link>
                ) : (
                  <Link
                    href="/#planos"
                    onClick={closeMenu}
                    className="text-blue-400 font-medium py-3 px-4 rounded-md bg-black/30 hover:bg-black/45 transition-colors text-center"
                  >
                    Assinar Premium
                  </Link>
                )}

                {user.role === "admin" && (
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
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
                  className="rounded-md bg-black/30 px-5 py-3 text-center font-medium text-white shadow-sm hover:bg-black/40 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  onClick={closeMenu}
                  className="rounded-md bg-black/30 px-5 py-3 text-center font-medium text-white hover:bg-black/40 transition-colors"
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
