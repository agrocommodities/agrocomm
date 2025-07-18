"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types";
import { logOut } from "@/actions";

export function UserMenu({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
  };

  return (
    <div className="relative">
      <button
        id="user-menu-button"
        aria-expanded="false"
        aria-haspopup="true"
        data-dropdown-toggle="user-menu"
        className="cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Image
          className="h-8 w-8 rounded-full"
          src={user.image || "/images/avatar.svg"}
          alt="User avatar"
          width={32}
          height={32}
        />
      </button>
      <div
        id="user-menu"
        className={`absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${
          isMenuOpen ? "block" : "hidden"
        }`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="user-menu-button"
      >
        <Link
          href="/perfil"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          role="menuitem"
        >
          Perfil
        </Link>
        <Link
          href="#"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          role="menuitem"
        >
          Ajustes
        </Link>
        <a
          className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 cursor-pointer"
          role="menuitem"
          onClick={handleLogout}
        >
          Sair
        </a>
      </div>
    </div>
  );
}
