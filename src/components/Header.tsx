import Link from "next/link";
import Image from "next/image";
import HeaderInner from "./HeaderInner";
import { getSession } from "@/lib/auth";
import { navLinks } from "@/config";

export default async function Header() {
  const session = await getSession();
  const links = navLinks.map((l) => ({ name: l.name, href: l.href }));

  return (
    <header className="sticky z-50 top-0 bg-alt-background border-b border-white/10">
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold shrink-0"
        >
          <Image src="/images/logo.svg" alt="AgroComm" width={36} height={36} />
          AgroComm
        </Link>

        {session && (
          <span className="hidden md:block text-xs text-white/50 truncate">
            Olá, {session.name.split(" ")[0]}
          </span>
        )}

        <HeaderInner session={session} links={links} />
      </div>
    </header>
  );
}
