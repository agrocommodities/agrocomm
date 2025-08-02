import { Logo } from "./ui/logo";
import { Navbar } from "./navbar";

export async function Header() {
  return (
    <header className="bg-background border-b-2 border-black/50 p-2">
      <div className="container mx-auto">
        <div className="md:flex items-center justify-between space-y-5 md:space-y-0">
          <Logo />
          <Navbar />
        </div>
      </div>
    </header>
  );
}