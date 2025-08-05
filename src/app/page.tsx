import Image from "next/image";
import { Table } from "@/components/ui/table";
import { Plans } from "@/components/plans";
import { getPrices } from "@/actions/price";
import { formatCommodityName } from "@/lib/price";

export default async function Home() {
  const prices = await getPrices();

  return (
    <div className="flex items-center justify-center">
      <div>
        <div className="flex h-full items-center justify-center">
          <Image
            className="h-auto max-w-full"
            src="/images/logo-site.svg"
            alt={process.env.NEXT_PUBLIC_APP_NAME!}
            width={800}
            height={200}
            priority
          />
        </div>
        <section className="container mx-auto mt-8">
          <Plans />
        </section>
      </div>
    </div>
  );
}
