import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/OptimizedImage";
import type { ArticleListing } from "@/hooks/useArticles";
import { formatCardDate } from "@/lib/formatCardDate";

interface RelatedArticlesProps {
  articles: ArticleListing[];
}

const ITEMS_PER_PAGE = 3;

export const RelatedArticles = ({ articles }: RelatedArticlesProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Limit to 9 articles max
  const limitedArticles = articles.slice(0, 9);
  const totalPages = Math.ceil(limitedArticles.length / ITEMS_PER_PAGE);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleArticles = limitedArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (limitedArticles.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setSlideDirection('left');
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setSlideDirection('right');
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const showNavigation = totalPages > 1;

  return (
    <section className="border-t border-border pt-12 mt-12">
      {/* Mobile: Title without arrows */}
      <h2 className="sm:hidden text-2xl font-semibold text-foreground text-center mb-8">
        Artículos relacionados
      </h2>
      
      {/* Desktop: Title with arrows */}
      <div className="hidden sm:flex items-center justify-between mb-8">
        {showNavigation && currentPage > 0 ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            className="h-10 w-10 rounded-full"
            aria-label="Artículos anteriores"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10 h-10" />
        )}
        
        <h2 className="flex-1 text-2xl font-semibold text-foreground text-center">
          Artículos relacionados
        </h2>
        
        {showNavigation && currentPage < totalPages - 1 ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="h-10 w-10 rounded-full"
            aria-label="Más artículos"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
      
      {/* Mobile: All articles in vertical list (no pagination) */}
      <div className="grid gap-4 sm:hidden">
        {limitedArticles.map((article) => (
          <MobileRelatedCard key={article.id} article={article} />
        ))}
      </div>
      
      {/* Desktop: Paginated cards with smooth slide animation */}
      <div className="carousel-container hidden sm:block">
        <div 
          key={`desktop-${currentPage}`} 
          className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
            slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          }`}
        >
          {visibleArticles.map((article) => (
            <DesktopRelatedCard key={article.id} article={article} />
          ))}
        </div>
      </div>

      {/* Page indicator - desktop only */}
      {showNavigation && (
        <div className="hidden sm:flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentPage ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Ir a página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

// Mobile card - Same style as "Últimas noticias"
const MobileRelatedCard = ({ article }: { article: ArticleListing }) => {
  const { title, published_at, slug, featured_image_url } = article;
  const formattedDate = formatCardDate(published_at);

  return (
    <Link to={`/noticias/${slug}`} className="group block">
      <article className="flex items-start gap-4 rounded-xl border border-border bg-background p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover">
        <div className="flex flex-1 flex-col min-w-0">
          <h3 className="text-base font-medium leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-3">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground mt-auto pt-3">{formattedDate}</span>
        </div>
        <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <OptimizedImage
            src={featured_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
            sizes="96px"
          />
        </div>
      </article>
    </Link>
  );
};

// Desktop card - Original large card design
const DesktopRelatedCard = ({ article }: { article: ArticleListing }) => {
  const { title, category_name, featured_image_url, published_at, slug } = article;
  const formattedDate = format(new Date(published_at), "d MMM, yyyy", { locale: es });

  return (
    <Link to={`/noticias/${slug}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <OptimizedImage
            src={featured_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-[450ms] group-hover:scale-[1.048]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {category_name}
          </span>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <div className="mt-auto flex items-end justify-between pt-5 text-sm text-muted-foreground">
            <div className="flex flex-col">
              
              <span>{formattedDate}</span>
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
};
