import { Plans } from "@/components/plans";
import { Carousel } from "@/components/ui/carousel";

// daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg 
// juliana-e-mariana-amorim-PidIm_k0Un8-unsplash.jpg
// lukasz-szmigiel-gmsiVT5sfl0-unsplash.jpg
// adrian-infernus-BN6iQEVN0ZQ-unsplash.jpg
// dan-meyers-IQVFVH0ajag-unsplash.jpg 
// luca-basili-0vVQWN_D26c-unsplash.jpg
// randy-fath-dDc0vuVH_LU-unsplash.jpg

const watermark = {
  logo: '/images/logo.svg', // Caminho para o logo do seu site
  alt: process.env.NEXT_PUBLIC_APP_NAME!,
  opacity: 1, // Opcional - padrão 0.7
  position: 'bottom-right' as const, // Opcional - padrão 'bottom-right'
  size: 'md' as const, // Opcional - padrão 'md'
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
      <div className="w-full max-w-7xl">
        <div className="flex h-full items-center justify-center mb-8">
          <Carousel slides={slides} watermark={watermark} />
        </div>
        <section className="w-full">
          <Plans />
        </section>
      </div>
    </div>
  );
}