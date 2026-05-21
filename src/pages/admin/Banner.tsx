import { useEffect, useState, useCallback, useRef } from "react";
import { Save, Loader2, Megaphone, UploadCloud, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface BannerSettings {
  banner_image_url: string;
  banner_link_url: string;
  is_banner_active: boolean;
}

const EMPTY: BannerSettings = {
  banner_image_url: "",
  banner_link_url: "",
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("banner_image_url, banner_link_url, is_banner_active")
        .maybeSingle();

      if (error) {
        toast.error("Error al cargar configuración: " + error.message);
        setLoading(false);
        return;
      }

      const loaded: BannerSettings = {
        banner_image_url: data?.banner_image_url ?? "",
        banner_link_url: data?.banner_link_url ?? "",
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
    form.is_banner_active !== initial.is_banner_active;

  const linkUrlInvalid =
    form.banner_link_url.trim().length > 0 && !isValidUrl(form.banner_link_url);

  const handleImageUpload = useCallback(async (file: File) => {
    const isHtml = /\.html?$/i.test(file.name) || file.type === "text/html";
    if (
      !isHtml &&
      !file.type.match(/^image\/(jpeg|jpg|png|gif)$/) &&
      file.type !== ""
    ) {
      toast.error("Solo se aceptan imágenes JPG, PNG, GIF o banners HTML");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("El archivo no puede superar 8MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || (isHtml ? "html" : "jpg");
      const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const contentType = isHtml ? "text/html" : file.type || "image/jpeg";
      const { error } = await supabase.storage
        .from("news-images")
        .upload(fileName, file, { contentType, upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(fileName);
      setForm((f) => ({ ...f, banner_image_url: urlData.publicUrl }));
      toast.success(isHtml ? "Banner HTML subido" : "Imagen subida");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir el archivo";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
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
        banner_alt_text: null,
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
  }, [form, linkUrlInvalid, queryClient]);

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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,text/html,.jpg,.jpeg,.png,.gif,.html"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />

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

            {/* Imagen — uploader */}
            <div className="mb-5">
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                Imagen del banner
              </label>

              {form.banner_image_url ? (
                <div className="space-y-2">
                  <div
                    className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-zinc-100"
                    style={{ aspectRatio: "950 / 75" }}
                  >
                    {/\.html?(\?|$)/i.test(form.banner_image_url) ? (
                      <iframe
                        src={form.banner_image_url}
                        title="Vista previa del banner"
                        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                        scrolling="no"
                        className="h-full w-full border-0"
                      />
                    ) : (
                      <img
                        src={form.banner_image_url}
                        alt="Vista previa del banner"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="h-3.5 w-3.5" />
                      )}
                      Cambiar imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, banner_image_url: "" }))}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-neutral-200 text-sm text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                    <a
                      href={form.banner_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors ml-auto"
                    >
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Subiendo…</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6" />
                      <span className="text-sm font-medium text-neutral-700">
                        Subir banner
                      </span>
                      <span className="text-xs text-neutral-400">
                        JPG, PNG, GIF (animado) o HTML · recomendado 950 × 75 px · máx 8MB
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Link URL */}
            <div className="mb-7">
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

            {/* Save */}
            <div className="flex items-center justify-end gap-3">
              {isDirty && (
                <span className="text-xs text-amber-600">Cambios sin guardar</span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving || uploading || linkUrlInvalid}
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
