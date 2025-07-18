"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Home, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  user?: {
    id: number;
    email: string;
    name?: string | null;
    role: string;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: "Início", href: "/" },
    { icon: User, label: "Perfil", href: "/perfil" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
  ];

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setIsCollapsed(true)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-sm border-l border-foreground/10 z-50 transition-all duration-300 ${
          isCollapsed 
            ? 'w-16 lg:w-16' 
            : 'w-64 lg:w-64'
        } ${
          isCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-4 bg-background border border-foreground/10 rounded-full p-1 hover:bg-foreground/5 transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="p-4 h-full flex flex-col">
          {/* User Info */}
          {user && !isCollapsed && (
            <div className="mb-6 pb-4 border-b border-foreground/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-foreground/60 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Icon Only (Collapsed) */}
          {user && isCollapsed && (
            <div className="mb-6 pb-4 border-b border-foreground/10 flex justify-center">
              <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout (if user exists) */}
          {user && (
            <div className="pt-4 border-t border-foreground/10">
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? 'Sair' : undefined}
              >
                <LogOut className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm">Sair</span>}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}