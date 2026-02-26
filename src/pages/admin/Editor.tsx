import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Send,
  X,
  Upload,
  Loader2,
  ImageIcon,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/config/admin";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { DateTimePicker } from "@/components/admin/DateTimePicker";

interface Category {
  id: string;
  name: string;
}

interface Author {
  id: string;
  name: string;
}

function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function generateExcerpt(html: string): string {
  const text = stripHtml(html).trim();
  if (text.length <= 250) return text;
  const truncated = text.slice(0, 250);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Convert ISO string to Peru time in datetime-local format (YYYY-MM-DDTHH:mm)
function toPeruDatetimeLocal(iso: string): string {
  return new Date(iso)
    .toLocaleString("sv-SE", { timeZone: "America/Lima" })
    .replace(" ", "T")
    .slice(0, 16);
}

// Convert Peru datetime-local value to UTC ISO string
// Peru is always UTC-5 (no DST)
function peruToUTC(datetimeLocal: string): string {
  const [datePart, timePart] = datetimeLocal.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, h + 5, min));
  return utc.toISOString();
}

// Get current Peru time as datetime-local string
function nowInPeru(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "America/Lima" })
    .replace(" ", "T")
    .slice(0, 16);
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function uploadImageToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const contentType = file.type || MIME_MAP[ext] || "image/jpeg";

  const { data, error } = await supabase.storage
    .from("news-images")
    .upload(fileName, file, { contentType, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { author: currentAuthor } = useAuth();
  const isEdit = Boolean(id);

  // Form state
  const [title, setTitle] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [originalSource, setOriginalSource] = useState<string | null>(null);
  const [articleStatus, setArticleStatus] = useState<string>("draft");

  // UI state
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingArticle, setLoadingArticle] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirtyRef = useRef(false);
  const initialLoadRef = useRef(true);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Author autocomplete state
  const [authorQuery, setAuthorQuery] = useState("");
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const authorRef = useRef<HTMLDivElement>(null);

  // Category autocomplete state
  const [categoryQuery, setCategoryQuery] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize title textarea
  const resizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  useEffect(() => {
    resizeTitle();
  }, [title, resizeTitle]);

  // Track dirty state
  useEffect(() => {
    if (initialLoadRef.current) return;
    dirtyRef.current = true;
  }, [title, authorId, categoryId, publishedAt, imageUrl, content]);

  // Warn on unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (authorRef.current && !authorRef.current.contains(e.target as Node)) {
        setShowAuthorDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch authors
  useEffect(() => {
    supabase
      .from("authors")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setAuthors(data);
      });
  }, []);

  // Fetch categories
  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  // Fetch article for edit mode
  useEffect(() => {
    if (!id) return;
    setLoadingArticle(true);
    supabase
      .from("articles")
      .select("title, subtitle, content, excerpt, category_id, author_id, featured_image_url, status, source, slug, published_at")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("No se pudo cargar el artículo");
          navigate(`${ADMIN_BASE_PATH}/dashboard`);
          return;
        }
        setTitle(data.title || "");
        setAuthorId(data.author_id || "");
        setCategoryId(data.category_id || "");
        setPublishedAt(data.published_at ? toPeruDatetimeLocal(data.published_at) : "");
        setImageUrl(data.featured_image_url || "");
        setContent(data.content || "");
        setOriginalSource(data.source);
        setArticleStatus(data.status || "draft");
        setLoadingArticle(false);
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 500);
      });
  }, [id, navigate]);

  // For new articles, pre-select current author and enable dirty tracking
  useEffect(() => {
    if (!isEdit && currentAuthor) {
      setAuthorId(currentAuthor.id);
      initialLoadRef.current = false;
    }
  }, [isEdit, currentAuthor]);

  // Set author query text when authorId changes and authors are loaded
  useEffect(() => {
    if (authorId && authors.length > 0) {
      const a = authors.find((a) => a.id === authorId);
      if (a) setAuthorQuery(a.name);
    }
  }, [authorId, authors]);

  // Set category query text when categoryId changes and categories are loaded
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) setCategoryQuery(cat.name);
    }
  }, [categoryId, categories]);

  const filteredAuthors = authors.filter((a) =>
    a.name.toLowerCase().includes(authorQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const selectedAuthor = authors.find((a) => a.id === authorId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "El título es obligatorio";
    if (!authorId) errs.author = "Seleccioná un autor";
    if (!categoryId) errs.category = "Seleccioná una categoría";
    const plainContent = stripHtml(content).trim();
    if (!plainContent) errs.content = "El contenido no puede estar vacío";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, authorId, categoryId, content]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/) && file.type !== "") {
      toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file);
      setImageUrl(url);
      toast.success("Imagen subida");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir imagen";
      toast.error(msg);
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImageUpload(file);
    },
    [handleImageUpload]
  );

  const handleUnpublish = useCallback(async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "¿Estás seguro de que querés despublicar este artículo? Dejará de ser visible en el sitio."
    );
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase
      .from("articles")
      .update({ status: "draft", published_at: null })
      .eq("id", id);
    setSaving(false);

    if (error) {
      toast.error("Error al despublicar: " + error.message);
      return;
    }

    setArticleStatus("draft");
    setPublishedAt("");
    dirtyRef.current = false;
    toast.success("Artículo despublicado — ahora es borrador");
  }, [id]);

  const handleSave = useCallback(
    async (action: "draft" | "publish") => {
      if (!validate()) {
        toast.error("Completá los campos obligatorios");
        return;
      }

      setSaving(true);

      const newSlug = generateSlug(title);
      const now = new Date().toISOString();
      const finalExcerpt = generateExcerpt(content);
      const readingTime = estimateReadingTime(content);

      let finalPublishedAt: string | null = null;
      let finalStatus: "draft" | "published" = "draft";

      if (action === "publish") {
        finalPublishedAt = publishedAt
          ? peruToUTC(publishedAt)
          : peruToUTC(nowInPeru());
        finalStatus = "published";
      } else {
        if (publishedAt) {
          finalPublishedAt = peruToUTC(publishedAt);
          finalStatus = "published";
        } else {
          finalPublishedAt = null;
          finalStatus = "draft";
        }
      }

      const baseData = {
        title: title.trim(),
        slug: newSlug,
        content,
        excerpt: finalExcerpt,
        category_id: categoryId,
        author_id: authorId,
        featured_image_url: imageUrl.trim() || null,
        status: finalStatus,
        published_at: finalPublishedAt,
        reading_time_minutes: readingTime,
        updated_at: now,
      };

      let error;

      if (isEdit && id) {
        ({ error } = await supabase
          .from("articles")
          .update({
            ...baseData,
            source: originalSource || "manual",
          })
          .eq("id", id));
      } else {
        ({ error } = await supabase.from("articles").insert({
          ...baseData,
          source: "manual",
          created_at: now,
        }));
      }

      setSaving(false);

      if (error) {
        toast.error("Error al guardar: " + error.message);
        return;
      }

      dirtyRef.current = false;
      toast.success(
        finalStatus === "published" ? "Nota publicada" : "Nota guardada como borrador"
      );
      navigate(`${ADMIN_BASE_PATH}/dashboard`);
    },
    [validate, title, content, categoryId, authorId, imageUrl, publishedAt, isEdit, id, navigate, originalSource]
  );

  if (loadingArticle) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isAutomatic = originalSource === "automatic";
  const isPublished = articleStatus === "published";

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[900px] px-6 flex h-16 items-center justify-between">
          <Link
            to={`${ADMIN_BASE_PATH}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Link>

          <div className="flex items-center gap-3">
            {isEdit && isPublished && (
              <button
                onClick={handleUnpublish}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
              >
                <ArchiveRestore className="h-4 w-4" />
                <span className="hidden sm:inline">Despublicar</span>
              </button>
            )}
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isEdit ? "Guardar cambios" : "Guardar borrador"}
              </span>
              <span className="sm:hidden">Guardar</span>
            </button>
            <button
              onClick={() => handleSave("publish")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publicar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-10">
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] p-8 sm:p-10 lg:p-12 space-y-10">
          {/* Automatic source badge */}
          {isAutomatic && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200/50">
                Artículo automático
              </span>
            </div>
          )}

          {/* Status badge */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                isPublished
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                  : "bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/50"
              }`}>
                {isPublished ? "Publicado" : "Borrador"}
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onInput={resizeTitle}
              placeholder="Título de la nota"
              rows={1}
              className={`w-full bg-transparent text-[2rem] sm:text-[2.25rem] font-bold leading-[1.15] tracking-tight text-neutral-900 placeholder:text-neutral-300 focus:outline-none resize-none overflow-hidden font-serif ${
                errors.title ? "placeholder:text-red-300" : ""
              }`}
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-2">{errors.title}</p>
            )}
          </div>

          {/* Meta fields row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Author */}
            <div ref={authorRef}>
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                Autor
              </label>
              {selectedAuthor ? (
                <div className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <span className="text-sm text-neutral-800">{selectedAuthor.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorId("");
                      setAuthorQuery("");
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={authorQuery}
                    onChange={(e) => {
                      setAuthorQuery(e.target.value);
                      setShowAuthorDropdown(true);
                    }}
                    onFocus={() => setShowAuthorDropdown(true)}
                    placeholder="Buscar autor..."
                    className={`h-10 w-full rounded-lg border bg-neutral-50/50 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all duration-200 ${
                      errors.author ? "border-red-300" : "border-neutral-200"
                    }`}
                  />
                  {showAuthorDropdown && (
                    <div className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                      {filteredAuthors.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-neutral-400">
                          Sin resultados
                        </div>
                      ) : (
                        filteredAuthors.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setAuthorId(a.id);
                              setAuthorQuery(a.name);
                              setShowAuthorDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                          >
                            {a.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.author && (
                <p className="text-sm text-red-500 mt-1.5">{errors.author}</p>
              )}
            </div>

            {/* Category */}
            <div ref={categoryRef}>
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                Categoría
              </label>
              {selectedCategory ? (
                <div className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-100">
                  <span className="text-sm text-neutral-800">{selectedCategory.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId("");
                      setCategoryQuery("");
                    }}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={categoryQuery}
                    onChange={(e) => {
                      setCategoryQuery(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Buscar categoría..."
                    className={`h-10 w-full rounded-lg border bg-neutral-50/50 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all duration-200 ${
                      errors.category ? "border-red-300" : "border-neutral-200"
                    }`}
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                      {filteredCategories.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-neutral-400">
                          Sin resultados
                        </div>
                      ) : (
                        filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategoryId(cat.id);
                              setCategoryQuery(cat.name);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                          >
                            {cat.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.category && (
                <p className="text-sm text-red-500 mt-1.5">{errors.category}</p>
              )}
            </div>

            {/* Publication date */}
            <div>
              <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                Fecha
              </label>
              <DateTimePicker
                value={publishedAt}
                onChange={setPublishedAt}
                error={!!errors.date}
              />
              <p className="text-[0.6875rem] text-neutral-400 mt-1.5">
                Sin fecha = borrador
              </p>
            </div>
          </div>

          {/* Featured image */}
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
              Imagen destacada
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />

            {imageUrl.trim() ? (
              <div className="group relative overflow-hidden rounded-xl">
                <img
                  src={imageUrl.trim()}
                  alt="Preview"
                  className="w-full aspect-video object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-100 transition-colors duration-200 shadow-lg"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="inline-flex items-center h-9 px-3 rounded-lg bg-white text-red-500 hover:bg-red-50 transition-colors duration-200 shadow-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 h-48 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 cursor-pointer hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
                    <span className="text-sm text-neutral-400">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-neutral-500">
                        Arrastrá una imagen o hacé click
                      </span>
                      <br />
                      <span className="text-xs text-neutral-400">
                        JPG, PNG o WebP — máx. 5MB
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content editor */}
          <div>
            <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
              Contenido
            </label>
            <RichTextEditor content={content} onUpdate={setContent} />
            {errors.content && (
              <p className="text-sm text-red-500 mt-2">{errors.content}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Editor;
