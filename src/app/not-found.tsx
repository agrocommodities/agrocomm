import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full md:w-xl rounded-lg p-5 border-2 border-black/50 text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-lg">
          A página que você está procurando não existe ou foi movida.<br />
          <Link href="/" className="inline-block rounded-md p-3 border-2 border-black/50">
            Voltar
          </Link>
        </p>
      </div>
    </div>
  );
}
