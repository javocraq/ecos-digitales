import { useQuery } from "@tanstack/react-query";

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  image_source?: string | null;
  author: string;
  published_date: string;
  reading_time: number;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

 const N8N_API_URL = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/articles";

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async (): Promise<Article[]> => {
      const response = await fetch(N8N_API_URL);
      
      if (!response.ok) {
        throw new Error(`Error fetching articles: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        console.warn("API did not return an array");
        return [];
      }
      
      // Filter only published articles and sort by date
      const publishedArticles = data
        .filter((article): article is Article => 
          article && 
          typeof article === "object" && 
          article.status === "published" &&
          typeof article.title === "string" &&
          typeof article.slug === "string"
        )
        .sort((a, b) => 
          new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        );
      
      return publishedArticles;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async (): Promise<Article | null> => {
      const response = await fetch(N8N_API_URL);
      
      if (!response.ok) {
        throw new Error(`Error fetching article: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        return null;
      }
      
      const article = data.find(
        (a) => a && a.slug === slug && a.status === "published"
      );
      
      return article || null;
    },
    enabled: !!slug,
  });
};

export const useCategories = () => {
  const { data: articles } = useArticles();
  
  const categories = articles
    ? [...new Set(articles.map((a) => a.category))].sort()
    : [];
  
  return categories;
};
