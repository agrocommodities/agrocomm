import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-9xl font-bold text-white/10 select-none">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold mt-2">
        Página não encontrada
      </h1>
      <p className="text-white/60 mt-3 max-w-md">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-medium transition hover:bg-white/20"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
