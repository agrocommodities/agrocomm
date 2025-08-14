// src/app/page.tsx
import { Plans } from "@/components/plans";
import { Carousel } from "@/components/ui/carousel";
import { Sidebar } from "@/components/ui/sidebar";

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
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Carousel */}
          <div className="w-full">
            <Carousel slides={slides} watermark={watermark} />
          </div>
          
          {/* Plans */}
          <section className="w-full">
            <Plans />
          </section>
        </main>
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 lg:flex-shrink-0">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}