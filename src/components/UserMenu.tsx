"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { SessionPayload } from "@/lib/auth";

interface Props {
  session: SessionPayload | null;
  hasAdminAccess?: boolean;
}

export default function UserMenu({ session, hasAdminAccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
      setOpen(false);
      router.refresh();
      router.push("/login");
    });
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm font-semibold rounded-lg px-3.5 py-2 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Entrar</span>
      </Link>
    );
  }

  const initial = session.name.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold select-none overflow-hidden">
          {session.avatarUrl ? (
            <Image
              src={session.avatarUrl}
              alt="Avatar"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
        <span className="hidden sm:block text-sm font-medium max-w-30 truncate">
          {session.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-56 z-50 bg-[#2d3a28] border border-white/10 rounded-xl shadow-2xl overflow-hidden
          transform transition-all duration-200 origin-top-right
          ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
      >
        {/* User info */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold truncate">{session.name}</p>
          <p className="text-xs text-white/50 truncate">{session.email}</p>
        </div>

        {/* Links */}
        <div className="py-1.5">
          {hasAdminAccess && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors text-green-400"
            >
              <Shield className="w-4 h-4" />
              Painel Admin
            </Link>
          )}
          <Link
            href="/ajustes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Ajustes
          </Link>
          <Link
            href="/notificacoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Notificações
          </Link>
        </div>

        {/* Logout */}
        <div className="border-t border-white/10 py-1.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      </div>
    </div>
  );
}
