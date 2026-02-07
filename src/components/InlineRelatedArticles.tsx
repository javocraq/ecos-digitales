import { Link } from "react-router-dom";
import { Article } from "@/hooks/useArticles";

interface InlineRelatedArticlesProps {
  articles: Article[];
  currentSlug: string;
}

export const InlineRelatedArticles = ({ articles, currentSlug }: InlineRelatedArticlesProps) => {
  if (articles.length === 0) return null;

  const displayed = articles.filter(a => a.slug !== currentSlug).slice(0, 2);
  if (displayed.length === 0) return null;

  return (
    <aside className="my-10 rounded-xl border border-border bg-muted/30 p-5">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Te puede interesar
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {displayed.map(article => (
          <Link
            key={article.slug}
            to={`/noticias/${article.slug}`}
            className="group flex gap-3 rounded-lg transition-colors hover:bg-muted/60"
          >
            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className="h-16 w-24 flex-shrink-0 rounded-md object-cover"
                loading="lazy"
              />
            )}
            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
};
