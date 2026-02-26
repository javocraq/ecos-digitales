import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingGrid } from "@/components/LoadingGrid";
import { SEO } from "@/components/SEO";
import { useArticles, type ArticleListing } from "@/hooks/useArticles";
import { getExcerpt } from "@/lib/getExcerpt";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Search as SearchIcon } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  image?: string | null;
  date: string;
  slug: string;
}

const ArticleResultCard = ({ result }: { result: SearchResult }) => {
  const formattedDate = format(new Date(result.date), "d MMM", { locale: es }).toUpperCase();
  return (
    <Link to={`/noticias/${result.slug}`} className="group block">
      <article className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover sm:gap-6 sm:p-5">
        <div className="flex flex-1 flex-col min-w-0">
          <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2 sm:text-base">
            {result.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{result.description}</p>
          <span className="text-xs text-muted-foreground mt-auto pt-3">{formattedDate}</span>
        </div>
        {result.image && (
          <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <OptimizedImage
              src={result.image}
              alt={result.title}
              className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
            />
          </div>
        )}
      </article>
    </Link>
  );
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const { data: articles, isLoading } = useArticles();

  // Debounced URL sync (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim()) {
        setSearchParams({ q: localQuery }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchParams]);

  // Sync initial URL param
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== localQuery) {
      setLocalQuery(urlQuery);
    }
  }, []);

  const toResult = useCallback((article: ArticleListing): SearchResult => ({
    id: article.id,
    title: article.title,
    category: article.category_name,
    description: getExcerpt(article),
    image: article.featured_image_url,
    date: article.published_at,
    slug: article.slug,
  }), []);

  const { matchingArticles, recentArticles } = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    const articleResults: SearchResult[] = [];

    if (q && articles) {
      articles.forEach((article: ArticleListing) => {
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesCategory = article.category_name.toLowerCase().includes(q);
        const matchesExcerpt = article.excerpt?.toLowerCase().includes(q);
        if (matchesTitle || matchesCategory || matchesExcerpt) {
          articleResults.push(toResult(article));
        }
      });
    }

    const recent: SearchResult[] = (articles || []).slice(0, 6).map(toResult);
    return { matchingArticles: articleResults, recentArticles: recent };
  }, [localQuery, articles, toResult]);

  const hasQuery = localQuery.trim().length > 0;
  const showRecentArticles = hasQuery && matchingArticles.length === 0;
  const seoTitle = hasQuery ? `Buscar: ${localQuery}` : "Buscar";
  const seoDescription = hasQuery
    ? `Resultados de búsqueda para "${localQuery}" en Ecos Digitales`
    : "Busca artículos de tecnología en Ecos Digitales";

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} url="https://blog.nucleo.la/buscar" type="website" />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="container py-6">
            {/* Live search input */}
            <div className="relative mb-6">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar artículos..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                autoFocus
                className="h-12 w-full rounded-lg border border-border bg-background pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {isLoading ? (
              <LoadingGrid />
            ) : !hasQuery ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Escribe para buscar artículos</p>
              </div>
            ) : (
              <div className="space-y-8">
                {matchingArticles.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Noticias</h2>
                    <div className="flex flex-col gap-3">
                      {matchingArticles.map((result) => (
                        <ArticleResultCard key={`article-${result.id}`} result={result} />
                      ))}
                    </div>
                  </div>
                )}

                {showRecentArticles && recentArticles.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">Últimas noticias</h2>
                    <div className="flex flex-col gap-3">
                      {recentArticles.map((result) => (
                        <ArticleResultCard key={`recent-${result.id}`} result={result} />
                      ))}
                    </div>
                  </div>
                )}

                {matchingArticles.length === 0 && !showRecentArticles && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No se encontraron resultados para "{localQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Search;
