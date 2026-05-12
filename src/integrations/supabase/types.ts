export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          legacy_id: number | null
          slug: string
          title: string
          subtitle: string | null
          content: string
          excerpt: string | null
          author_id: string
          category_id: string
          featured_image_url: string | null
          featured_image_alt: string | null
          video_platform: string | null
          video_code: string | null
          video_embed_url: string | null
          published_at: string
          updated_at: string
          created_at: string
          status: string
          views: number
          likes: number
          clicks: number
          reading_time_minutes: number
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          og_image_url: string | null
          is_featured: boolean
          is_trending: boolean
          search_vector: string | null
          article_tags: string[] | null
        }
        Insert: {
          id?: string
          legacy_id?: number | null
          slug: string
          title: string
          subtitle?: string | null
          content: string
          excerpt?: string | null
          author_id: string
          category_id: string
          featured_image_url?: string | null
          featured_image_alt?: string | null
          video_platform?: string | null
          video_code?: string | null
          video_embed_url?: string | null
          published_at?: string
          updated_at?: string
          created_at?: string
          status?: string
          views?: number
          likes?: number
          clicks?: number
          reading_time_minutes?: number
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          og_image_url?: string | null
          is_featured?: boolean
          is_trending?: boolean
          article_tags?: string[] | null
        }
        Update: {
          id?: string
          legacy_id?: number | null
          slug?: string
          title?: string
          subtitle?: string | null
          content?: string
          excerpt?: string | null
          author_id?: string
          category_id?: string
          featured_image_url?: string | null
          featured_image_alt?: string | null
          video_platform?: string | null
          video_code?: string | null
          video_embed_url?: string | null
          published_at?: string
          updated_at?: string
          created_at?: string
          status?: string
          views?: number
          likes?: number
          clicks?: number
          reading_time_minutes?: number
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          og_image_url?: string | null
          is_featured?: boolean
          is_trending?: boolean
          article_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      authors: {
        Row: {
          id: string
          name: string
          slug: string
          email: string | null
          bio: string | null
          avatar_url: string | null
          twitter_handle: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          email?: string | null
          bio?: string | null
          avatar_url?: string | null
          twitter_handle?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          email?: string | null
          bio?: string | null
          avatar_url?: string | null
          twitter_handle?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string
          tagline: string | null
          website_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url: string
          tagline?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string
          tagline?: string | null
          website_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      editions: {
        Row: {
          id: string
          slug: string
          year: number
          month: number
          edition_number: number | null
          title: string | null
          hero_description: string
          cover_image_url: string | null
          meta_title: string | null
          meta_description: string | null
          sponsor_id: string | null
          sponsored_article_id: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          year: number
          month: number
          edition_number?: number | null
          title?: string | null
          hero_description: string
          cover_image_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          sponsor_id?: string | null
          sponsored_article_id?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          year?: number
          month?: number
          edition_number?: number | null
          title?: string | null
          hero_description?: string
          cover_image_url?: string | null
          meta_title?: string | null
          meta_description?: string | null
          sponsor_id?: string | null
          sponsored_article_id?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editions_sponsor_id_fkey"
            columns: ["sponsor_id"]
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editions_sponsored_article_id_fkey"
            columns: ["sponsored_article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          id: boolean
          featured_video_url: string | null
          featured_video_title: string | null
          featured_video_description: string | null
          is_video_active: boolean
          banner_image_url: string | null
          banner_link_url: string | null
          banner_alt_text: string | null
          is_banner_active: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: boolean
          featured_video_url?: string | null
          featured_video_title?: string | null
          featured_video_description?: string | null
          is_video_active?: boolean
          banner_image_url?: string | null
          banner_link_url?: string | null
          banner_alt_text?: string | null
          is_banner_active?: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: boolean
          featured_video_url?: string | null
          featured_video_title?: string | null
          featured_video_description?: string | null
          is_video_active?: boolean
          banner_image_url?: string | null
          banner_link_url?: string | null
          banner_alt_text?: string | null
          is_banner_active?: boolean
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      edition_articles: {
        Row: {
          id: string
          edition_id: string
          article_id: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          edition_id: string
          article_id: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          edition_id?: string
          article_id?: string
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_articles_edition_id_fkey"
            columns: ["edition_id"]
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edition_articles_article_id_fkey"
            columns: ["article_id"]
            referencedRelation: "articles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_adjacent_editions: {
        Args: { _edition_id: string }
        Returns: {
          prev_slug: string | null
          prev_year: number | null
          prev_month: number | null
          next_slug: string | null
          next_year: number | null
          next_month: number | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
