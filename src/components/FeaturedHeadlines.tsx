import { Link } from "react-router-dom";
import type { ArticleListing } from "@/hooks/useArticles";

interface FeaturedHeadlinesProps {
  articles: ArticleListing[];
}

export const FeaturedHeadlines = ({ articles }: FeaturedHeadlinesProps) => {
  if (!articles || articles.length < 3) return null;

  const headlines = articles.slice(0, 3);

  return (
    <section className="bg-background pt-8 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {headlines.map((article, index) => (
            <Link
              key={article.id}
              to={`/noticias/${article.slug}`}
              className={`group block px-0 md:px-6 py-4 md:py-0 ${
                index < 2 ? "md:border-r md:border-border" : ""
              } ${index > 0 ? "border-t md:border-t-0 border-border" : ""}`}
            >
              <span className="text-[10px] font-medium capitalize tracking-[1px] text-primary/80 block mb-[6px]">
                {article.category_name}
              </span>
              <h3 className="text-[16px] leading-[1.4] font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mt-2">
                {article.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
