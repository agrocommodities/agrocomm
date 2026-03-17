"use client";

import { useState } from "react";
import { Link2, Check, Share2, X } from "lucide-react";

interface ShareSidebarProps {
  url: string;
  title: string;
}

export default function ShareSidebar({ url, title }: ShareSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Mobile floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden w-12 h-12 bg-green-600 hover:bg-green-500 rounded-full shadow-lg shadow-green-900/40 flex items-center justify-center transition-all active:scale-95"
        aria-label="Compartilhar"
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>

      {/* Mobile bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a2218] border-t border-white/10 rounded-t-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base">Compartilhar</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ShareButton
                onClick={copyLink}
                label={copied ? "Copiado!" : "Copiar link"}
                icon={
                  copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Link2 className="w-5 h-5" />
                  )
                }
              />
              <ShareLink
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                label="WhatsApp"
                icon={<WhatsAppIcon />}
                className="bg-green-600/10 border-green-600/20 text-green-400"
              />
              <ShareLink
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                label="X"
                icon={<XIcon />}
              />
              <ShareLink
                href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
                label="Telegram"
                icon={<TelegramIcon />}
                className="bg-sky-500/10 border-sky-500/20 text-sky-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col gap-2">
        <SidebarButton
          onClick={copyLink}
          tooltip={copied ? "Copiado!" : "Copiar link"}
          icon={
            copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Link2 className="w-4 h-4" />
            )
          }
        />
        <SidebarLink
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          tooltip="WhatsApp"
          icon={<WhatsAppIcon className="w-4 h-4" />}
          className="hover:bg-green-600/20 hover:text-green-400 hover:border-green-600/30"
        />
        <SidebarLink
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          tooltip="X"
          icon={<XIcon className="w-4 h-4" />}
        />
        <SidebarLink
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          tooltip="Telegram"
          icon={<TelegramIcon className="w-4 h-4" />}
          className="hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/30"
        />
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ShareButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function ShareLink({
  href,
  label,
  icon,
  className = "",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all ${className}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function SidebarButton({
  onClick,
  tooltip,
  icon,
}: {
  onClick: () => void;
  tooltip: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
    >
      {icon}
      <span className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-[#171717] border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {tooltip}
      </span>
    </button>
  );
}

function SidebarLink({
  href,
  tooltip,
  icon,
  className = "",
}: {
  href: string;
  tooltip: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltip}
      className={`group relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center ${className}`}
    >
      {icon}
      <span className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-[#171717] border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {tooltip}
      </span>
    </a>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="WhatsApp"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="X"
    >
      <title>X</title>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="Telegram"
    >
      <title>Telegram</title>
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
