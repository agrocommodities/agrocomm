# Captura frame em 5 segundos do vídeo
ffmpeg -i seu-video.mp4 -ss 00:00:05 -vframes 1 -q:v 2 video-screenshot.jpg

# Ou captura com tamanho específico
ffmpeg -i seu-video.mp4 -ss 00:00:05 -vframes 1 -vf "scale=1200:200" -q:v 2 video-screenshot.jpg


# Converter vídeo para MP4 com otimização para web
ffmpeg -i seu-video.mp4 -movflags +faststart -c:v libx264 -c:a aac seu-video-optimized.mp4

# Converter vídeo para WebM
ffmpeg -i seu-video.mp4 -c:v libvpx-vp9 -c:a libvorbis seu-video.webm

# Mais rápido, menos CPU
ffmpeg -i seu-video.mp4 -c:v libvpx -c:a libvorbis -crf 30 -b:v 1M -threads 4 seu-video.webm

# VP9 com configuração otimizada para velocidade
ffmpeg -i seu-video.mp4 -c:v libvpx-vp9 -c:a libvorbis -crf 35 -speed 6 -tile-columns 2 -threads 4 seu-video.webv

# Reduz resolução E converte - muito mais leve
ffmpeg -i seu-video.mp4 -vf "scale=1280:720" -c:v libvpx -c:a libvorbis -crf 25 -b:v 800k seu-video.webm

# Só otimiza o MP4 existente - muito mais rápido
ffmpeg -i seu-video.mp4 -movflags +faststart -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k seu-video-web.mp4

# Para banners, recomendo apenas otimizar o MP4:
ffmpeg -i seu-video.mp4 -movflags +faststart -vf "scale=1920:400" -c:v libx264 -preset fast -crf 30 -c:a aac -b:a 96k seu-video-banner.mp4