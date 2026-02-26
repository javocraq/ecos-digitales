import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

// Lightweight article for listings (home, grid, cards)
export interface ArticleListing {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  published_at: string;
  reading_time_minutes: number;
  is_pinned: boolean;
  pinned_order: number;
  category_name: string;
  author_name: string;
}

// Full article for detail page
export interface Article extends ArticleListing {
  subtitle: string | null;
  content: string;
  updated_at: string;
  created_at: string;
  status: string;
  views: number;
  likes: number;
  clicks: number;
  is_featured: boolean;
  is_trending: boolean;
  article_tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

// Only request what listings need — no content, no heavy fields
const LISTING_SELECT = `
  id, slug, title, excerpt, content,
  featured_image_url, featured_image_alt,
  published_at, reading_time_minutes,
  is_pinned, pinned_order,
  authors ( name ),
  categories ( name )
`;

const ARTICLE_SELECT = `
  id, slug, title, subtitle, content, excerpt,
  featured_image_url, featured_image_alt,
  published_at, updated_at, created_at,
  status, views, likes, clicks, reading_time_minutes,
  is_featured, is_trending, is_pinned, pinned_order,
  article_tags,
  meta_title, meta_description, og_image_url,
  authors ( name ),
  categories ( name )
`;

interface ListingRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  published_at: string;
  reading_time_minutes: number;
  is_pinned: boolean;
  pinned_order: number;
  authors: { name: string } | null;
  categories: { name: string } | null;
}

interface ArticleRow extends ListingRow {
  subtitle: string | null;
  content: string;
  updated_at: string;
  created_at: string;
  status: string;
  views: number;
  likes: number;
  clicks: number;
  is_featured: boolean;
  is_trending: boolean;
  article_tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

function mapListingRow(row: ListingRow): ArticleListing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    featured_image_url: row.featured_image_url,
    featured_image_alt: row.featured_image_alt,
    published_at: row.published_at,
    reading_time_minutes: row.reading_time_minutes,
    is_pinned: row.is_pinned,
    pinned_order: row.pinned_order,
    author_name: row.authors?.name ?? "Redacción",
    category_name: row.categories?.name ?? "General",
  };
}

function mapArticleRow(row: ArticleRow): Article {
  return {
    ...mapListingRow(row),
    subtitle: row.subtitle,
    content: row.content,
    updated_at: row.updated_at,
    created_at: row.created_at,
    status: row.status,
    views: row.views,
    likes: row.likes,
    clicks: row.clicks,
    is_featured: row.is_featured,
    is_trending: row.is_trending,
    article_tags: row.article_tags,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    og_image_url: row.og_image_url,
  };
}

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async (): Promise<ArticleListing[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select(LISTING_SELECT)
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("is_pinned", { ascending: false })
        .order("pinned_order", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false });

      if (error) {
        throw new Error(`Error fetching articles: ${error.message}`);
      }

      return (data as ListingRow[]).map(mapListingRow);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(`Error fetching article: ${error.message}`);
      }

      return data ? mapArticleRow(data as ArticleRow) : null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCategories = () => {
  const { data: articles } = useArticles();

  const categories = articles
    ? [...new Set(articles.map((a) => a.category_name))].sort()
    : [];

  return categories;
};

// Prefetch hook for hover-based prefetching
export const usePrefetchArticle = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: ["article", slug],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("articles")
            .select(ARTICLE_SELECT)
            .eq("slug", slug)
            .eq("status", "published")
            .single();

          if (error) return null;
          return data ? mapArticleRow(data as ArticleRow) : null;
        },
        staleTime: 1000 * 60 * 5,
      });
    },
    [queryClient]
  );
};
