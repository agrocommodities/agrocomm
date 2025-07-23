"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/config";

interface NavigationMenuProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export default function NavigationMenu({ onToggle, isMobile = false }: NavigationMenuProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden md:flex items-center space-x-1 bg-black/20 rounded-full px-2 py-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-foreground/20 text-foreground shadow-sm"
                : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            <span className="hidden lg:block">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}