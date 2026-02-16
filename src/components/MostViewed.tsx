import { Link } from "react-router-dom";
import { OptimizedImage } from "./OptimizedImage";
import { SectionHeader } from "./SectionHeader";
import { Skeleton } from "./ui/skeleton";
import type { Article } from "@/hooks/useArticles";

interface MostViewedProps {
  articles: Article[];
  isLoading?: boolean;
}

const MostViewedSkeleton = () => (
  <section className="container py-6 md:py-8">
    <div className="text-center mb-6">
      <Skeleton className="h-4 w-32 mx-auto mb-3" />
      <Skeleton className="h-px w-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-px w-10" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
      ))}
    </div>
  </section>
);

const MostViewedCard = ({ article }: { article: Article }) => {
  return (
    <Link
      to={`/noticias/${article.slug}`}
      className="group flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-3">
        <OptimizedImage
          src={article.image_url || ""}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm md:text-base font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>

      {/* Separator line */}
      <div className="w-8 h-0.5 bg-primary mb-2" />

      {/* Description - hidden on mobile for compactness */}
      {article.content && (
        <p className="hidden sm:block text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {article.content.replace(/<[^>]*>/g, "").slice(0, 150)}
        </p>
      )}

      {/* Author */}
      <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mt-auto">
        Por {article.author}
      </span>
    </Link>
  );
};

export const MostViewed = ({ articles, isLoading }: MostViewedProps) => {
  if (isLoading) return <MostViewedSkeleton />;
  if (!articles || articles.length === 0) return null;

  const displayArticles = articles.slice(0, 4);

  return (
    <section className="container py-6 md:py-8">
      <SectionHeader title="Lo más visto" />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {displayArticles.map((article) => (
          <MostViewedCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};
