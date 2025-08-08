import { PricesCard } from '@/components/prices/card';

export default async function Home() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <PricesCard commodity="soja" />
      <PricesCard commodity="milho" />
    </div>
  );
}
