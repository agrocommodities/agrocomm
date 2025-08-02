import Link from "next/link";
import { navLinks } from "@/config";

export function Navbar() {
  return (
    <nav aria-label="Global">
      <ul className="md:flex items-center gap-x-4">
        {navLinks.map((link) => (
          <li 
            key={link.name}
            className="transition duration-500 bg-black/30 hover:bg-black/45 p-4 md:px-2 md:py-2 m-2 md:m-0 rounded-lg md:rounded-md"
          >
            <Link
              className="text-white font-semibold w-full md:w-auto md:px-2"
              href={link.href}
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
