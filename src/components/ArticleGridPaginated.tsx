import { useState } from "react";
import { Link } from "react-router-dom";
import { ArticleCard } from "./ArticleCard";
import { OptimizedImage } from "./OptimizedImage";
import { Button } from "./ui/button";
import type { ArticleListing } from "@/hooks/useArticles";
import { formatCardDate } from "@/lib/formatCardDate";

interface ArticleGridPaginatedProps {
  articles: ArticleListing[];
  articlesPerPage?: number;
}

export const ArticleGridPaginated = ({
  articles,
  articlesPerPage = 9,
}: ArticleGridPaginatedProps) => {
  const [visibleCount, setVisibleCount] = useState(articlesPerPage);
  
  const visibleArticles = articles.slice(0, visibleCount);
  const hasMoreArticles = visibleCount < articles.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + articlesPerPage, articles.length));
  };

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No hay artículos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mobile: Compact list style (like LatestNewsWidget) */}
      <div className="block sm:hidden space-y-[24px]">
        {visibleArticles.map((article) => {
          const formattedDate = formatCardDate(article.published_at);
          
          return (
            <Link
              key={article.id}
              to={`/noticias/${article.slug}`}
              className="group flex gap-4 rounded-xl p-2 transition-colors hover:bg-secondary/50"
            >
              <div className="relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                <OptimizedImage
                  src={article.featured_image_url}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="96px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary leading-[1.3]">
                  {article.title}
                </h4>
                <span className="text-[0.75rem] font-medium tracking-[0.5px] text-muted-foreground">{formattedDate}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop/Tablet: Grid style */}
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="grid"
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMoreArticles && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            className="px-8"
          >
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
};
