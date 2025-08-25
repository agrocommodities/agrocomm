// src/components/admin/post-edit-modal.tsx
"use client";

import { useState } from "react";

interface PostEditModalProps {
  post: {
    id: number;
    content: string;
    visibility: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function PostEditModal({ post, onClose, onSuccess }: PostEditModalProps) {
  const [content, setContent] = useState(post.content || "");
  const [visibility, setVisibility] = useState(post.visibility);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, visibility })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert("Erro: " + error.error);
      }
    } catch (error) {
      console.error("Erro ao editar post:", error);
      alert("Erro ao editar post");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Editar Post</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full p-3 bg-white/10 border border-white/20 rounded text-white resize-none"
              placeholder="Conteúdo do post..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Visibilidade</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
            >
              <option value="public" className="bg-gray-800">Público</option>
              <option value="friends" className="bg-gray-800">Amigos</option>
              <option value="private" className="bg-gray-800">Privado</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}