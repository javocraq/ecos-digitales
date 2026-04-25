import { Link } from "react-router-dom";
import { ArticleListing } from "@/hooks/useArticles";
import { OptimizedImage } from "./OptimizedImage";
import { formatCardDate } from "@/lib/formatCardDate";

interface InlineRelatedArticlesProps {
  articles: ArticleListing[];
  currentSlug: string;
}

export const InlineRelatedArticles = ({ articles, currentSlug }: InlineRelatedArticlesProps) => {
  const displayed = articles.filter(a => a.slug !== currentSlug).slice(0, 3);
  if (displayed.length === 0) return null;

  return (
    <aside className="my-12 md:my-16 relative rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 via-background to-muted/30 p-6 sm:p-8 md:p-10 overflow-hidden">
      {/* Decorative accent line */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Section header */}
      <div className="flex items-center gap-3 mb-3 md:mb-4">
        <div className="w-1 h-5 rounded-full bg-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Te puede interesar
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-0">
        {displayed.map((article, index) => {
          const formattedDate = formatCardDate(article.published_at);

          return (
            <div key={article.slug}>
              {index > 0 && (
                <div className="my-4 md:my-5 h-px bg-gradient-to-r from-border/80 via-border/40 to-transparent" />
              )}
              <Link
                to={`/noticias/${article.slug}`}
                className="group flex items-center gap-4 md:gap-5 no-underline rounded-xl p-1 -m-1 transition-colors duration-200 hover:bg-muted/40"
              >
                {/* Thumbnail — fixed size, image covers entire container */}
                <div className="relative w-[72px] h-[72px] min-w-[72px] min-h-[72px] md:w-24 md:h-24 md:min-w-[96px] md:min-h-[96px] flex-shrink-0 rounded-lg overflow-hidden">
                  {article.featured_image_url ? (
                    <img
                      src={article.featured_image_url}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                  <h4 className="text-[14px] md:text-[15px] font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-[10px] font-semibold capitalize tracking-wide text-primary/80 bg-primary/8 px-2 py-0.5 rounded-md">
                      {article.category_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
