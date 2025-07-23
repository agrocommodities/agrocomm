import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prices } from "@/db/schema"
import Table from '@/components/ui/table';
import { formatarReais } from "@/lib/prices";
import { PriceVariation } from "@/components/ui/price-variation";
import ChartComponent from "@/components/prices/chart";

import type { Price } from "@/types";

export default async function Soja() {
  const soja: Price[] = []
  const data = await db.select().from(prices).where(eq(prices.commodity, "soja"));

  for (const item of data) {
    soja.push({
      id: item.id,
      state: item.state,
      price: item.price,
      variation: item.variation,
      createdAt: item.createdAt,
      commodity: item.commodity,
      city: item.city || "",
      source: item.source,
    });
  }


  if (!soja || soja.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum dado encontrado para soja.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-4">
        <Table>
          <thead className="text-sm uppercase bg-black/80">
            <tr>
              <th scope="col" className="px-6 py-3">Data</th>
              <th scope="col" className="px-6 py-3">Cidade</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Preço (R$)</th>
              <th scope="col" className="px-6 py-3">Variação</th>
            </tr>
          </thead>
          <tbody>
            {soja.map((item, index) => (
              <tr className="bg-white dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-black/30 border border-black/30 last:border-b-0" key={index}>
                <th
                  scope="row"
                  className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {item.createdAt &&
                    new Date(item.createdAt).toLocaleString("pt-BR", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: undefined,
                      minute: undefined,
                      second: undefined,
                    })
                  }
                </th>
                <td className="px-6 py-2">
                  {item.city || "N/A"}
                </td>
                <td className="px-6 py-2">
                  <div className="flex items-center">
                    <Image
                      src={`/images/bandeiras/square-rounded/${item.state.toLowerCase()}.svg`}
                      alt={item.state}
                      width={24}
                      height={24}
                      className="inline-block p-0 m-0 mr-2"
                    />
                    {item.state}
                  </div>
                </td>
                <td className="px-6 py-2">R$ {formatarReais(item.price)}</td>
                <td className="px-6 py-2">
                  <PriceVariation variation={item.variation || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="flex-1">
        <ChartComponent pricesData={soja} commodity="Soja" />
      </div>
    </div>
  );
}