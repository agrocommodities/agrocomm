import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { navLinks } from "@/config";
import { logoutAction } from "@/actions/auth";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky z-50 top-0 bg-alt-background border-b border-white/10">
      {/* Top row: logo + user actions */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold shrink-0"
        >
          <Image src="/images/logo.svg" alt="AgroComm" width={36} height={36} />
          AgroComm
        </Link>

        {/* Desktop: nav links inline */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium hover:text-green-300 transition-colors"
            >
              {l.name}
            </Link>
          ))}
        </nav>

        {/* User actions (desktop + mobile) */}
        <div className="flex items-center gap-4 shrink-0">
          {session ? (
            <>
              {session.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/ajustes"
                className="text-sm font-medium hover:text-green-300 transition-colors"
              >
                Ajustes
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium hover:text-green-300 transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium hover:text-green-300 transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile: horizontal scrollable nav (hidden scrollbar) */}
      <nav className="md:hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 px-4 pb-3 min-w-max">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium whitespace-nowrap hover:text-green-300 transition-colors"
            >
              {l.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
