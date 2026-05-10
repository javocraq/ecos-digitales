// Cloudflare Pages Function: sitemap.xml dinámico.
// Genera el sitemap a partir de la base Supabase en cada request, con caché
// de 1h en CDN. Reemplaza al sitemap estático que se hacía obsoleto rápido
// (los lastmod quedaban congelados y los nuevos artículos no aparecían).
//
// URLs incluidas:
//   - / (home)
//   - /noticias (índice)
//   - /ediciones (índice de ediciones del mes)
//   - /buscar
//   - /toolbox (índice)
//   - /toolbox/<slug> (cada herramienta)
//   - /noticias/<slug> (cada artículo publicado)
//   - /ediciones/<slug> (cada edición publicada)

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const SITE = "https://ecosdigitales.com";
const PAGE_SIZE = 1000;

interface SupaArticle {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
}
interface SupaEdition {
  slug: string;
  updated_at: string | null;
}
interface SupaTool {
  slug: string;
  updated_at: string | null;
}

interface UrlEntry {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: string;
}

async function fetchAllPaginated<T>(
  supaUrl: string,
  supaKey: string,
  endpoint: string,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  // Safety cap: 50 pages × 1000 = 50k rows max
  for (let page = 0; page < 50; page++) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const url = `${supaUrl}/rest/v1/${endpoint}${sep}offset=${offset}&limit=${PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
      },
      // Cloudflare Workers fetch supports cf, but we control caching at response level.
    });
    if (!res.ok) break;
    const rows = (await res.json()) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

const xmlEscape = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const safeUrl = (path: string): string => {
  // encodeURI no toca `:/`, pero codifica espacios y caracteres no ASCII en
  // slugs legacy (algunos slugs antiguos tienen espacios o tildes mal escapadas).
  return xmlEscape(encodeURI(`${SITE}${path}`));
};

const isoDate = (s: string | null | undefined, fallback: string): string => {
  if (!s) return fallback;
  // Devolvemos solo YYYY-MM-DD para sitemap (W3C-allowed simplest form).
  const d = s.length >= 10 ? s.slice(0, 10) : fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : fallback;
};

function buildXml(urls: UrlEntry[]): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${u.loc}</loc>`);
    lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) lines.push(`    <priority>${u.priority}</priority>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const supaUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const supaKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";

  const today = new Date().toISOString().slice(0, 10);
  const urls: UrlEntry[] = [];

  // Páginas estáticas de alta prioridad
  urls.push({ loc: safeUrl("/"), lastmod: today, changefreq: "daily", priority: "1.0" });
  urls.push({ loc: safeUrl("/noticias"), lastmod: today, changefreq: "daily", priority: "0.9" });
  urls.push({ loc: safeUrl("/ediciones"), lastmod: today, changefreq: "weekly", priority: "0.9" });
  urls.push({ loc: safeUrl("/toolbox"), lastmod: today, changefreq: "weekly", priority: "0.7" });
  urls.push({ loc: safeUrl("/buscar"), lastmod: today, changefreq: "monthly", priority: "0.4" });
  urls.push({ loc: safeUrl("/prensa"), lastmod: today, changefreq: "monthly", priority: "0.6" });

  // Si no hay Supabase configurada, devolvemos el sitemap mínimo en vez de error.
  // Esto cubre el caso de despliegue inicial o env vars rotas.
  if (!supaUrl || !supaKey) {
    const xml = buildXml(urls);
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Sitemap-Source": "static-fallback",
      },
    });
  }

  try {
    const [articles, editions, tools] = await Promise.all([
      fetchAllPaginated<SupaArticle>(
        supaUrl,
        supaKey,
        "articles?select=slug,updated_at,published_at&status=eq.published&published_at=not.is.null&order=published_at.desc",
      ),
      fetchAllPaginated<SupaEdition>(
        supaUrl,
        supaKey,
        "editions?select=slug,updated_at&is_published=eq.true&order=year.desc,month.desc",
      ),
      fetchAllPaginated<SupaTool>(
        supaUrl,
        supaKey,
        "tools?select=slug,updated_at&order=updated_at.desc",
      ).catch(() => [] as SupaTool[]),
      // tools puede no existir todavía; si falla degradamos a [].
    ]);

    // Ediciones (priority alta, cambian poco después de publicadas)
    for (const e of editions) {
      urls.push({
        loc: safeUrl(`/ediciones/${e.slug}`),
        lastmod: isoDate(e.updated_at, today),
        changefreq: "monthly",
        priority: "0.8",
      });
    }

    // Toolbox individual (si hay)
    for (const t of tools) {
      urls.push({
        loc: safeUrl(`/toolbox/${t.slug}`),
        lastmod: isoDate(t.updated_at, today),
        changefreq: "monthly",
        priority: "0.6",
      });
    }

    // Artículos individuales
    for (const a of articles) {
      const lastmod = isoDate(a.updated_at, isoDate(a.published_at, today));
      urls.push({
        loc: safeUrl(`/noticias/${a.slug}`),
        lastmod,
        changefreq: "weekly",
        priority: "0.7",
      });
    }
  } catch (err) {
    // Loggear pero seguir con lo que tengamos. Mejor un sitemap parcial que un 500.
    console.error("sitemap.xml.ts error:", err);
  }

  const xml = buildXml(urls);
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // CDN cache 1h, browser cache 5min — los buscadores usan If-Modified-Since.
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "X-Sitemap-URL-Count": String(urls.length),
    },
  });
};
