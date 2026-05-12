import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, Megaphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface BannerSettings {
  banner_image_url: string;
  banner_link_url: string;
  banner_alt_text: string;
  is_banner_active: boolean;
}

const EMPTY: BannerSettings = {
  banner_image_url: "",
  banner_link_url: "",
  banner_alt_text: "",
  is_banner_active: false,
};

const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const Banner = () => {
  const queryClient = useQueryClient();
  const [initial, setInitial] = useState<BannerSettings>(EMPTY);
  const [form, setForm] = useState<BannerSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("banner_image_url, banner_link_url, banner_alt_text, is_banner_active")
        .maybeSingle();

      if (error) {
        toast.error("Error al cargar configuración: " + error.message);
        setLoading(false);
        return;
      }

      const loaded: BannerSettings = {
        banner_image_url: data?.banner_image_url ?? "",
        banner_link_url: data?.banner_link_url ?? "",
        banner_alt_text: data?.banner_alt_text ?? "",
        is_banner_active: data?.is_banner_active ?? false,
      };
      setInitial(loaded);
      setForm(loaded);
      setLoading(false);
    };
    load();
  }, []);

  const isDirty =
    form.banner_image_url !== initial.banner_image_url ||
    form.banner_link_url !== initial.banner_link_url ||
    form.banner_alt_text !== initial.banner_alt_text ||
    form.is_banner_active !== initial.is_banner_active;

  const imageUrlInvalid =
    form.banner_image_url.trim().length > 0 && !isValidUrl(form.banner_image_url);
  const linkUrlInvalid =
    form.banner_link_url.trim().length > 0 && !isValidUrl(form.banner_link_url);

  const handleSave = useCallback(async () => {
    if (imageUrlInvalid) {
      toast.error("La URL de la imagen no es válida");
      return;
    }
    if (linkUrlInvalid) {
      toast.error("La URL del enlace no es válida");
      return;
    }
    if (form.is_banner_active && !form.banner_image_url.trim()) {
      toast.error("No podés activar el banner sin una imagen");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        banner_image_url: form.banner_image_url.trim() || null,
        banner_link_url: form.banner_link_url.trim() || null,
        banner_alt_text: form.banner_alt_text.trim() || null,
        is_banner_active: form.is_banner_active,
      })
      .eq("id", true);

    setSaving(false);

    if (error) {
      toast.error("Error al guardar: " + error.message);
      return;
    }

    setInitial(form);
    toast.success("Banner guardado");
    queryClient.invalidateQueries({ queryKey: ["topBanner"] });
  }, [form, imageUrlInvalid, linkUrlInvalid, queryClient]);

  return (
    <AdminLayout>
      <div className="px-6 sm:px-10 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight">
            Banner
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Banner publicitario arriba del navbar (sitewide)
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-black/[0.06] bg-white p-8 flex items-center gap-3 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <section className="rounded-xl border border-black/[0.06] bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-[#B21C40]" />
                  Banner display 950 × 75
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Aparece encima del navbar en todas las páginas públicas. Si está
                  desactivado o no hay imagen, se oculta automáticamente.
                </p>
              </div>
            </div>

            {/* Toggle */}
            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_banner_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_banner_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 cursor-pointer"
              />
              <span className="text-sm text-neutral-800 font-medium">
                Mostrar banner en el sitio
              </span>
            </label>

            {/* Image URL */}
            <div className="mb-5">
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                URL de la imagen
              </label>
              <input
                type="url"
                value={form.banner_image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, banner_image_url: e.target.value }))
                }
                placeholder="https://… (recomendado 950×75 px)"
                className={`h-10 w-full rounded-lg border bg-neutral-50/50 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all ${
                  imageUrlInvalid
                    ? "border-red-300"
                    : "border-neutral-200 focus:border-neutral-300"
                }`}
              />
              {imageUrlInvalid && (
                <p className="text-xs text-red-500 mt-1.5">
                  URL no válida. Debe empezar con http:// o https://
                </p>
              )}
              {form.banner_image_url && !imageUrlInvalid && (
                <a
                  href={form.banner_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 mt-1.5 transition-colors"
                >
                  Abrir imagen
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Link URL */}
            <div className="mb-5">
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                URL destino (opcional)
              </label>
              <input
                type="url"
                value={form.banner_link_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, banner_link_url: e.target.value }))
                }
                placeholder="https://sitio-del-sponsor.com"
                className={`h-10 w-full rounded-lg border bg-neutral-50/50 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all ${
                  linkUrlInvalid
                    ? "border-red-300"
                    : "border-neutral-200 focus:border-neutral-300"
                }`}
              />
              {linkUrlInvalid && (
                <p className="text-xs text-red-500 mt-1.5">
                  URL no válida. Debe empezar con http:// o https://
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1.5">
                Si no se proporciona, el banner no será clickeable.
              </p>
            </div>

            {/* Alt text */}
            <div className="mb-7">
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                Texto alternativo (alt)
              </label>
              <input
                type="text"
                value={form.banner_alt_text}
                onChange={(e) =>
                  setForm((f) => ({ ...f, banner_alt_text: e.target.value }))
                }
                placeholder="Marca X — Campaña Y"
                maxLength={200}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all"
              />
              <p className="text-xs text-neutral-400 mt-1.5">
                Descripción de la creatividad para accesibilidad y SEO.
              </p>
            </div>

            {/* Preview */}
            {form.banner_image_url && !imageUrlInvalid && (
              <div className="mb-7">
                <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                  Vista previa
                </label>
                <div
                  className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-zinc-100"
                  style={{ aspectRatio: "950 / 75" }}
                >
                  <img
                    src={form.banner_image_url}
                    alt={form.banner_alt_text || "Vista previa"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex items-center justify-end gap-3">
              {isDirty && (
                <span className="text-xs text-amber-600">Cambios sin guardar</span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving || imageUrlInvalid || linkUrlInvalid}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </button>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

export default Banner;
