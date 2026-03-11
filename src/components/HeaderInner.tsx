"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { SessionPayload } from "@/lib/auth";

interface Props {
  session: SessionPayload | null;
  links: { name: string; href: string }[];
}

export default function HeaderInner({ session, links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative w-full flex justify-end items-center md:w-auto">
      <div className="relative">
        <button
          type="button"
          className="md:hidden p-2 focus:outline-none"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span
            className={`block transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </span>
        </button>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium hover:text-green-300 transition-colors"
            >
              {l.name}
            </Link>
          ))}
          {session ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm font-medium hover:text-green-300 transition-colors cursor-pointer"
              >
                Sair
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium hover:text-green-300 transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* mobile dropdown */}
      <div
        className={`absolute right-0 top-full mt-2 min-w-40 flex flex-col items-end gap-3 bg-alt-background rounded-xl shadow-lg p-4
          overflow-hidden transform transition-all duration-300 origin-top-right
          ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}
          md:hidden
        `}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium hover:text-green-300 transition-colors"
            onClick={() => setOpen(false)}
          >
            {l.name}
          </Link>
        ))}
        {session ? (
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium hover:text-green-300 transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
            >
              Sair
            </button>
          </form>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm font-medium hover:text-green-300 transition-colors"
            onClick={() => setOpen(false)}
          >
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}
