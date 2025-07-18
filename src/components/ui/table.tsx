export default function Table({
  items,
  children,
}: {
  items: Array<{
    data: string;
    state: string;
    price: string;
    commodity: string;
  }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs uppercase bg-black/80">
          <tr>
            <th scope="col" className="px-6 py-3">
              Data
            </th>
            <th scope="col" className="px-6 py-3">
              Estado
            </th>
            <th scope="col" className="px-6 py-3">
              Price
            </th>
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr className="bg-white dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-black/30" key={index}>
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                {item.data}
              </th>
              <td className="px-6 py-4">{item.state}</td>
              <td className="px-6 py-4">{item.price}</td>
              <td className="px-6 py-4 text-right">
                <a
                  href="#"
                  className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Edit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
