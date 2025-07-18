import Table from '@/components/ui/table';

export default function Soja() {
  return (
    <div className="flex items-center space-x-4">
      <Table items={[
        { data: 'Soja', price: '$100', state: '50', commodity: 'Agriculture' },
      ]}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Soja</td>
            <td>$100</td>
            <td>50</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}