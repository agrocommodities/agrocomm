// src/components/ui/user-menu.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { User, Trophy, Settings, LogOut, ChevronDown } from "lucide-react";
import { logOut } from "@/actions";
import type { User as UserType } from "@/types";

interface UserMenuProps {
  user: UserType;
  isMobile?: boolean;
}

export function UserMenu({ user, isMobile = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logOut();
  };

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-foreground/5 rounded-lg">
          <Image
            className="w-10 h-10 rounded-full object-cover border-2 border-foreground/20"
            src={user?.profile?.avatar || "/images/avatar.svg"}
            alt="Avatar do usuário"
            width={40}
            height={40}
          />
          <div className="flex-1">
            <p className="font-medium text-sm">{user.profile?.name || user.email}</p>
            <p className="text-xs text-foreground/60">{user.role}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Link
            href="/assinaturas"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-foreground/5 transition-colors"
            onClick={handleMenuItemClick}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm">Assinaturas</span>
          </Link>
          <Link
            href="/ajustes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-foreground/5 transition-colors"
            onClick={handleMenuItemClick}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Ajustes</span>
          </Link>          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-foreground/5 transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative">
          <Image
            className="w-8 h-8 rounded-full object-cover border border-foreground/20"
            src={user?.profile?.avatar || "/images/avatar.svg"}
            alt="Avatar do usuário"
            width={32}
            height={32}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-foreground/10 rounded-lg shadow-lg py-2 z-50">
          {/* Header do menu */}
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="font-medium text-sm">{user.profile?.name || user.email}</p>
            <p className="text-xs text-foreground/60">{user.email}</p>
          </div>

          {/* Items do menu */}
          <div className="py-1">
            <Link
              href="/assinaturas"
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
              onClick={handleMenuItemClick}
            >
              <Trophy className="w-4 h-4" />
              Assinaturas
            </Link>            
            <Link
              href="/ajustes"
              className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
              onClick={handleMenuItemClick}
            >
              <Settings className="w-4 h-4" />
              Ajustes
            </Link>            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}