// src/components/header.tsx
import { Logo } from "./ui/logo";
import { Navbar } from "./ui/navbar";
import { getCurrentUser } from "@/lib/user";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-background border-b-2 border-black/50 py-2">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Logo />
          <Navbar user={user} />
        </div>
      </div>
    </header>
  );
}