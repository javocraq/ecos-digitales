import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Search, Pencil, ChevronUp, ChevronDown, Pin, CheckCircle2, XCircle, X, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/config/admin";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface DashboardArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  is_pinned: boolean;
  pinned_order: number;
  categories: { name: string } | null;
  authors: { name: string } | null;
}

type SortColumn = "title" | "category" | "published_at" | "author" | "source" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const Articles = () => {
  const { author, signOut } = useAuth();
  // author/signOut now live in the sidebar; keeping the destructure to avoid changing AuthContext shape.
  void author; void signOut;

  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "automatic" | "manual">("all");
  const [sortCol, setSortCol] = useState<SortColumn>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<null | "publish" | "unpublish" | "change_author">(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkAuthorId, setBulkAuthorId] = useState<string>("");
  const [authorsList, setAuthorsList] = useState<{ id: string; name: string }[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Fetch authors for the bulk-change-author selector
  useEffect(() => {
    supabase
      .from("authors")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setAuthorsList(data);
      });
  }, []);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "published_at" ? "desc" : "asc");
    }
    setPage(0);
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("articles")
      .select("id, title, slug, status, source, published_at, updated_at, created_at, is_pinned, pinned_order, categories(name), authors(name)", { count: "exact" });

    if (filter === "published" || filter === "draft") {
      query = query.eq("status", filter);
    } else if (filter === "automatic") {
      query = query.eq("source", "AI");
    } else if (filter === "manual") {
      query = query.eq("source", "Human");
    }

    if (searchQuery.trim()) {
      query = query.ilike("title", `%${searchQuery.trim()}%`);
    }

    // "category"/"author" use joined tables; Supabase supports ordering by foreign column
    const orderField =
      sortCol === "category" ? "categories(name)"
        : sortCol === "author" ? "authors(name)"
        : sortCol;
    const ascending = sortDir === "asc";

    query = query.order(orderField, {
      ascending,
      nullsFirst: false,
    });

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await query.range(from, to);

    if (!error) {
      setArticles((data as DashboardArticle[]) || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, searchQuery, filter, sortCol, sortDir]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, filter]);

  // Clear selection when the visible page/filter/search/sort changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, searchQuery, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const pinnedCount = articles.filter((a) => a.is_pinned).length;

  // Header checkbox: indeterminate when partial selection
  const visibleIds = useMemo(() => articles.map((a) => a.id), [articles]);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    if (bulkAction === "change_author" && !bulkAuthorId) {
      toast.error("Seleccioná un autor primero");
      return;
    }
    setBulkRunning(true);
    const ids = Array.from(selectedIds);

    const fail = (msg: string) => {
      setBulkRunning(false);
      toast.error("Error en acción masiva: " + msg);
    };

    if (bulkAction === "change_author") {
      const { error } = await supabase
        .from("articles")
        .update({ author_id: bulkAuthorId })
        .in("id", ids);
      if (error) return fail(error.message);
    } else if (bulkAction === "publish") {
      // Para rows sin published_at: setear ahora + status. Para rows con fecha: solo flip de status.
      const r1 = await supabase
        .from("articles")
        .update({ status: "published", published_at: new Date().toISOString() })
        .in("id", ids)
        .is("published_at", null);
      if (r1.error) return fail(r1.error.message);

      const r2 = await supabase
        .from("articles")
        .update({ status: "published" })
        .in("id", ids)
        .not("published_at", "is", null);
      if (r2.error) return fail(r2.error.message);
    } else if (bulkAction === "unpublish") {
      const { error } = await supabase
        .from("articles")
        .update({ status: "draft" })
        .in("id", ids);
      if (error) return fail(error.message);
    }

    setBulkRunning(false);

    const plural = ids.length !== 1 ? "s" : "";
    let msg = "";
    if (bulkAction === "publish") msg = `${ids.length} artículo${plural} publicado${plural}`;
    else if (bulkAction === "unpublish") msg = `${ids.length} artículo${plural} despublicado${plural}`;
    else if (bulkAction === "change_author") {
      const authorName = authorsList.find((a) => a.id === bulkAuthorId)?.name || "autor";
      msg = `${ids.length} artículo${plural} reasignado${plural} a ${authorName}`;
    }
    toast.success(msg);
    setBulkAction(null);
    setBulkAuthorId("");
    clearSelection();
    fetchArticles();
  };

  const handleTogglePin = async (article: DashboardArticle) => {
    if (!article.is_pinned && pinnedCount >= 3) {
      toast.error("Máximo 3 notas fijadas. Desfijar una primero.");
      return;
    }

    const newPinned = !article.is_pinned;
    // If pinning, assign next order; if unpinning, reset to 0
    const newOrder = newPinned ? pinnedCount + 1 : 0;

    const { error } = await supabase
      .from("articles")
      .update({ is_pinned: newPinned, pinned_order: newOrder })
      .eq("id", article.id);

    if (error) {
      toast.error("Error al actualizar pin");
      return;
    }

    // Update local state immediately
    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id ? { ...a, is_pinned: newPinned, pinned_order: newOrder } : a
      )
    );
    toast.success(newPinned ? "Nota fijada" : "Nota desfijada");
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Artículos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión y edición de notas
          </p>
        </div>
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="automatic">AI</option>
            <option value="manual">Human</option>
          </select>
          <Link
            to={`${ADMIN_BASE_PATH}/editor`}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Nueva Nota
          </Link>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {totalCount} artículo{totalCount !== 1 ? "s" : ""}
          {filter !== "all" && ` — ${
            { published: "publicados", draft: "borradores", automatic: "automáticos", manual: "manuales" }[filter]
          }`}
          {searchInput.trim() && ` con "${searchInput.trim()}"`}
        </p>

        {/* Bulk actions toolbar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Limpiar selección"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="font-medium text-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkAction("change_author")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-200 bg-white text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <UserCog className="h-3.5 w-3.5" />
                Modificar autor
              </button>
              <button
                type="button"
                onClick={() => setBulkAction("publish")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-emerald-200 bg-white text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Publicar
              </button>
              <button
                type="button"
                onClick={() => setBulkAction("unpublish")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-amber-200 bg-white text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Despublicar
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center font-medium text-muted-foreground px-2 py-3 w-10">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      aria-label="Seleccionar todos los visibles"
                      className="h-4 w-4 rounded border-neutral-300 cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-2 py-3 w-12">
                    <Pin className="h-3.5 w-3.5 mx-auto" />
                  </th>
                  <SortableHeader col="title" label="Título" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="category" label="Categoría" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-40" />
                  <SortableHeader col="published_at" label="Publicado" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-32" />
                  <SortableHeader col="author" label="Autor" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-48" />
                  <SortableHeader col="status" label="Estado" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-28" />
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No se encontraron artículos
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => {
                    const isSelected = selectedIds.has(article.id);
                    return (
                    <tr key={article.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : article.is_pinned ? "bg-amber-500/5" : ""}`}>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(article.id)}
                          aria-label={`Seleccionar ${article.title}`}
                          className="h-4 w-4 rounded border-neutral-300 cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(article)}
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
                            article.is_pinned
                              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary"
                          }`}
                          title={article.is_pinned ? "Desfijar" : "Fijar"}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/noticias/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground line-clamp-1 hover:text-primary hover:underline transition-colors"
                        >
                          {article.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {article.categories?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {article.published_at
                          ? format(new Date(article.published_at), "d MMM yyyy", { locale: es })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap truncate" title={article.authors?.name || ""}>
                        {article.authors?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={article.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`${ADMIN_BASE_PATH}/editor/${article.id}`}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
                  <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                </div>
              ))
            ) : articles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron artículos
              </div>
            ) : (
              articles.map((article) => {
                const isSelected = selectedIds.has(article.id);
                return (
                <div key={article.id} className={`p-4 ${isSelected ? "bg-primary/5" : article.is_pinned ? "bg-amber-500/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(article.id)}
                      aria-label={`Seleccionar ${article.title}`}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 cursor-pointer accent-primary shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleTogglePin(article)}
                      className={`mt-0.5 inline-flex items-center justify-center h-6 w-6 rounded-md shrink-0 transition-colors ${
                        article.is_pinned
                          ? "text-amber-500 bg-amber-500/10"
                          : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                    <a
                      href={`/noticias/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-medium text-foreground text-sm line-clamp-2 mb-2 hover:text-primary hover:underline transition-colors"
                    >
                      {article.title}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground">{article.categories?.name || "—"}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">
                      {article.published_at
                        ? format(new Date(article.published_at), "d MMM yyyy", { locale: es })
                        : "—"}
                    </span>
                    {article.authors?.name && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          {article.authors.name}
                        </span>
                      </>
                    )}
                    <StatusBadge status={article.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`${ADMIN_BASE_PATH}/editor/${article.id}`}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bulk confirmation modal */}
      {bulkAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              if (bulkRunning) return;
              setBulkAction(null);
              setBulkAuthorId("");
            }}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {bulkAction === "publish" && "Publicar artículos"}
              {bulkAction === "unpublish" && "Despublicar artículos"}
              {bulkAction === "change_author" && "Reasignar autor"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {bulkAction === "publish" && (
                <>
                  Se publicarán <strong>{selectedIds.size}</strong> artículo{selectedIds.size !== 1 ? "s" : ""}.
                  Los que no tengan fecha se publicarán con la fecha actual.
                </>
              )}
              {bulkAction === "unpublish" && (
                <>
                  Se pasarán a borrador <strong>{selectedIds.size}</strong> artículo{selectedIds.size !== 1 ? "s" : ""}.
                  Dejarán de ser visibles en el sitio.
                </>
              )}
              {bulkAction === "change_author" && (
                <>
                  Elegí el nuevo autor para los <strong>{selectedIds.size}</strong> artículo{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}.
                </>
              )}
            </p>

            {bulkAction === "change_author" && (
              <div className="mb-6">
                <label className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-2">
                  Autor
                </label>
                <select
                  value={bulkAuthorId}
                  onChange={(e) => setBulkAuthorId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50/50 px-3 text-sm text-neutral-800 focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all"
                >
                  <option value="">— Seleccionar autor —</option>
                  {authorsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkAction(null);
                  setBulkAuthorId("");
                }}
                disabled={bulkRunning}
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={runBulk}
                disabled={bulkRunning || (bulkAction === "change_author" && !bulkAuthorId)}
                className="h-9 px-4 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {bulkRunning
                  ? "Procesando..."
                  : bulkAction === "publish"
                    ? "Publicar"
                    : bulkAction === "unpublish"
                      ? "Despublicar"
                      : "Reasignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

const SortableHeader = ({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
  className = "",
}: {
  col: SortColumn;
  label: string;
  sortCol: SortColumn;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
  className?: string;
}) => {
  const isActive = sortCol === col;
  return (
    <th className={`text-left px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 font-medium transition-colors ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-30" />
        )}
      </button>
    </th>
  );
};

const SourceBadge = ({ source }: { source: string | null }) => {
  const isHuman = source === "Human";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isHuman
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isHuman ? "Human" : "AI"}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isPublished
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }`}
    >
      {isPublished ? "Publicado" : "Borrador"}
    </span>
  );
};

export default Articles;
