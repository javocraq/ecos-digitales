import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OptimizedImage } from "./OptimizedImage";
import { Skeleton } from "./ui/skeleton";
import type { ArticleListing } from "@/hooks/useArticles";
import { getExcerpt } from "@/lib/getExcerpt";

// Helper to format date with relative time for recent articles
const formatArticleDate = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);

  // Check if it's the same day
  const isSameDay = now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear();
  if (isSameDay) {
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffMinutes < 1) {
      return "hace un momento";
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
    } else {
      return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    }
  }

  // Different day: show fixed date
  return format(date, "d MMM", {
    locale: es
  });
};
interface HeroGridProps {
  articles: ArticleListing[];
  isLoading?: boolean;
}

// Skeleton for loading state
const HeroGridSkeleton = () => <section className="container py-6 md:py-8">
    <div className="grid md:grid-cols-[60%_40%] gap-6">
      {/* Main article skeleton */}
      <Skeleton className="h-[500px] rounded-xl" />
      
      {/* Secondary articles skeleton */}
      <div className="grid grid-rows-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="flex gap-4 p-4 rounded-lg border border-border bg-card opacity-0 animate-fade-in" style={{
        animationDelay: `${i * 100}ms`
      }}>
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          </div>)}
      </div>
    </div>
  </section>;

// Large featured article card
const ArticleCardLarge = ({
  article
}: {
  article: ArticleListing;
}) => {
  const formattedDate = format(new Date(article.published_at), "d MMM yyyy", {
    locale: es
  });
  return <Link to={`/noticias/${article.slug}`} className="group relative block overflow-hidden rounded-xl md:shadow-none md:hover:shadow-none shadow-lg hover:shadow-xl transition-shadow h-full">
      {/* Mobile: overlay text on image */}
      <div className="md:hidden relative h-full min-h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage src={article.featured_image_url || ""} alt={article.title} className="w-full h-full object-cover rounded-xl transition-all duration-500 group-hover:scale-105 group-hover:brightness-110" priority sizes="100vw" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-[1.25rem] leading-[1.3] font-bold text-white mb-3">
            {article.title}
          </h2>
        </div>
      </div>

      {/* Desktop: text below image */}
      <div className="hidden md:flex md:flex-col h-full">
        <div className="relative h-[420px] overflow-hidden rounded-xl">
          <OptimizedImage src={article.featured_image_url || ""} alt={article.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110" priority sizes="65vw" />
        </div>
        <div className="pt-3">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          {getExcerpt(article) && (
            <p className="mt-2 text-[0.9375rem] leading-[1.5] text-muted-foreground line-clamp-2">
              {getExcerpt(article).replace(/<[^>]*>/g, "")}
            </p>
          )}
        </div>
      </div>
    </Link>;
};

// Small secondary article card (mobile: horizontal, desktop: vertical like reference)
const ArticleCardSmall = ({
  article
}: {
  article: ArticleListing;
}) => {
  const formattedDate = formatArticleDate(article.published_at);
  return <Link to={`/noticias/${article.slug}`} className="group relative block overflow-hidden rounded-xl border border-border md:border-0 bg-card md:bg-transparent shadow-sm md:shadow-none hover:shadow-md md:hover:shadow-none hover:border-primary/30 transition-all md:h-full md:flex md:flex-col">
      {/* Mobile: horizontal layout */}
      <div className="md:hidden flex items-center gap-4 p-3">
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
          <OptimizedImage src={article.featured_image_url || ""} alt={article.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105" sizes="96px" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.5px] text-muted-foreground">
            <span className="text-primary/80">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Desktop: overlay layout like TechCrunch */}
      <div className="hidden md:block relative flex-1 overflow-hidden rounded-xl">
        <OptimizedImage src={article.featured_image_url || ""} alt={article.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110" sizes="(max-width: 1024px) 50vw, 20vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="w-8 h-0.5 bg-white mb-2" />
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.5px] text-white/70 mb-1 block">
            {article.category_name}
          </span>
          <h3 className="text-lg font-bold text-white line-clamp-3 mb-2">
            {article.title}
          </h3>
        </div>
      </div>
    </Link>;
};
export const HeroGrid = ({
  articles,
  isLoading
}: HeroGridProps) => {
  if (isLoading) {
    return <HeroGridSkeleton />;
  }
  if (!articles || articles.length === 0) {
    return null;
  }

  // Separate featured article and side articles
  const [featuredArticle, ...sideArticles] = articles.slice(0, 5);
  return <section className="container py-6 md:py-8">
      {/* Desktop & Tablet: 2 column grid (60% / 40%) */}
      <div className="hidden md:grid md:grid-cols-[60%_1fr] gap-6">
        {/* Featured article (large) */}
        <ArticleCardLarge article={featuredArticle} />
        
        {/* Secondary articles (2 side articles) */}
        <div className="flex flex-col justify-center gap-4">
          {sideArticles.slice(0, 2).map(article => <ArticleCardSmall key={article.id} article={article} />)}
        </div>
      </div>

      {/* Mobile: Stack layout */}
      <div className="md:hidden flex flex-col gap-6">
        {/* Featured article */}
        <ArticleCardLarge article={featuredArticle} />
        
        {/* Secondary articles */}
        <div className="flex flex-col gap-[24px]">
          {sideArticles.slice(0, 4).map(article => <ArticleCardSmall key={article.id} article={article} />)}
        </div>
      </div>
    </section>;
};