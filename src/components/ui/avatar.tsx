// src/components/ui/avatar.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/actions";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange?: (avatarUrl: string) => void;
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarChange
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação no frontend
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de arquivo não permitido. Use JPG, PNG ou WebP.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Mostrar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload do arquivo
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatar(formData);

      if (result.error) {
        setError(result.error);
        setPreview(null);
      } else if (result.success && result.avatar) {
        onAvatarChange?.(result.avatar);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Erro ao fazer upload da imagem");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          <Image
            src={preview || currentAvatar || "/images/avatar.svg"}
            alt="Avatar"
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-black/90 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      <div className="text-center">
        <p className="text-sm text-gray-500">
          {uploading ? "Enviando..." : "Clique no ícone para alterar a foto"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG ou WebP - máximo 5MB
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}