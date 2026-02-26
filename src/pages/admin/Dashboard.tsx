import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Search, Pencil, Trash2, ChevronUp, ChevronDown, Pin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_BASE_PATH } from "@/config/admin";
import { supabase } from "@/integrations/supabase/client";

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
}

type SortColumn = "title" | "category" | "published_at" | "updated_at" | "source" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const Dashboard = () => {
  const { author, signOut } = useAuth();

  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "automatic" | "manual">("all");
  const [deleteTarget, setDeleteTarget] = useState<DashboardArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortCol, setSortCol] = useState<SortColumn>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "published_at" || col === "updated_at" ? "desc" : "asc");
    }
    setPage(0);
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("articles")
      .select("id, title, slug, status, source, published_at, updated_at, created_at, is_pinned, pinned_order, categories(name)", { count: "exact" });

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

    // "category" uses the joined table; Supabase supports ordering by foreign column
    const orderField = sortCol === "category" ? "categories(name)" : sortCol;
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

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("articles").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchArticles();
  };

  const pinnedCount = articles.filter((a) => a.is_pinned).length;

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

  const wasEdited = (article: DashboardArticle) => {
    if (!article.updated_at || !article.created_at) return false;
    return article.updated_at !== article.created_at;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between">
          <Link to={`${ADMIN_BASE_PATH}/dashboard`} className="text-base font-semibold text-foreground">
            Editor de contenidos
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{author?.name}</span>
            <button
              onClick={signOut}
              className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
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

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center font-medium text-muted-foreground px-2 py-3 w-12">
                    <Pin className="h-3.5 w-3.5 mx-auto" />
                  </th>
                  <SortableHeader col="title" label="Título" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="category" label="Categoría" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-40" />
                  <SortableHeader col="published_at" label="Publicado" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-32" />
                  <SortableHeader col="updated_at" label="Editado" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-32" />
                  <SortableHeader col="status" label="Estado" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-28" />
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No se encontraron artículos
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${article.is_pinned ? "bg-amber-500/5" : ""}`}>
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
                      <td className="px-4 py-3 text-muted-foreground">
                        {wasEdited(article) && article.updated_at
                          ? format(new Date(article.updated_at), "d MMM yyyy", { locale: es })
                          : "—"}
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
                          <button
                            onClick={() => setDeleteTarget(article)}
                            className="inline-flex items-center h-8 px-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
              articles.map((article) => (
                <div key={article.id} className={`p-4 ${article.is_pinned ? "bg-amber-500/5" : ""}`}>
                  <div className="flex items-start gap-2">
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
                    {wasEdited(article) && article.updated_at && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          Ed. {format(new Date(article.updated_at), "d MMM yyyy", { locale: es })}
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
                    <button
                      onClick={() => setDeleteTarget(article)}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-foreground mb-2">Eliminar artículo</h2>
            <p className="text-sm text-muted-foreground mb-1">¿Estás seguro de que querés eliminar este artículo?</p>
            <p className="text-sm font-medium text-foreground mb-6 line-clamp-2">"{deleteTarget.title}"</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default Dashboard;
