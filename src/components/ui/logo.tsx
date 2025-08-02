import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center">
      <Link 
        href="/"
        className="flex items-center gap-2 text-gray-200 transition hover:text-gray-500/75"
      >
        <Image
          src="/images/logo.svg"
          alt="AgroComm"
          className="h-11 w-auto border-3 border-white rounded-full"
          width={32}
          height={32}
        />
        <span className="text-white text-3xl font-bold">AgroComm</span>
      </Link>
    </div>
  );
}
