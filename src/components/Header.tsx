import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";

export default function Header() {
  return (
    <header className="sticky z-50 top-0 p-4 bg-background border-b-3 border-alt-background">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/images/logo.svg" alt="AgroComm" width={38} height={38} />
          AgroComm
        </Link>
        <Navbar />
      </div>
    </header>
  );
}
