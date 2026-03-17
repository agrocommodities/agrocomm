"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("_sid");
  if (!id) {
    id =
      crypto.randomUUID?.() ??
      Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
    sessionStorage.setItem("_sid", id);
  }
  return id;
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    const sessionId = getSessionId();
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        sessionId,
      }),
    );
  }, [pathname]);

  return null;
}
