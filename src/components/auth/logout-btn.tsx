"use client";

import { logOut } from "@/actions";

export default function LogOut({ label = "Sair", ...props }) {
  // const handleLogout = async () => {
  //   await logOut();
  // };

  // async function handleLogout() {
  //   'use server';
  //   await logOut();
  // }

  return (
    <button
      onClick={async () => await logOut()}
      // className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
      {...props}
    >
      {label}
    </button>
  );
}
