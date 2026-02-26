import type { ArticleListing } from "@/hooks/useArticles";

/**
 * Returns the excerpt for an article, falling back to content
 * if excerpt is empty/null (e.g. articles created by n8n).
 */
export const getExcerpt = (article: Pick<ArticleListing, "excerpt" | "content">): string => {
  if (article.excerpt) return article.excerpt;
  if (!article.content) return "";
  const text = article.content.replace(/<[^>]*>/g, "");
  const truncated = text.substring(0, 200);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
};
