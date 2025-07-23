// src/components/header/mobile-menu.tsx
"use client";

import { X } from "lucide-react";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { StateSelector } from "@/components/ui/state-selector";
import { UserMenu } from "@/components/ui/user-menu";
import { AuthButtons } from "./auth-buttons";
import type { UserWithProfile } from "@/types";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithProfile | null;
}

export function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-background border-l border-foreground/10 z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-foreground/10">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Navegação */}
          <div>
            <h3 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-3">
              Navegação
            </h3>
            <NavigationMenu isMobile onItemClick={onClose} />
          </div>

          {/* Estado */}
          <div>
            <StateSelector isMobile />
          </div>

          {/* Usuário */}
          <div>
            <h3 className="text-sm font-medium text-foreground/60 uppercase tracking-wider mb-3">
              {user ? "Conta" : "Acesso"}
            </h3>
            {user ? (
              <UserMenu user={user} isMobile />
            ) : (
              <AuthButtons isMobile onItemClick={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}