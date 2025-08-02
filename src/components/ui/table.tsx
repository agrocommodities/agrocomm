export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-gray-300 shadow-sm">
      <table className="min-w-full divide-y-2 divide-gray-200">
        {/* <thead className="ltr:text-left rtl:text-right">
          <tr className="*:font-medium *:text-gray-900">
            <th className="px-3 py-2 whitespace-nowrap">Name</th>
            <th className="px-3 py-2 whitespace-nowrap">DoB</th>
            <th className="px-3 py-2 whitespace-nowrap">Role</th>
            <th className="px-3 py-2 whitespace-nowrap">Salary</th>
          </tr>
        </thead> */}

          
          {/* <tr className="*:text-gray-900 *:first:font-medium">
            <td className="px-3 py-2 whitespace-nowrap">
              Nandor the Relentless
            </td>
            <td className="px-3 py-2 whitespace-nowrap">04/06/1262</td>
            <td className="px-3 py-2 whitespace-nowrap">Vampire Warrior</td>
            <td className="px-3 py-2 whitespace-nowrap">$0</td>
          </tr> */}

          {children}




      </table>
    </div>
  );
}
