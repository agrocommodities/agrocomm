"use client";
import LogOut from "@/components/auth/logout-btn";

// import Link from "next/link";
// import Image from "next/image";
// import { logOut } from "@/actions";
// import { useState, useEffect } from "react";
// import { usePathname } from "next/navigation";

// // Como o componente agora é client-side, precisamos passar o usuário como prop
interface NavbarProps {
  user: {
    id: number;
    email: string;
    role: string;
    name?: string;
    username?: string;
  } | null;
}

export default function Account({ user }: NavbarProps) {
  if (!user) {
    return <div>Conta não encontrada</div>;
  }

  return (
    <>
      <span className="text-sm text-foreground/60">
        Olá, {user.name || user.email}
      </span>
      {user.role === "admin" && <>Admin</>}
      <LogOut className="text-sm text-red-600 hover:text-red-700 transition-colors cursor-pointer">
        Sair
      </LogOut>
    </>
  );
}
