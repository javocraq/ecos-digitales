import { useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";

const formatArticleDate = (dateString: string): string => {
  const publishedDate = new Date(dateString);
  const now = new Date();
  const hoursDiff = differenceInHours(now, publishedDate);
  
  if (hoursDiff < 24) {
    return formatDistanceToNow(publishedDate, { addSuffix: true, locale: es })
      .replace("alrededor de ", "");
  }
  
  return format(publishedDate, "d MMM", { locale: es }).toUpperCase();
};
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "../OptimizedImage";
import { useIsMobile } from "@/hooks/use-mobile";

export const LatestNewsWidget = () => {
  const { data: articles, isLoading } = useArticles();
  const isMobile = useIsMobile();
  const [mobileVisibleCount, setMobileVisibleCount] = useState(5);
  
  // Desktop: 10 items, Mobile: controlled by state
  const maxItems = isMobile ? mobileVisibleCount : 10;
  const latestArticles = articles?.slice(0, maxItems) || [];
  const hasMoreMobile = isMobile && articles && mobileVisibleCount < articles.length;

  const handleLoadMore = () => {
    setMobileVisibleCount((prev) => prev + 5);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Últimas Noticias</h3>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-14 w-20 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (latestArticles.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Últimas Noticias</h3>
      <div className="space-y-3">
        {latestArticles.map((article) => {
          const formattedDate = formatArticleDate(article.published_date);
          
          return (
            <Link
              key={article.id}
              to={`/noticias/${article.slug}`}
              className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
            >
              <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <OptimizedImage
                  src={article.image_url}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <h4 className="line-clamp-2 text-xs font-medium text-foreground transition-colors group-hover:text-primary leading-tight">
                  {article.title}
                </h4>
                <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Load more button - only on mobile */}
      {hasMoreMobile && (
        <button
          onClick={handleLoadMore}
          className="mt-4 w-full rounded-lg border border-border bg-card py-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Cargar más noticias
        </button>
      )}
    </div>
  );
};
