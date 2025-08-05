import Image from "next/image";
import { Plans } from "@/components/plans";
import { getPrices } from "@/actions/price";

export default async function Home() {
  const prices = await getPrices();

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl">
        <div className="flex h-full items-center justify-center mb-8">
          <Image
            className="h-auto max-w-full"
            src="/images/logo-site.svg"
            alt={process.env.NEXT_PUBLIC_APP_NAME!}
            width={800}
            height={200}
            priority
          />
        </div>
        <section className="w-full">
          <Plans />
        </section>
      </div>
    </div>
  );
}