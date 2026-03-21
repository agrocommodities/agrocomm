"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUserNotifications,
} from "@/actions/classifieds";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { io as socketIO } from "socket.io-client";

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: number;
  link: string | null;
  createdAt: string;
}

export default function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = socketIO({ path: "/api/socketio" });

    socket.on("connect", () => {
      socket.emit("subscribe:notifications");
    });

    socket.on("notification:new", () => {
      startTransition(async () => {
        const updated = await getUserNotifications();
        setNotifications(updated);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleMarkRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)),
    );
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  function timeAgo(dateStr: string) {
    const normalized = dateStr.includes("T")
      ? dateStr
      : `${dateStr.replace(" ", "T")}Z`;
    const now = Date.now();
    const date = new Date(normalized).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  }

  return (
    <div>
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-white/50">
            {unreadCount} não lida{unreadCount !== 1 && "s"}
          </p>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white/3 border rounded-xl px-4 py-3 transition ${
                n.read === 0
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {n.read === 0 && (
                      <span className="w-2 h-2 bg-green-400 rounded-full shrink-0" />
                    )}
                    <h3 className="text-sm font-semibold line-clamp-1">
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 mb-1">{n.message}</p>
                  <span className="text-[10px] text-white/30">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition"
                      title="Abrir"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                    </Link>
                  )}
                  {n.read === 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition"
                      title="Marcar como lida"
                    >
                      <Check className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
