"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  RefreshCw,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  AlertTriangle,
  Newspaper,
  HardDrive,
  ShoppingBag,
  Shield,
  FileText,
  Tag,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/cotacoes", label: "Cotações", icon: DollarSign },
  { href: "/admin/conflitos", label: "Conflitos", icon: AlertTriangle },
  { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
  { href: "/admin/classificados", label: "Classificados", icon: ShoppingBag },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
  { href: "/admin/moderacao", label: "Moderação", icon: Shield },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/scraping", label: "Scraping", icon: RefreshCw },
  { href: "/admin/armazenamento", label: "Armazenamento", icon: HardDrive },
  { href: "/admin/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { href: "/admin/logs", label: "Logs", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#1a2218] border-b border-white/10 shrink-0">
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </Link>
        <span className="font-semibold text-sm">Admin</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-[#1a2218] border-r border-white/10 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="text-lg font-bold">🌾 AgroComm</h1>
          <p className="text-xs text-white/40 mt-0.5">Painel Administrativo</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive(href)
                    ? "bg-green-600/20 text-green-400"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Voltar ao site
          </Link>
        </div>
      </aside>
    </>
  );
}
