import { Link } from "react-router-dom";
import type { Article } from "@/hooks/useArticles";

interface FeaturedHeadlinesProps {
  articles: Article[];
}

export const FeaturedHeadlines = ({ articles }: FeaturedHeadlinesProps) => {
  if (!articles || articles.length < 3) return null;

  const headlines = articles.slice(0, 3);

  return (
    <section className="bg-background py-8">
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
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.15em] text-primary/80 block mb-3">
                {article.category}
              </span>
              <h3 className="text-lg md:text-xl font-bold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
