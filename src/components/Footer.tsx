import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-alt-background text-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
        <div className="text-white/50">
          &copy; {new Date().getFullYear()} AgroComm
        </div>
        <nav className="flex items-center gap-4 flex-wrap">
          <Link
            href="/ajuda"
            className="text-white/40 hover:text-green-400 transition-colors text-xs"
          >
            Ajuda
          </Link>
          <Link
            href="/sobre"
            className="text-white/40 hover:text-green-400 transition-colors text-xs"
          >
            Sobre
          </Link>
          <Link
            href="/suporte"
            className="text-white/40 hover:text-green-400 transition-colors text-xs"
          >
            Suporte
          </Link>
          <Link
            href="/termos"
            className="text-white/40 hover:text-green-400 transition-colors text-xs"
          >
            Termos
          </Link>
          <Link
            href="/privacidade"
            className="text-white/40 hover:text-green-400 transition-colors text-xs"
          >
            Privacidade
          </Link>
        </nav>
      </div>
    </footer>
  );
}
