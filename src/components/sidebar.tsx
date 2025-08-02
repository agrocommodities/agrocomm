export function SideBar() {
  return (
    <div className="bg-background p-3 border-3 border-black/30 rounded-md shadow-md">
      <h2 className="text-lg font-semibold mb-2">Últimas Cotações</h2>
      <table className="w-full table-auto">
        <tbody>
          <tr>
            <td>1</td>
            <td>Produto A</td>
            <td>R$ 10,00</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Produto B</td>
            <td>R$ 20,00</td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}
