import { Link } from "react-router-dom";
import { Article } from "@/hooks/useArticles";

interface CrossCategoryArticlesProps {
  articles: Article[];
  currentCategory: string;
  currentSlug: string;
}

export const CrossCategoryArticles = ({ articles, currentCategory, currentSlug }: CrossCategoryArticlesProps) => {
  // Get articles from OTHER categories for internal linking diversity
  const crossCategoryArticles = articles
    .filter(a => a.category !== currentCategory && a.slug !== currentSlug)
    .slice(0, 4);

  if (crossCategoryArticles.length === 0) return null;

  return (
    <div className="mt-12 border-t border-border pt-8">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Lee también</h3>
      <ul className="space-y-3">
        {crossCategoryArticles.map(article => (
          <li key={article.slug}>
            <Link
              to={`/noticias/${article.slug}`}
              className="text-[15px] text-foreground/80 hover:text-primary transition-colors"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
