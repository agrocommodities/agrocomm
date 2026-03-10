import Link from "next/link";
import { navLinks } from "../config";

export default function Navbar() {
  return (
    <div className="flex items-center gap-2">
      {navLinks.map((link) => (
        <Link key={link.name} href={link.href} className="flex items-center gap-2">
          {link.icon && <link.icon className="w-4 h-4" />}
          {link.name}
        </Link>
      ))}
    </div>    
  );
}