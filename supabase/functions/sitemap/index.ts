import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://nucleotech.news";
const ARTICLES_API = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/articles";
const JOBS_API = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/jobs";
const TOOLS_API = "https://platinum-n8n.qj9jfr.easypanel.host/webhook/v2/tools";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch articles and jobs in parallel
    const [articlesRes, jobsRes, toolsRes] = await Promise.all([
      fetch(ARTICLES_API).catch(() => null),
      fetch(JOBS_API).catch(() => null),
      fetch(TOOLS_API).catch(() => null),
    ]);

    const articles = articlesRes?.ok ? await articlesRes.json() : [];
    const jobs = jobsRes?.ok ? await jobsRes.json() : [];
    const tools = toolsRes?.ok ? await toolsRes.json() : [];

    const publishedArticles = Array.isArray(articles)
      ? articles.filter((a: any) => a?.status === "published" && a?.slug)
      : [];

    const activeJobs = Array.isArray(jobs)
      ? jobs.filter((j: any) => (j?.status === "active" || j?.status === "published") && j?.title)
      : [];

    const activeTools = Array.isArray(tools)
      ? tools.filter((t: any) => t?.slug)
      : [];

    // Generate slug for jobs (same logic as frontend)
    const slugify = (input: string): string => {
      const charMap: Record<string, string> = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u',
      };
      let slug = input.toLowerCase().trim()
        .split('').map(c => charMap[c] || c).join('')
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/).join('-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (slug.length > 60) {
        slug = slug.substring(0, 60);
        const last = slug.lastIndexOf('-');
        if (last > 30) slug = slug.substring(0, last);
      }
      return slug || 'job';
    };

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/noticias</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/trabajos</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${SITE_URL}/toolbox</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>`;

    for (const article of publishedArticles) {
      const lastmod = (article.updated_at || article.published_date || today).split("T")[0];
      xml += `
  <url>
    <loc>${SITE_URL}/noticias/${article.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    }

    for (const job of activeJobs) {
      const slug = slugify(job.title);
      const lastmod = (job.updated_at || job.published_date || job.createdAt || today).split("T")[0];
      xml += `
  <url>
    <loc>${SITE_URL}/trabajos/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    }

    for (const tool of activeTools) {
      xml += `
  <url>
    <loc>${SITE_URL}/toolbox/${tool.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${today}</lastmod>
  </url>`;
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
