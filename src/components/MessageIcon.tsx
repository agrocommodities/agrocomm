"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { io as socketIO } from "socket.io-client";
import { MessageSquare } from "lucide-react";
import { getTotalUnread } from "@/actions/messages";

interface Props {
  userId: number;
  initialUnread: number;
}

export default function MessageIcon({ userId, initialUnread }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);

  useEffect(() => {
    const socket = socketIO({ path: "/api/socketio" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:user", userId);
    });

    socket.on("chat:unread", (count: number) => {
      setUnread(count);
    });

    // Refresh count when page becomes visible again
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        getTotalUnread().then(setUnread);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      socket.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);

  return (
    <Link
      href="/mensagens"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
      aria-label="Mensagens"
    >
      <MessageSquare className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
