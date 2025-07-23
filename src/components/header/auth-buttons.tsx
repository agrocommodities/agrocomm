import Link from "next/link";

interface AuthButtonsProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function AuthButtons({ isMobile = false, onItemClick }: AuthButtonsProps) {
  if (isMobile) {
    return (
      <div className="space-y-2">
        <Link
          href="/entrar"
          className="block w-full p-3 text-center rounded-lg border border-foreground/20 hover:bg-foreground/5 transition-colors"
          onClick={onItemClick}
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="block w-full p-3 text-center rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
          onClick={onItemClick}
        >
          Cadastrar
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-3">
      <Link
        href="/entrar"
        className="text-sm hover:text-foreground/80 transition-colors"
      >
        Entrar
      </Link>
      <Link
        href="/cadastro"
        className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
      >
        Cadastrar
      </Link>
    </div>
  );
}