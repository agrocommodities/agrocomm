"use client";

import { useEffect } from "react";

export default function DebugSession() {
  useEffect(() => {
    // ✅ Limpar todos os cookies de sessão inválidos
    document.cookie = "session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log("Cookies limpos");
  }, []);

  return null;
}