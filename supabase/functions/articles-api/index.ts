import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API Key
    const apiKey = req.headers.get("x-api-key");
    const validApiKey = Deno.env.get("N8N_API_KEY");

    if (!apiKey || apiKey !== validApiKey) {
      console.error("Invalid or missing API key");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid API key" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const method = req.method;

    // GET - List all articles or get by slug
    if (method === "GET") {
      const slug = url.searchParams.get("slug");
      
      if (slug) {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .single();
        
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          });
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_date", { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // POST - Create new article(s) - supports single object or array
    if (method === "POST") {
      const body = await req.json();

      // Normalize to array for unified processing
      const articles = Array.isArray(body) ? body : [body];

      // Validate required fields for each article
      const requiredFields = ["title", "content", "category", "slug"];
      for (const article of articles) {
        for (const field of requiredFields) {
          if (!article[field]) {
            return new Response(
              JSON.stringify({ error: `Missing required field: ${field}` }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
              }
            );
          }
        }
      }

      // Resolve category names to UUIDs
      const uniqueCategories = [...new Set(articles.map((a) => a.category))];
      const { data: categoryRows } = await supabase
        .from("categories")
        .select("id, name")
        .in("name", uniqueCategories);
      const categoryMap: Record<string, string> = {};
      for (const row of categoryRows || []) {
        categoryMap[row.name.toLowerCase()] = row.id;
      }

      // Resolve author names to UUIDs
      const uniqueAuthors = [...new Set(articles.map((a) => a.author || "Sistema"))];
      const { data: authorRows } = await supabase
        .from("authors")
        .select("id, name")
        .in("name", uniqueAuthors);
      const authorMap: Record<string, string> = {};
      for (const row of authorRows || []) {
        authorMap[row.name.toLowerCase()] = row.id;
      }

      // Fallback: get the first active author if no match
      let fallbackAuthorId: string | null = null;
      if (Object.keys(authorMap).length === 0) {
        const { data: defaultAuthor } = await supabase
          .from("authors")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .single();
        fallbackAuthorId = defaultAuthor?.id || null;
      }

      // Fallback: get the first active category if no match
      let fallbackCategoryId: string | null = null;
      const { data: defaultCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(1)
        .single();
      fallbackCategoryId = defaultCategory?.id || null;

      // Generate excerpt from HTML content
      function generateExcerpt(html: string): string {
        const text = html.replace(/<[^>]*>/g, "").trim();
        if (text.length <= 200) return text;
        const truncated = text.substring(0, 200);
        const lastSpace = truncated.lastIndexOf(" ");
        return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
      }

      // Estimate reading time from HTML content
      function estimateReadingTime(html: string): number {
        const words = html.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
        return Math.max(1, Math.round(words / 200));
      }

      // Map articles to database format using correct column names
      const articlesToInsert = articles.map((article) => {
        const categoryId = categoryMap[article.category.toLowerCase()] || fallbackCategoryId;
        const authorName = (article.author || "Sistema").toLowerCase();
        const authorId = authorMap[authorName] || fallbackAuthorId;

        if (!categoryId) {
          throw new Error(`Category not found: ${article.category}`);
        }
        if (!authorId) {
          throw new Error(`Author not found: ${article.author || "Sistema"}`);
        }

        return {
          title: article.title,
          content: article.content,
          slug: article.slug,
          category_id: categoryId,
          author_id: authorId,
          featured_image_url: article.image_url || null,
          featured_image_alt: article.title,
          excerpt: generateExcerpt(article.content),
          status: article.status || "draft",
          reading_time_minutes: article.reading_time || estimateReadingTime(article.content),
          published_at: article.published_date || new Date().toISOString(),
          source: "automatic",
        };
      });

      const { data, error } = await supabase
        .from("articles")
        .insert(articlesToInsert)
        .select();

      if (error) {
        console.error("Insert error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Return single object if input was single, array otherwise
      const result = Array.isArray(body) ? data : data[0];
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // PUT - Update article by slug
    if (method === "PUT") {
      const slug = url.searchParams.get("slug");
      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Missing slug parameter" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const body = await req.json();

      // Map legacy field names to correct column names
      const updateData: Record<string, unknown> = { ...body };

      if (body.image_url !== undefined) {
        updateData.featured_image_url = body.image_url;
        delete updateData.image_url;
      }
      if (body.published_date !== undefined) {
        updateData.published_at = body.published_date;
        delete updateData.published_date;
      }
      if (body.reading_time !== undefined) {
        updateData.reading_time_minutes = body.reading_time;
        delete updateData.reading_time;
      }
      if (body.category !== undefined) {
        const { data: catRow } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", body.category)
          .single();
        if (catRow) updateData.category_id = catRow.id;
        delete updateData.category;
      }
      if (body.author !== undefined) {
        const { data: authRow } = await supabase
          .from("authors")
          .select("id")
          .ilike("name", body.author)
          .single();
        if (authRow) updateData.author_id = authRow.id;
        delete updateData.author;
      }
      // Remove legacy fields that don't exist in schema
      delete updateData.image_source;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("articles")
        .update(updateData)
        .eq("slug", slug)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // DELETE - Delete article by slug
    if (method === "DELETE") {
      const slug = url.searchParams.get("slug");
      if (!slug) {
        return new Response(
          JSON.stringify({ error: "Missing slug parameter" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("slug", slug);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
