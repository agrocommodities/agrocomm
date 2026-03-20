"use client";

import { useActionState } from "react";
import { addComment } from "@/actions/classifieds";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
  id: number;
  content: string;
  userName: string;
  userId: number;
  createdAt: string;
}

interface Props {
  classifiedId: number;
  comments: Comment[];
  isLoggedIn: boolean;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

export default function ClassifiedComments({
  classifiedId,
  comments,
  isLoggedIn,
}: Props) {
  const [state, formAction, isPending] = useActionState(addComment, null);

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        <MessageSquare className="w-4 h-4" />
        Comentários ({comments.length})
      </h2>

      {/* Comment form */}
      {isLoggedIn ? (
        <form action={formAction} className="mb-6">
          <input type="hidden" name="classifiedId" value={classifiedId} />
          {state?.error && (
            <p className="text-red-400 text-xs mb-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-green-400 text-xs mb-2">Comentário publicado!</p>
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
              disabled={isPending}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-white/40 mb-6">
          <a href="/auth/login" className="text-green-400 hover:underline">
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
                <span className="text-xs font-semibold text-white/70">
                  {comment.userName}
                </span>
                <span className="text-[10px] text-white/30">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-white/80">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
