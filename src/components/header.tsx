// src/components/header.tsx
import { Logo } from "./ui/logo";
import { Navbar } from "./ui/navbar";
import { getCurrentUser } from "@/lib/user";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-black/50 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo sempre à esquerda */}
          <div className="flex-shrink-0">
            <Logo />
          </div>
          
          {/* Navbar ocupa o espaço restante */}
          <div className="flex-1">
            <Navbar user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}