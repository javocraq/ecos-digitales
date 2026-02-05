import { useQuery } from "@tanstack/react-query";

interface Video {
  id: number;
  title?: string;
  tittle?: string;  // Typo en el API de n8n
  status: boolean;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

 const N8N_VIDEOS_URL = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/videos";

// Extrae el videoId de una URL de YouTube (siempre 11 caracteres)
const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  
  console.log("Extracting video ID from:", url);
  
  // Múltiples patrones para diferentes formatos de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log("Video ID extracted:", match[1]);
      return match[1];
    }
  }

  // Fallback: buscar cualquier secuencia de 11 caracteres después de v= o /
  const fallbackMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (fallbackMatch && fallbackMatch[1]) {
    console.log("Video ID (fallback):", fallbackMatch[1]);
    return fallbackMatch[1];
  }

  console.error("Could not extract video ID from URL:", url);
  return null;
};

export interface LatestVideoResult {
  videoId: string;
  title: string;
  description: string;
}

export const useLatestVideo = () => {
  return useQuery<LatestVideoResult | null>({
    queryKey: ["latestVideo"],
    queryFn: async (): Promise<LatestVideoResult | null> => {
      const response = await fetch(N8N_VIDEOS_URL);

      if (!response.ok) {
        throw new Error("Error al cargar el video");
      }

      const data = await response.json();
      console.log("Videos recibidos:", data);

      // El API retorna un array, tomamos el primer elemento con status=true (activo)
      if (Array.isArray(data) && data.length > 0) {
        const video = data.find((v: Video) => v.status === true) || data[0];
        const videoId = extractVideoId(video.url);

        if (!videoId) {
          console.warn("No se pudo extraer el videoId de:", video.url);
          return null;
        }

        return {
          videoId,
          title: (video.title || video.tittle || "").trim(),  // Maneja typo "tittle" del API
          description: video.description,
        };
      }

      return null;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 2,
  });
};
