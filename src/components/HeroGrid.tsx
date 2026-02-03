import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OptimizedImage } from "./OptimizedImage";
import { Skeleton } from "./ui/skeleton";
import type { Article } from "@/hooks/useArticles";

// Helper to format date with relative time for recent articles
const formatArticleDate = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  
  // Check if it's the same day
  const isSameDay = 
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();
  
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
  return format(date, "d MMM", { locale: es });
};

interface HeroGridProps {
  articles: Article[];
  isLoading?: boolean;
}

// Skeleton for loading state
const HeroGridSkeleton = () => (
  <section className="container py-6 md:py-8">
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      {/* Main article skeleton */}
      <Skeleton className="aspect-[16/10] rounded-xl" />
      
      {/* Secondary articles skeleton */}
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="flex gap-4 p-4 rounded-lg border border-border bg-card opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Large featured article card
const ArticleCardLarge = ({ article }: { article: Article }) => {
  const formattedDate = format(new Date(article.published_date), "d MMM yyyy", { locale: es });

  return (
    <Link 
      to={`/noticias/${article.slug}`}
      className="group relative block overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src={article.image_url || ""}
            alt={article.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
            priority
            sizes="(max-width: 1024px) 100vw, 65vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {/* Date badge - hidden on mobile */}
          <span className="hidden md:inline-block px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full mb-4">
            {formattedDate}
          </span>
          
          {/* Large title */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 group-hover:underline decoration-2 underline-offset-4">
            {article.title}
          </h2>
        </div>
      </div>
    </Link>
  );
};

// Small secondary article card
const ArticleCardSmall = ({ article }: { article: Article }) => {
  const formattedDate = formatArticleDate(article.published_date);

  return (
    <Link
      to={`/noticias/${article.slug}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <OptimizedImage
            src={article.image_url || ""}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            sizes="96px"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title */}
          <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          
          {/* Date only */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="tracking-wide font-medium text-primary/80">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const HeroGrid = ({ articles, isLoading }: HeroGridProps) => {
  if (isLoading) {
    return <HeroGridSkeleton />;
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  // Separate featured article and side articles
  const [featuredArticle, ...sideArticles] = articles.slice(0, 5);

  return (
    <section className="container py-6 md:py-8">
      {/* Desktop & Tablet: 2 column grid */}
      <div className="hidden md:grid md:grid-cols-[3fr_2fr] lg:grid-cols-[2fr_1fr] gap-6">
        {/* Featured article (large) */}
        <ArticleCardLarge article={featuredArticle} />
        
        {/* Secondary articles (4 small, stacked, vertically centered) */}
        <div className="flex flex-col justify-center gap-4">
          {sideArticles.slice(0, 4).map((article) => (
            <ArticleCardSmall key={article.id} article={article} />
          ))}
        </div>
      </div>

      {/* Mobile: Stack layout */}
      <div className="md:hidden flex flex-col gap-6">
        {/* Featured article */}
        <ArticleCardLarge article={featuredArticle} />
        
        {/* Secondary articles */}
        <div className="flex flex-col gap-4">
          {sideArticles.slice(0, 4).map((article) => (
            <ArticleCardSmall key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};
