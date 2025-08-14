// src/app/page.tsx
import { Plans } from "@/components/plans";
import { Carousel } from "@/components/ui/carousel";
import { LatestNews } from "@/components/news/latest";
import { LatestPrices } from "@/components/prices/latest";

const watermark = {
  logo: '/images/logo.svg',
  alt: process.env.NEXT_PUBLIC_APP_NAME!,
  opacity: 1,
  position: 'bottom-right' as const,
  size: 'md' as const,
}

const slides = [
  {
    id: 1,
    image: 'https://cdn.agrocomm.com.br/images/bg/daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg',
    alt: 'Slide 1',
  },
  {
    id: 2,
    image: 'https://cdn.agrocomm.com.br/images/bg/juliana-e-mariana-amorim-PidIm_k0Un8-unsplash.jpg',
    alt: 'Slide 2',
  },
  {
    id: 3,
    image: 'https://cdn.agrocomm.com.br/images/bg/lukasz-szmigiel-gmsiVT5sfl0-unsplash.jpg',
    alt: 'Slide 3',
  },
]

export default async function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl space-y-8">
        <div className="flex h-full items-center justify-center">
          <Carousel slides={slides} watermark={watermark} />
        </div>
        
        {/* Resumo de Cotações */}
        <section className="w-full">
          <LatestPrices variant="main" limit={20} />
        </section>
        
        {/* Últimas Notícias */}
        <section className="w-full">
          <LatestNews variant="main" limit={12} />
        </section>
        
        {/* Planos */}
        <section className="w-full">
          <Plans />
        </section>
      </div>
    </div>
  );
}