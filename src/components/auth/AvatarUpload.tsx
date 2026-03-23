"use client";

import { useRef, useState, useActionState, useTransition } from "react";
import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import {
  uploadAvatarAction,
  resetAvatarAction,
  type AvatarState,
} from "@/actions/auth";

interface Props {
  currentAvatarUrl: string | null;
  userName: string;
}

export default function AvatarUpload({ currentAvatarUrl, userName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploadState, uploadAction, uploading] = useActionState(
    async (_prev: AvatarState, formData: FormData) => {
      const result = await uploadAvatarAction(_prev, formData);
      if (result?.success && result.avatarUrl !== undefined) {
        setAvatarUrl(result.avatarUrl);
      }
      return result;
    },
    null,
  );
  const [resetting, startReset] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = userName.charAt(0).toUpperCase();
  const pending = uploading || resetting;

  function handleReset() {
    setResetError(null);
    startReset(async () => {
      const result = await resetAvatarAction();
      if (result?.error) {
        setResetError(result.error);
      } else {
        setAvatarUrl(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              key={avatarUrl}
              unoptimized
            />
          ) : (
            <span className="text-3xl font-bold text-white select-none">
              {initial}
            </span>
          )}
        </div>

        {/* Camera overlay */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Upload form */}
      <form action={uploadAction} className="flex flex-col items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              e.target.form?.requestSubmit();
            }
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Enviando…" : "Alterar foto"}
          </button>

          {avatarUrl && (
            <>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={handleReset}
                disabled={pending}
                className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                {resetting ? "Removendo…" : "Remover"}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Error messages */}
      {(uploadState?.error || resetError) && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {uploadState?.error || resetError}
        </p>
      )}

      <p className="text-xs text-white/30">JPG, PNG ou WebP. Máximo 2 MB.</p>
    </div>
  );
}
