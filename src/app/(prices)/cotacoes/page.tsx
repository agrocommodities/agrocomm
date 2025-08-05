import { PricesCard } from '@/components/prices/card';

export default async function Home() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full md:w-1/3 lg:w-1/4">
        <PricesCard commodity="soja" />
      </div>
    </div>
  );
}
