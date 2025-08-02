// src/components/ui/logo.tsx
import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link 
      href="/"
      className="flex items-center gap-2 text-gray-200 transition hover:text-gray-500/75"
    >
      <Image
        src="/images/logo.svg"
        alt="AgroComm"
        className="h-8 w-8 md:h-11 md:w-11 border-3 border-white rounded-full"
        width={44}
        height={44}
      />
      <span className="text-white text-xl md:text-3xl font-bold">AgroComm</span>
    </Link>
  );
}