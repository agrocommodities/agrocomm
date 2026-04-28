"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { io as socketIO } from "socket.io-client";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  getOrCreateConversation,
} from "@/actions/messages";
import type { ConversationSummary, Message } from "@/actions/messages";
import { renderChatMarkdown } from "@/lib/markdown";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  ExternalLink,
  LayoutList,
  Bold,
  Italic,
  Strikethrough,
} from "lucide-react";

interface Props {
  initialConversations: ConversationSummary[];
  userId: number;
}

/** Wrap selected text (or insert markers at cursor) in a textarea. */
function wrapSelection(
  el: HTMLTextAreaElement,
  marker: string,
  value: string,
  setValue: (v: string) => void,
) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end);
  const newValue =
    value.slice(0, start) + marker + selected + marker + value.slice(end);
  setValue(newValue);
  requestAnimationFrame(() => {
    el.focus();
    if (selected) {
      el.setSelectionRange(start + marker.length, end + marker.length);
    } else {
      const pos = start + marker.length;
      el.setSelectionRange(pos, pos);
    }
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function UserAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const classes = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <span
      className={`${classes} flex items-center justify-center rounded-full bg-green-700 text-white font-bold shrink-0 overflow-hidden`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function MessagesClient({
  initialConversations,
  userId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);
  const pendingClassifiedSlugRef = useRef<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);
  const activeConvIdRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "";
    };
  }, []);

  useEffect(() => {
    const classifiedSlug = searchParams.get("classified");
    const prefilledMessage = searchParams.get("message");
    if (classifiedSlug) {
      pendingClassifiedSlugRef.current = classifiedSlug;
      pendingMessageRef.current = prefilledMessage;
    }
  }, [searchParams]);

  const openConversation = useCallback(async (convId: number) => {
    setActiveConvId(convId);
    activeConvIdRef.current = convId;
    setMobileView("chat");
    setLoadingMessages(true);

    try {
      const msgs = await getMessages(convId);
      setChatMessages(msgs);
      await markConversationRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const slug = pendingClassifiedSlugRef.current;
    if (!slug) return;

    startTransition(async () => {
      const result = await getOrCreateConversation(slug);
      if (result.error || result.conversationId === undefined) {
        if (result.error) console.error(result.error);
        return;
      }
      const convId = result.conversationId;

      const updated = await getConversations();
      setConversations(updated);

      await openConversation(convId);

      if (pendingMessageRef.current) {
        setInputValue(pendingMessageRef.current);
        inputRef.current?.focus();
      }

      pendingClassifiedSlugRef.current = null;
      pendingMessageRef.current = null;
      router.replace("/mensagens", { scroll: false });
    });
  }, [openConversation, router]);

  useEffect(() => {
    const socket = socketIO({ path: "/api/socketio" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:user", userId);
    });

    socket.on("chat:message", (msg: Message) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount:
                  msg.senderId !== userId &&
                  msg.conversationId !== activeConvIdRef.current
                    ? c.unreadCount + 1
                    : c.unreadCount,
              }
            : c,
        ),
      );

      if (
        msg.senderId !== userId &&
        msg.conversationId === activeConvIdRef.current
      ) {
        startTransition(async () => {
          await markConversationRead(msg.conversationId);
        });
      }
    });

    socket.on("chat:unread", () => {
      startTransition(async () => {
        const updated = await getConversations();
        setConversations(updated);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (activeConvId !== null) {
      socket.emit("chat:join", activeConvId);
    }

    return () => {
      if (activeConvId !== null) {
        socket.emit("chat:leave", activeConvId);
      }
    };
  }, [activeConvId]);

  const lastMessageId = chatMessages[chatMessages.length - 1]?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: lastMessageId triggers scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  async function handleSend() {
    if (!activeConvId || !inputValue.trim() || isPending) return;
    const text = inputValue.trim();
    setInputValue("");

    startTransition(async () => {
      try {
        const msg = await sendMessage(activeConvId, text);
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
              : c,
          ),
        );
      } catch (err) {
        console.error(err);
        setInputValue(text);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = search
    ? conversations.filter(
        (c) =>
          c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
          c.classifiedTitle?.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  // Group conversations by otherUserId so the same seller doesn't appear multiple times
  const groupedConversations = filteredConversations.reduce<
    {
      otherUserId: number;
      otherUserName: string;
      otherUserAvatarUrl: string | null;
      latestConvId: number;
      lastMessage: string | null;
      lastMessageAt: string | null;
      totalUnread: number;
      classifiedTitle: string | null;
      classifiedCount: number;
    }[]
  >((acc, conv) => {
    const existing = acc.find((g) => g.otherUserId === conv.otherUserId);
    if (existing) {
      existing.totalUnread += conv.unreadCount;
      existing.classifiedCount += 1;
      // Keep the most recent conversation as the "active" one for this group
      if (
        !existing.lastMessageAt ||
        (conv.lastMessageAt && conv.lastMessageAt > existing.lastMessageAt)
      ) {
        existing.latestConvId = conv.id;
        existing.lastMessage = conv.lastMessage;
        existing.lastMessageAt = conv.lastMessageAt;
        existing.classifiedTitle = conv.classifiedTitle;
      }
      return acc;
    }
    acc.push({
      otherUserId: conv.otherUserId,
      otherUserName: conv.otherUserName,
      otherUserAvatarUrl: conv.otherUserAvatarUrl,
      latestConvId: conv.id,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      totalUnread: conv.unreadCount,
      classifiedTitle: conv.classifiedTitle,
      classifiedCount: 1,
    });
    return acc;
  }, []);

  return (
    <div className="flex h-[calc(100dvh-92px)] md:h-[calc(100dvh-60px)] min-h-0">
      <aside
        className={`
          flex flex-col w-full md:w-80 shrink-0 border-r border-white/10
          bg-[#2d3a28]
          ${mobileView === "chat" ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="px-4 py-4 border-b border-white/10 shrink-0">
          <h1 className="text-base font-semibold mb-3">Mensagens</h1>
          <input
            type="text"
            placeholder="Buscar conversa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {groupedConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <MessageSquare className="w-10 h-10 text-white/20" />
              <p className="text-sm text-white/40">
                {search
                  ? "Nenhuma conversa encontrada"
                  : "Nenhuma conversa ainda"}
              </p>
              {!search && (
                <Link
                  href="/classificados"
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  Explorar anúncios →
                </Link>
              )}
            </div>
          ) : (
            groupedConversations.map((group) => (
              <button
                key={group.otherUserId}
                type="button"
                onClick={() => openConversation(group.latestConvId)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 cursor-pointer ${
                  activeConvId === group.latestConvId ||
                  conversations.some(
                    (c) =>
                      c.otherUserId === group.otherUserId &&
                      c.id === activeConvId,
                  )
                    ? "bg-white/10"
                    : ""
                }`}
              >
                <UserAvatar
                  name={group.otherUserName}
                  avatarUrl={group.otherUserAvatarUrl}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {group.otherUserName}
                    </span>
                    <span className="text-xs text-white/40 shrink-0">
                      {group.lastMessageAt
                        ? formatTime(group.lastMessageAt)
                        : ""}
                    </span>
                  </div>
                  {group.classifiedTitle && (
                    <p className="text-xs text-green-400 truncate">
                      {group.classifiedTitle}
                      {group.classifiedCount > 1 && (
                        <span className="text-white/30 ml-1">
                          +{group.classifiedCount - 1}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {group.lastMessage ?? "Sem mensagens"}
                  </p>
                </div>
                {group.totalUnread > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold mt-0.5">
                    {group.totalUnread > 9 ? "9+" : group.totalUnread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <Link
            href="/classificados"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors"
          >
            <LayoutList className="w-4 h-4" />
            Nova conversa
          </Link>
        </div>
      </aside>

      <section
        className={`
          flex-1 flex flex-col min-w-0
          ${mobileView === "sidebar" ? "hidden md:flex" : "flex"}
        `}
      >
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#2d3a28] shrink-0">
              <button
                type="button"
                onClick={() => setMobileView("sidebar")}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserAvatar
                name={activeConv.otherUserName}
                avatarUrl={activeConv.otherUserAvatarUrl}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {activeConv.otherUserName}
                </p>
                {activeConv.classifiedTitle && activeConv.classifiedSlug && (
                  <Link
                    href={`/classificados/${activeConv.classifiedSlug}`}
                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 w-fit"
                  >
                    {activeConv.classifiedTitle}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <MessageSquare className="w-8 h-8 text-white/20" />
                  <p className="text-sm text-white/40">
                    Nenhuma mensagem ainda. Diga olá!
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && (
                        <UserAvatar
                          name={msg.senderName}
                          avatarUrl={null}
                          size="sm"
                        />
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMine
                            ? "bg-green-700 text-white rounded-br-sm ml-2"
                            : "bg-white/10 text-white rounded-bl-sm ml-2"
                        }`}
                      >
                        <p
                          // renderChatMarkdown escapes HTML before applying markdown — safe
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by renderChatMarkdown
                          dangerouslySetInnerHTML={{
                            __html: renderChatMarkdown(msg.content),
                          }}
                          className="break-words [&_a]:underline [&_a]:text-green-300 [&_a]:hover:opacity-80 [&_del]:opacity-70 [&_code]:bg-white/20 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono"
                        />
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-white/60" : "text-white/40"
                          } text-right`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pt-2 pb-3 border-t border-white/10 bg-[#2d3a28] shrink-0">
              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 mb-1.5">
                {(
                  [
                    { icon: Bold, marker: "*", title: "Negrito" },
                    { icon: Italic, marker: "_", title: "Itálico" },
                    { icon: Strikethrough, marker: "~", title: "Tachado" },
                  ] as const
                ).map(({ icon: Icon, marker, title }) => (
                  <button
                    key={marker}
                    type="button"
                    title={title}
                    onMouseDown={(e) => {
                      // prevent textarea blur
                      e.preventDefault();
                      if (inputRef.current) {
                        wrapSelection(
                          inputRef.current,
                          marker,
                          inputValue,
                          setInputValue,
                        );
                      }
                    }}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white/80 cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
                <span className="ml-2 text-[10px] text-white/25 select-none hidden sm:block">
                  *negrito* · _itálico_ · ~tachado~
                </span>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem…"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-green-500/50 resize-none max-h-32 overflow-y-auto"
                  style={{ minHeight: "44px" }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isPending}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <MessageSquare className="w-16 h-16 text-white/10" />
            <div>
              <p className="text-white/60 font-medium">
                Selecione uma conversa
              </p>
              <p className="text-sm text-white/30 mt-1">
                ou clique em &quot;Nova conversa&quot; para começar
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
