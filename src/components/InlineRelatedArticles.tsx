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
            className="group flex flex-row items-center gap-3"
          >
            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                width={80}
                height={48}
                className="block rounded object-cover"
                style={{ width: 88, height: 53, flexShrink: 0 }}
                loading="lazy"
              />
            )}
            <span className="text-sm lg:text-[17px] font-medium leading-snug text-foreground group-hover:text-primary transition-colors no-underline line-clamp-2">
              {article.title}
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
};
