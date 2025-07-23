import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prices } from "@/db/schema"
import Table from '@/components/ui/table';
import { formatarReais } from "@/lib/utils";

export default async function Soja() {
  const soja = await db.select().from(prices)
    .where(eq(prices.commodity, "soja"))

  if (!soja || soja.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum dado encontrado para soja.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 border">
      <Table>
        <thead className="text-sm uppercase bg-black/80">
          <tr>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Estado
            </th>
            <th scope="col" className="px-6 py-3">
              Preço (R$)
            </th>
            {/* <th scope="col" className="px-6 py-3">
              <span className="sr-only">Edit</span>
            </th> */}
          </tr>
        </thead>
        <tbody>
          {soja.map((item, index) => (
            <tr className="bg-white dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-black/30" key={index}>
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
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
              <td className="px-6 py-4">{item.state}</td>
              <td className="px-6 py-4">R$ {formatarReais(item.price)}</td>
              {/* <td className="px-6 py-4 text-right">
                <a
                  href="#"
                  className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Edit
                </a>
              </td> */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}