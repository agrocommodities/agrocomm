import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-black/10 border-3 border-black/30 rounded-md">
      <Image
        className="h-auto max-w-full"
        src="/images/logo-site.svg"
        alt={process.env.NEXT_PUBLIC_APP_NAME!}
        width={800}
        height={200}
        priority
      />
      <div className="max-w-lg p-6">
        <h1 className="text-2xl font-bold mt-4">
          Página não encontrada
        </h1>
        <p className="text-gray-100 mt-2">
          A página que você está procurando não existe.
        </p>
        <Link href="/" className="inline-block mt-4 p-3 bg-black/50 rounded-md">
          Voltar
        </Link>
      </div>
    </div>
  );
}
