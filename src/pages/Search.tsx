import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingGrid } from "@/components/LoadingGrid";
import { SEO } from "@/components/SEO";
import { useArticles, type Article } from "@/hooks/useArticles";
import { useJobs, type Job, formatRelativeDate } from "@/hooks/useJobs";
import { Briefcase, Newspaper, Search as SearchIcon } from "lucide-react";

type SearchResultType = "article" | "job";

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  category: string;
  description: string;
  image?: string | null;
  date: string;
  slug: string;
  company?: string;
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
            <img
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

const JobResultCard = ({ result }: { result: SearchResult }) => {
  const relativeDate = formatRelativeDate(result.date);

  return (
    <Link to={`/trabajos/${result.slug}`} className="group block">
      <article className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover sm:gap-6 sm:p-5">
        <div className="flex flex-1 flex-col min-w-0">
          <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2 sm:text-base">
            {result.title}
          </h3>
          {result.company && (
            <p className="text-xs text-muted-foreground mt-0.5">{result.company}</p>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{result.description}</p>
          <span className="text-xs text-muted-foreground mt-auto pt-3">{relativeDate}</span>
        </div>
        {result.image && (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <img
              src={result.image}
              alt={result.company || result.title}
              className="h-full w-full object-contain p-2"
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
  
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: jobs, isLoading: jobsLoading } = useJobs();
  
  const isLoading = articlesLoading || jobsLoading;

  // Sync URL with local query for live search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim()) {
        setSearchParams({ q: localQuery }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchParams]);

  // Sync initial URL param
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== localQuery) {
      setLocalQuery(urlQuery);
    }
  }, []);

  const { matchingJobs, matchingArticles, recentArticles } = useMemo(() => {
    const q = localQuery.toLowerCase().trim();
    
    const jobResults: SearchResult[] = [];
    const articleResults: SearchResult[] = [];
    
    if (q && jobs) {
      jobs.forEach((job: Job) => {
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCategory = job.category.toLowerCase().includes(q);
        const matchesDescription = job.description.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        
        if (matchesTitle || matchesCategory || matchesDescription || matchesCompany) {
          jobResults.push({
            type: "job",
            id: job.id,
            title: job.title,
            category: job.category,
            description: job.short_description || job.description.slice(0, 150) + "...",
            image: job.company_logo,
            date: job.published_date,
            slug: job.slug,
            company: job.company,
          });
        }
      });
    }
    
    if (q && articles) {
      articles.forEach((article: Article) => {
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesCategory = article.category.toLowerCase().includes(q);
        const matchesContent = article.content.toLowerCase().includes(q);
        
        if (matchesTitle || matchesCategory || matchesContent) {
          articleResults.push({
            type: "article",
            id: article.id,
            title: article.title,
            category: article.category,
            description: article.content.slice(0, 150).replace(/[#*_]/g, "") + "...",
            image: article.image_url,
            date: article.published_date,
            slug: article.slug,
          });
        }
      });
    }
    
    // Get recent articles (first 6) when no article matches
    const recent: SearchResult[] = (articles || []).slice(0, 6).map((article: Article) => ({
      type: "article" as const,
      id: article.id,
      title: article.title,
      category: article.category,
      description: article.content.slice(0, 150).replace(/[#*_]/g, "") + "...",
      image: article.image_url,
      date: article.published_date,
      slug: article.slug,
    }));
    
    return {
      matchingJobs: jobResults,
      matchingArticles: articleResults,
      recentArticles: recent,
    };
  }, [localQuery, articles, jobs]);

  const hasQuery = localQuery.trim().length > 0;
  const showRecentArticles = hasQuery && matchingArticles.length === 0;

  const seoTitle = hasQuery ? `Buscar: ${localQuery}` : "Buscar";
  const seoDescription = hasQuery 
    ? `Resultados de búsqueda para "${localQuery}" - Encuentra artículos y trabajos tech en Nucleo`
    : "Busca artículos de tecnología y oportunidades laborales en Nucleo";

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url="https://serif-stream.lovable.app/buscar"
        type="website"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
      
      <main className="flex-1">
        <section className="container py-6">
          {/* Live search input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar artículos y trabajos..."
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
              <p className="text-muted-foreground">
                Escribe para buscar artículos y trabajos
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Matching Jobs */}
              {matchingJobs.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Trabajos ({matchingJobs.length})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {matchingJobs.map((result) => (
                      <JobResultCard key={`job-${result.id}`} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Articles */}
              {matchingArticles.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Noticias
                  </h2>
                  <div className="flex flex-col gap-3">
                    {matchingArticles.map((result) => (
                      <ArticleResultCard key={`article-${result.id}`} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Articles when no article matches */}
              {showRecentArticles && recentArticles.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Últimas noticias
                  </h2>
                  <div className="flex flex-col gap-3">
                    {recentArticles.map((result) => (
                      <ArticleResultCard key={`recent-${result.id}`} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {/* No results at all */}
              {matchingJobs.length === 0 && matchingArticles.length === 0 && !showRecentArticles && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No se encontraron resultados para "{localQuery}"
                  </p>
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
