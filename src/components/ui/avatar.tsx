"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (file: File) => void;
}

export default function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onAvatarChange(file);
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
          className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <p className="text-sm text-gray-500">
        Clique no ícone para alterar a foto
      </p>
    </div>
  );
}