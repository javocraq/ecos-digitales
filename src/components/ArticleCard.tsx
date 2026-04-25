import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import type { ArticleListing } from "@/hooks/useArticles";
import { usePrefetchArticle } from "@/hooks/useArticles";
import { formatCardDate } from "@/lib/formatCardDate";
import { OptimizedImage } from "./OptimizedImage";

interface ArticleCardProps {
  article: ArticleListing;
  variant?: "featured" | "side" | "grid" | "list";
  priority?: boolean;
}

export const ArticleCard = memo(({ article, variant = "grid", priority = false }: ArticleCardProps) => {
  const { title, category_name, featured_image_url, published_at, slug } = article;
  const formattedDate = formatCardDate(published_at);
  const prefetch = usePrefetchArticle();
  const handleMouseEnter = useCallback(() => prefetch(slug), [prefetch, slug]);

  // Featured card - Large center card with overlay text (no category below)
  if (variant === "featured") {
    return (
      <Link to={`/noticias/${slug}`} className="group block h-full" onMouseEnter={handleMouseEnter}>
        <article className="relative h-full min-h-[280px] sm:min-h-[400px] lg:min-h-[500px] overflow-hidden rounded-2xl">
          <OptimizedImage
            src={featured_image_url}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
            <h2 className="mb-2 sm:mb-3 text-xl font-bold leading-tight text-white sm:text-3xl lg:text-5xl line-clamp-3 group-hover:underline decoration-2 underline-offset-4">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80">{formattedDate}</p>
          </div>
        </article>
      </Link>
    );
  }

  // Side cards - Smaller stacked cards with overlay (no category below)
  if (variant === "side") {
    return (
      <Link to={`/noticias/${slug}`} className="group block h-full" onMouseEnter={handleMouseEnter}>
        <article className="relative h-full min-h-[280px] overflow-hidden rounded-xl">
          <OptimizedImage
            src={featured_image_url}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="mb-2 text-sm lg:text-base font-semibold leading-snug text-white line-clamp-3 group-hover:underline decoration-1 underline-offset-2">
              {title}
            </h3>
            <span className="inline-block bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded">
              {formattedDate}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  // List variant for related articles
  if (variant === "list") {
    return (
      <Link to={`/noticias/${slug}`} className="group block" onMouseEnter={handleMouseEnter}>
        <article className="flex gap-4 rounded-xl p-3 transition-colors hover:bg-secondary/50">
          <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg">
            <OptimizedImage
              src={featured_image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <h3 className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
              {title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">{category_name}</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Grid variant - Google Blog style: horizontal card with thumbnail on right
  return (
    <Link to={`/noticias/${slug}`} className="group block h-full">
      <article className="flex h-full items-start gap-4 rounded-xl border border-border bg-background p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover">
        {/* Content on left */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Category - hidden on mobile */}
          <span className="hidden sm:block text-[0.75rem] font-medium text-primary capitalize tracking-[0.5px] mb-2">{category_name}</span>
          {/* Title */}
          <h3 className="text-[0.9375rem] leading-[1.3] sm:text-base font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-3">
            {title}
          </h3>
          {/* Date at bottom */}
          <span className="text-[0.75rem] font-medium tracking-[0.5px] text-muted-foreground mt-auto pt-3">{formattedDate}</span>
        </div>
        {/* Thumbnail on right */}
        <div className="relative aspect-square w-24 sm:aspect-video sm:w-32 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
          <OptimizedImage
            src={featured_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
          />
        </div>
      </article>
    </Link>
  );
});
