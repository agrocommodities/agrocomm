"use client";

import Link from "next/link";
import Image from "next/image";
import { logOut } from "@/actions";
import type { User } from "@/types";

interface UserMenuProps {
  user: User;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function UserMenu({ user, isOpen = false, onToggle }: UserMenuProps) {
  const handleLogout = async () => {
    await logOut();
  };

  const handleMenuItemClick = () => {
    onToggle?.(); // Fecha o menu após clicar em um item
  };

  return (
    <div className="relative w-8 h-8">
      <button
        onClick={onToggle}
        className="group relative flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full transition-all duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Container do Avatar com borda responsiva */}
        <div className="relative w-8 h-8">
          {/* Borda externa */}
          <div className="absolute inset-0 rounded-full border border-white/30 group-hover:border-white/50 transition-colors duration-200"></div>

          {/* Borda interna (opcional para mais destaque) */}
          {/* <div className="absolute inset-[1px] rounded-full border border-background/20"></div> */}

          {/* Avatar */}
          <div className="absolute inset-[2px] rounded-full overflow-hidden bg-background/10">
            <Image
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              src={user?.profile?.avatar || "/images/avatar.svg"}
              alt="User avatar"
              width={44} // Tamanho maior para melhor qualidade
              height={44}
              priority
            />
          </div>

          {/* Indicador de status online (opcional) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
        </div>
      </button>
      <div
        id="user-menu"
        className={`
          absolute right-0 mt-2 w-40 rounded-md shadow-lg 
          py-1 bg-white ring-1 ring-black ring-opacity-5 
          focus:outline-none ${isOpen ? "block" : "hidden"}
        `}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="user-menu-button"
      >
        <Link
          href="/ajustes"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          role="menuitem"
          onClick={handleMenuItemClick}
        >
          Ajustes
        </Link>
        <a
          className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 cursor-pointer"
          role="menuitem"
          onClick={() => {
            handleMenuItemClick();
            handleLogout();
          }}
        >
          Sair
        </a>
      </div>
    </div>
  );
}
