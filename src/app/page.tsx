import Link from "next/link";
import VideoBanner from "@/components/ui/banner";
// import Image from "next/image";

// function VideoSection() {
//   return (
//     <div className="relative w-full h-screen overflow-hidden">
//       {/* Vídeo de background */}
//       <video
//         className="absolute inset-0 w-full h-full object-cover"
//         autoPlay
//         muted
//         loop
//         playsInline
//         controls={false}
//         disablePictureInPicture
//         disableRemotePlayback
//         preload="metadata"
//         webkit-playsinline="true"
//       >
//         <source src="https://cdn.agrocomm.com.br/videos/2758322-uhd_3840_2160_30fps.mp4" type="video/mp4" />
//         Seu navegador não suporta vídeos HTML5.
//       </video>

//       {/* Overlay verde para efeito dim */}
//       <div className="absolute inset-0 bg-[#394634] opacity-40"></div>

//       {/* Conteúdo: título e subtítulo no canto inferior direito */}
//       <div className="absolute bottom-8 right-8 text-white z-10">
//         <h1 className="text-4xl md:text-5xl font-bold mb-2">
//           Seu Título Aqui
//         </h1>
//         <p className="text-lg md:text-xl opacity-90">
//           Seu subtítulo descritivo aqui
//         </p>
//       </div>
//     </div>
//   );
// }

// <div className="container mx-auto border-4 border-black">
// <div className="flex gap-4 items-center flex-col sm:flex-row">
export default function Home() {
  return <VideoBanner />;
}
