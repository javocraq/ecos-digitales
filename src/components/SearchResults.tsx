import { useState } from "react";
import { Link } from "react-router-dom";
import type { Article } from "@/data/mockArticles";
import { formatCardDate } from "@/lib/formatCardDate";

interface SearchResultsProps {
  articles: Article[];
  query: string;
  allArticles?: Article[];
}

const SearchResultCard = ({ article }: { article: Article }) => {
  const { title, category, image_url, published_date, slug } = article;
  const formattedDate = formatCardDate(published_date);

  return (
    <Link to={`/noticias/${slug}`} className="group block">
      <article className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover sm:gap-6 sm:p-5">
        {/* Content on left */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Category - hidden on mobile */}
          <span className="hidden sm:block text-xs font-medium text-primary uppercase tracking-wide mb-2">{category}</span>
          {/* Title */}
          <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-3 sm:text-base">
            {title}
          </h3>
          {/* Date at bottom */}
          <span className="text-xs text-muted-foreground mt-auto pt-3">{formattedDate}</span>
        </div>
        {/* Thumbnail on right */}
        <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <img
            src={image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
          />
        </div>
      </article>
    </Link>
  );
};

export const SearchResults = ({ articles, query, allArticles = [] }: SearchResultsProps) => {
  const ARTICLES_PER_PAGE = 9;
  const [displayCount, setDisplayCount] = useState(ARTICLES_PER_PAGE);
  
  const displayedArticles = articles.slice(0, displayCount);
  const hasMore = displayCount < articles.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ARTICLES_PER_PAGE);
  };

  // Get suggested articles when no results found
  const suggestedArticles = allArticles.slice(0, 6);

  if (articles.length === 0) {
    return (
      <section className="container py-8 flex-1">
        <p className="text-lg text-muted-foreground text-center mb-8">
          No se encontraron artículos para "{query}"
        </p>
        
        {suggestedArticles.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Te puede interesar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedArticles.map((article) => (
                <SearchResultCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="container py-6 flex-1">
      {/* Results count */}
      <p className="mb-6 text-sm text-muted-foreground">
        {articles.length} resultado{articles.length !== 1 ? "s" : ""} para "{query}"
      </p>

      {/* Results list - full width rows */}
      <div className="flex flex-col gap-3">
        {displayedArticles.map((article) => (
          <SearchResultCard key={article.id} article={article} />
        ))}
      </div>

      {/* Load more button - always visible */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleLoadMore}
          disabled={!hasMore}
          className="rounded-full border border-border bg-card px-8 py-3 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-foreground"
        >
          {hasMore ? "Cargar más resultados" : "No hay más resultados"}
        </button>
      </div>
    </section>
  );
};
