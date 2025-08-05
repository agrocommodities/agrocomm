import Image from "next/image";
import { Table } from "@/components/ui/table";
import { getPrices } from "@/actions/price";
import { formatCommodityName } from "@/lib/price";

export default async function Home() {
  const prices = await getPrices();

  return (
    <div className="flex items-center justify-center">
      <div>
        {prices && prices.length > 0 && (
          <div>
            <h1 className="text-2xl font-bold text-center mt-4">
              Últimas cotações
            </h1>
            <Table>
              <thead className="ltr:text-left rtl:text-right">
                <tr className="*:font-medium">
                  <th className="px-3 py-2 whitespace-nowrap">Data</th>
                  <th className="px-3 py-2 whitespace-nowrap">Estado</th>
                  <th className="px-3 py-2 whitespace-nowrap">Commodity</th>
                  <th className="px-3 py-2 whitespace-nowrap">Preço</th>
                  <th className="px-3 py-2 whitespace-nowrap">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/50">
                {/* {prices.map((price) => (
                  <tr className="*:first:font-medium" key={price.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {price.createdAt &&
                        new Date(price.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {price.state && price.state.toUpperCase()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatCommodityName(price.commodity)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      R$ {(price.price / 100).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {price.variation}
                    </td>
                  </tr>
                ))} */}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
