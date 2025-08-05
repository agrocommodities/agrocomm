import Image from "next/image";
import Link from "next/link";

export function PricesCard({ commodity }: { commodity?: string }) {
  let imageSrc, link, desc = "";

  switch (commodity) {
    case "soja":
      imageSrc = "https://cdn.agrocomm.com.br/images/bg/daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg";
      link = "/cotacoes/soja";
      desc = "Cotação da saca de soja";
      break;
    case "milho":
      imageSrc = "https://cdn.agrocomm.com.br/images/bg/adrian-infernus-BN6iQEVN0ZQ-unsplash.jpg";
      link = "/cotacoes/milho";
      desc = "Cotação da saca de milho";
      break;
    default:
      imageSrc = "https://cdn.agrocomm.com.br/images/bg/daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg";
      link = "/cotacoes/soja";
      desc = "Cotação da saca de soja";
  }

  return (
    <Link href={link} className="group relative block bg-black rounded-md">
      <Image
        alt=""
        src={imageSrc}
        className="rounded-md absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-50"
        width={600}
        height={600}
        priority
      />
      <div className="relative p-4 sm:p-6 lg:p-8">
        <p className="text-xl font-bold text-white sm:text-2xl">{commodity?.toUpperCase()}</p>
        <div className="mt-32 sm:mt-48 lg:mt-64">
          <div className="translate-y-8 transform opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-sm text-white">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
