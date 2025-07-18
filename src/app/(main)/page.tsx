import ImageCard from "@/components/ui/image-card";
import VideoBanner from "@/components/ui/banner";

export default function Home() {
  return (
  <div>
    <VideoBanner />
    <div className="space-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ImageCard
          imageUrl="https://cdn.agrocomm.com.br/images/bg/daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg"
          title="Soja"
          subtitle=""
          className="aspect-[4/3]"
          href="/soja"
        />        
        <ImageCard
          imageUrl="https://cdn.agrocomm.com.br/images/bg/adrian-infernus-BN6iQEVN0ZQ-unsplash.jpg"
          title="Milho"
          subtitle=""
          className="aspect-[4/3]"
          href="/milho"
        />        
        <ImageCard
          imageUrl="https://cdn.agrocomm.com.br/images/bg/juliana-e-mariana-amorim-PidIm_k0Un8-unsplash.jpg"
          title="Boi"
          subtitle=""
          className="aspect-[4/3]"
          href="/cultura"
        />
      </div>
    </div>
  </div>
  );
}
