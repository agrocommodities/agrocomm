import Link from "next/link";
import Image from "next/image";
import { getSession, getUserPermissions } from "@/lib/auth";
import { getUserSubscription } from "@/actions/subscriptions";
import { navLinks } from "@/config";
import UserMenu from "@/components/UserMenu";
import NavDropdown from "@/components/NavDropdown";
import MobileNavDropdown from "@/components/MobileNavDropdown";
import { Crown } from "lucide-react";

export default async function Header() {
  const session = await getSession();
  const [hasAdminAccess, subscription] = await Promise.all([
    session
      ? getUserPermissions(session.userId).then((p) => p.has("admin.access"))
      : Promise.resolve(false),
    getUserSubscription(),
  ]);

  const planSlug = subscription?.planSlug;
  const showSubscribeLink = planSlug !== "ouro";
  const subscribeLinkLabel =
    planSlug === "bronze" || planSlug === "prata" ? "Upgrade" : "Assine";

  return (
    <header className="sticky z-50 top-0 bg-alt-background">
      {/* Top row: logo + user actions */}
      <div className="flex items-center justify-between gap-2 md:gap-6 px-2 md:px-0 py-3 max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold shrink-0"
        >
          <Image src="/images/logo.svg" alt="AgroComm" width={36} height={36} />
          AgroComm
        </Link>

        {/* Desktop: nav links inline */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          {navLinks.map((l) =>
            l.children ? (
              <NavDropdown key={l.href} link={l} />
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium hover:text-green-300 transition-colors"
              >
                {l.name}
              </Link>
            ),
          )}
          {showSubscribeLink && (
            <Link
              href="/planos"
              className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              {subscribeLinkLabel}
            </Link>
          )}
        </nav>

        {/* User menu */}
        <div className="shrink-0">
          <UserMenu session={session} hasAdminAccess={hasAdminAccess} />
        </div>
      </div>

      {/* Mobile: horizontal scrollable nav (hidden scrollbar) */}
      <nav className="md:hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-between gap-4 px-4 pb-3 min-w-full w-max">
          {navLinks.map((l) =>
            l.children ? (
              <MobileNavDropdown key={l.href} link={l} />
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium whitespace-nowrap hover:text-green-300 transition-colors"
              >
                {l.name}
              </Link>
            ),
          )}
          {showSubscribeLink && (
            <Link
              href="/planos"
              className="text-sm font-semibold whitespace-nowrap text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              {subscribeLinkLabel}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
