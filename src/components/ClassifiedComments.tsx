"use client";

import {
  useActionState,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  addComment,
  editComment,
  deleteUserComment,
} from "@/actions/classifieds";
import { MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { io as socketIO, type Socket } from "socket.io-client";

interface Comment {
  id: number;
  content: string;
  userName: string;
  userId: number;
  createdAt: string;
  updatedAt: string | null;
}

interface Props {
  classifiedId: number;
  comments: Comment[];
  isLoggedIn: boolean;
  currentUserId?: number;
}

function timeAgo(dateStr: string) {
  // SQLite datetime('now') stores UTC without Z suffix
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
  if (days < 30) return `${days}d atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

export default function ClassifiedComments({
  classifiedId,
  comments: initialComments,
  isLoggedIn,
  currentUserId,
}: Props) {
  const [addState, addAction, isAdding] = useActionState(addComment, null);
  const [editState, editAction, isEditing] = useActionState(editComment, null);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Reset form on successful add
  useEffect(() => {
    if (addState?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [addState]);

  // Close edit mode on successful edit
  useEffect(() => {
    if (editState?.success) {
      setEditingId(null);
      setEditContent("");
    }
  }, [editState]);

  // Socket.IO: real-time comment updates
  useEffect(() => {
    const socket = socketIO({ path: "/api/socketio" });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe:classified", classifiedId);
    });

    socket.on("comment:new", (data: Comment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === data.id)) return prev;
        return [data, ...prev];
      });
    });

    socket.on(
      "comment:updated",
      (data: { id: number; content: string; updatedAt: string }) => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? { ...c, content: data.content, updatedAt: data.updatedAt }
              : c,
          ),
        );
      },
    );

    socket.on("comment:deleted", (data: { id: number }) => {
      setComments((prev) => prev.filter((c) => c.id !== data.id));
    });

    return () => {
      socket.emit("unsubscribe:classified", classifiedId);
      socket.disconnect();
    };
  }, [classifiedId]);

  const handleDelete = useCallback(async (commentId: number) => {
    const result = await deleteUserComment(commentId);
    if (result.error) return;
    // Optimistic removal (socket will also fire)
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const startEditing = useCallback((comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }, []);

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        <MessageSquare className="w-4 h-4" />
        Comentários ({comments.length})
      </h2>

      {/* Comment form */}
      {isLoggedIn ? (
        <form ref={formRef} action={addAction} className="mb-6">
          <input type="hidden" name="classifiedId" value={classifiedId} />
          {addState?.error && (
            <p className="text-red-400 text-xs mb-2">{addState.error}</p>
          )}
          <div className="flex gap-2">
            <input
              name="content"
              type="text"
              placeholder="Escreva um comentário..."
              maxLength={2000}
              required
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <button
              type="submit"
              disabled={isAdding}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-white/40 mb-6">
          <a href="/login" className="text-green-400 hover:underline">
            Faça login
          </a>{" "}
          para comentar.
        </p>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-4">
          Nenhum comentário ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white/70">
                    {comment.userName}
                  </span>
                  {comment.updatedAt && (
                    <span className="text-[10px] text-white/25 italic">
                      (editado)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">
                    {timeAgo(comment.updatedAt || comment.createdAt)}
                  </span>
                  {currentUserId === comment.userId && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(comment)}
                        className="p-1 hover:bg-white/10 rounded transition"
                        title="Editar"
                      >
                        <Pencil className="w-3 h-3 text-white/30 hover:text-white/60" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 hover:bg-white/10 rounded transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingId === comment.id ? (
                <form action={editAction} className="flex gap-2 mt-1">
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input
                    name="content"
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={2000}
                    required
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
                  />
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="p-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg transition-colors"
                    title="Salvar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {editState?.error && (
                    <p className="text-red-400 text-xs self-center">
                      {editState.error}
                    </p>
                  )}
                </form>
              ) : (
                <p className="text-sm text-white/80">{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
