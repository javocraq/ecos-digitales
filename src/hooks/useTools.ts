import { useQuery } from "@tanstack/react-query";

export interface Tool {
  product_name: string;
  description: string;
  slug: string;
  short_description: string;
  affiliate_url: string;
  referral_code: string;
  image_url: string;
  [key: string]: unknown;
}

const N8N_TOOLS_URL = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/tools";

export const useTools = () => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: async (): Promise<Tool[]> => {
      const response = await fetch(N8N_TOOLS_URL);
      if (!response.ok) {
        throw new Error("Error al cargar herramientas");
      }

      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((raw: any) => ({
        product_name: raw.product_name ?? raw.name ?? "",
        description: raw.description ?? "",
        slug: raw.slug ?? "",
        short_description: raw.short_description ?? "",
        affiliate_url: raw.affiliate_url ?? raw.url ?? "",
        referral_code: raw.referral_code ?? "",
        image_url: raw.image_url ?? "",
        ...raw,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};
