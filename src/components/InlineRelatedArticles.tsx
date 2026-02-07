import { Link } from "react-router-dom";
import { Article } from "@/hooks/useArticles";

interface InlineRelatedArticlesProps {
  articles: Article[];
  currentSlug: string;
}

export const InlineRelatedArticles = ({ articles, currentSlug }: InlineRelatedArticlesProps) => {
  const displayed = articles.filter(a => a.slug !== currentSlug).slice(0, 2);
  if (displayed.length === 0) return null;

  return (
    <aside className="my-10 rounded-lg border-l-4 border-primary bg-muted/40 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Te puede interesar
      </p>
      <div className="flex flex-col gap-4">
        {displayed.map(article => (
          <Link
            key={article.slug}
            to={`/noticias/${article.slug}`}
            className="group flex flex-row items-start gap-4 no-underline"
          >
            {/* Mobile: text left + image right (like Artículos relacionados). Desktop: image left + text right */}
            <div className="flex-1 min-w-0 sm:order-2">
              <span className="text-base sm:text-sm sm:lg:text-[17px] font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3 no-underline decoration-transparent">
                {article.title}
              </span>
            </div>
            {article.image_url && (
              <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:order-1 sm:h-auto sm:w-auto">
                <img
                  src={article.image_url}
                  alt=""
                  className="h-full w-full object-cover sm:rounded"
                  style={{ minWidth: 88, minHeight: 53 }}
                  loading="lazy"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </aside>
  );
};
