"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Radio } from "lucide-react";

export default function OnlineUsersWidget() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    const socket = io({ path: "/api/socketio", addTrailingSlash: false });

    socket.on("connect", () => {
      socket.emit("subscribe:admin_stats");
    });

    socket.on("stats:online_count", (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      socket.emit("unsubscribe:admin_stats");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className="bg-green-500/10 p-2 rounded-lg">
        <Radio className="w-5 h-5 text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50">Online agora</p>
        {onlineCount === null ? (
          <div className="h-7 w-16 bg-white/10 rounded animate-pulse mt-0.5" />
        ) : (
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <span className="text-xs text-white/40">
              {onlineCount === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
        )}
      </div>
      <span className="flex items-center gap-1.5 text-xs text-green-400 shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Tempo real
      </span>
    </div>
  );
}
