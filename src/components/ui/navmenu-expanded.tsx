"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationMenuProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

const navigationItems = [
  { href: "/", label: "Início" },
  { href: "/soja", label: "Soja" },
  { href: "/milho", label: "Milho" },
  { href: "/boi", label: "Boi Gordo" },
  { href: "/vaca", label: "Vaca Gorda" },
  { href: "/noticias", label: "Notícias" },
  { href: "/analises", label: "Análises" },
];

export default function NavigationMenu({ isOpen = false, onToggle, isMobile = false }: NavigationMenuProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile && onToggle) {
      onToggle(); // Fecha o menu mobile ao clicar em um link
    }
  };

  if (isMobile) {
    // Versão mobile - lista vertical
    return (
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  // Versão desktop - menu horizontal
  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-foreground/10 text-foreground border-b-2 border-foreground/30"
                : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}