import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopBannerResult {
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
}

/**
 * Lee la configuración del banner superior (sitewide) desde site_settings.
 * Devuelve null si está desactivado o no hay imagen.
 */
export const useTopBanner = () => {
  return useQuery<TopBannerResult | null>({
    queryKey: ["topBanner"],
    queryFn: async (): Promise<TopBannerResult | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("banner_image_url, banner_link_url, banner_alt_text, is_banner_active")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      if (!data.is_banner_active) return null;
      if (!data.banner_image_url) return null;

      return {
        imageUrl: data.banner_image_url,
        linkUrl: data.banner_link_url?.trim() || null,
        altText: data.banner_alt_text?.trim() || "Espacio publicitario",
      };
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
};
