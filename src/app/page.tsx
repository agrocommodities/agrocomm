import Link from "next/link";
// import Image from "next/image";

export default function Home() {
  return (
    <div className="flex gap-4 items-center flex-col sm:flex-row">
      <Link
        className="rounded-md border-2 border-solid border-transparent transition-colors flex items-center justify-center bg-foreground/80 text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
        href="/cadastro"
      >
        Cadastro
      </Link>
      <a
        className="rounded-md border-2 border-solid border-black/[.18] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
        href="/entrar"
      >
        Login
      </a>
    </div>
  );
}
