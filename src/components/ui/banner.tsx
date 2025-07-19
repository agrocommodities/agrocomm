'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const VIDEOMPEG = "https://cdn.agrocomm.com.br/videos/2758322-uhd_3840_2160_30fps.mp4";
const VIDEOWEBM = "https://cdn.agrocomm.com.br/videos/2758322-uhd_3840_2160_30fps.mp4";
const SCREENSHOT = "https://cdn.agrocomm.com.br/images/screenshots/video-screenshot.jpg";

export default function VideoBanner() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Força o play no Safari após um pequeno delay
    const playVideo = async () => {
      try {
        video.load(); // Força reload do vídeo
        await video.play();
        setIsLoading(false);
      } catch (error) {
        console.log('Autoplay bloqueado:', error);
        setIsLoading(false);
      }
    };

    // Delay para garantir que o vídeo está carregado
    const timer = setTimeout(playVideo, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="w-full mx-auto mb-5">
      <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-52 xl:h-[200px] overflow-hidden rounded-xl bg-[#394634] border-2 border-black/50">
        {/* Estado de Loading */}
        {isLoading && (
          <div className="absolute inset-0 z-20">
            <Image
              src={SCREENSHOT}
              alt="Preview do vídeo"
              fill
              className="object-cover"
              priority
            />
            
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-sm font-medium">Carregando...</p>
              </div>
            </div>
          </div>
        )}

        {/* Se houver erro, mostra apenas a imagem */}
        {hasError ? (
          <Image
            src={SCREENSHOT}
            alt="Preview do vídeo"
            fill
            className="object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            style={{
              WebkitAppearance: 'none',
              outline: 'none',
            }}
          >
            {/* <source src={VIDEOMPEG} type="video/mp4" /> */}
            <source src={VIDEOWEBM} type="video/webm" />
          </video>
        )}
       

        
        {/* Conteúdo */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 text-white text-right z-10">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Logo AgroComm"
              width={40}
              height={40}
            />
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1">
              {process.env.NEXT_PUBLIC_APP_NAME || "AgroComm"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base opacity-90">
            {process.env.NEXT_PUBLIC_SITE_DESC || "Commodities Agropecuárias"}
          </p>
        </div>
      </div>

      {/* CSS para esconder controles no Safari */}
      <style jsx>{`
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
        video::-webkit-media-controls-play-button {
          display: none !important;
        }
        video::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
