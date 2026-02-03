import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string | null;
  location: string;
  remote_type: "Remote" | "Hybrid" | "On-site";
  job_type: "Full-time" | "Part-time" | "Contract" | "Internship";
  category: string;
  description: string;
  short_description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  tags: string[];
  application_url: string;
  featured: boolean;
  slug: string;
  published_date: string;
  expires_at?: string | null;
  status: "draft" | "published" | "expired" | "active" | string;
  created_at?: string;
  updated_at?: string;
}

const N8N_JOBS_URL = "https://javocraq.app.n8n.cloud/webhook/v1/jobs";

const isVisibleJobStatus = (status: unknown) => {
  // n8n puede devolver "active" (según tu ejemplo) o "published" (según implementación previa).
  if (typeof status !== "string") return true;
  return status === "active" || status === "published";
};

const safeIsoDate = (value: unknown) => {
  if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) return value;
  return new Date().toISOString();
};

/**
 * Generate SEO-friendly slug from text
 * - Converts special characters (á, é, ñ, etc.) to ASCII equivalents
 * - Removes stop words for cleaner URLs
 * - Limits length to ~60 chars for optimal SEO
 * - Ensures URL-safe characters only
 */
const slugify = (input: string): string => {
  // Map of accented characters to ASCII equivalents
  const charMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c',
  };

  // Spanish stop words to remove for cleaner slugs
  const stopWords = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'en', 'con', 'para', 'por', 'y', 'o', 'a',
    'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at'
  ]);

  let slug = input
    .toLowerCase()
    .trim()
    // Replace accented characters
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    // Remove any remaining non-alphanumeric characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Split into words
    .split(/\s+/)
    // Remove stop words (but keep at least 2 words)
    .filter((word, _, arr) => {
      const meaningfulWords = arr.filter(w => !stopWords.has(w));
      return meaningfulWords.length <= 2 || !stopWords.has(word);
    })
    // Join with hyphens
    .join('-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');

  // Limit to ~60 characters, breaking at word boundaries
  if (slug.length > 60) {
    slug = slug.substring(0, 60);
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > 30) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug || 'job';
};

const normalizeJob = (raw: any): Job | null => {
  if (!raw || typeof raw !== "object") return null;

  const title = typeof raw.title === "string" ? raw.title : "";
  if (!title) return null;

  const company = typeof raw.company === "string" ? raw.company : "—";
  const id = raw.id != null ? String(raw.id) : slugify(`${title}-${company}`);
  // Always generate SEO-friendly slug from title, fallback to provided slug or id
  const generatedSlug = slugify(title);
  const slug = generatedSlug || (typeof raw.slug === "string" && raw.slug.trim() ? raw.slug.trim() : id);
  const status = typeof raw.status === "string" ? raw.status : "active";

  // Preferimos published_date si existe; si no, caemos a createdAt/created_at; si no, now.
  const published_date = safeIsoDate(
    raw.published_date ?? raw.publishedDate ?? raw.createdAt ?? raw.created_at
  );

  return {
    id,
    title,
    company,
    company_logo: raw.company_logo ?? null,
    location: typeof raw.location === "string" && raw.location.trim() ? raw.location : "—",
    remote_type: raw.remote_type === "Remote" || raw.remote_type === "Hybrid" || raw.remote_type === "On-site"
      ? raw.remote_type
      : "On-site",
    job_type:
      raw.job_type === "Full-time" ||
      raw.job_type === "Part-time" ||
      raw.job_type === "Contract" ||
      raw.job_type === "Internship"
        ? raw.job_type
        : "Full-time",
    category: typeof raw.category === "string" && raw.category.trim() ? raw.category : "General",
    description: typeof raw.description === "string" ? raw.description : "",
    short_description:
      typeof raw.short_description === "string" ? raw.short_description : null,
    salary_min: typeof raw.salary_min === "number" ? raw.salary_min : null,
    salary_max: typeof raw.salary_max === "number" ? raw.salary_max : null,
    salary_currency: typeof raw.salary_currency === "string" ? raw.salary_currency : "USD",
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string") : [],
    application_url: typeof raw.application_url === "string" ? raw.application_url : "",
    featured: Boolean(raw.featured),
    slug,
    published_date,
    expires_at: typeof raw.expires_at === "string" ? raw.expires_at : null,
    status,
    created_at: typeof raw.createdAt === "string" ? raw.createdAt : raw.created_at,
    updated_at: typeof raw.updatedAt === "string" ? raw.updatedAt : raw.updated_at,
  };
};

export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async (): Promise<Job[]> => {
      const response = await fetch(N8N_JOBS_URL);
      if (!response.ok) {
        throw new Error("Error al cargar trabajos");
      }

      const data = await response.json();
      // Debug solicitado
      console.log("Jobs recibidos:", data);

      if (!Array.isArray(data)) return [];

      return data
        .filter((raw) => isVisibleJobStatus(raw?.status))
        .map(normalizeJob)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b!.published_date).getTime() -
            new Date(a!.published_date).getTime()
        ) as Job[];
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};

export const useJobBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["job", slug],
    queryFn: async (): Promise<Job | null> => {
      const response = await fetch(N8N_JOBS_URL);
      
      if (!response.ok) {
        throw new Error("Error al cargar trabajos");
      }
      
      const data = await response.json();
      // Debug solicitado
      console.log("Jobs recibidos:", data);
      
      if (!Array.isArray(data)) {
        return null;
      }
      
      // Normalize all jobs first, then find by generated slug
      const jobs = data
        .filter((raw) => isVisibleJobStatus(raw?.status))
        .map(normalizeJob)
        .filter(Boolean) as Job[];
      
      // Find job by the generated SEO slug
      return jobs.find((job) => job.slug === slug) || null;
    },
    enabled: !!slug,
  });
};

export const useFeaturedJobs = (limit: number = 3) => {
  const { data: jobs, ...rest } = useJobs();
  
  const featuredJobs = jobs
    ? jobs.filter(job => job.featured).slice(0, limit)
    : [];
  
  return { data: featuredJobs, ...rest };
};

export const useJobCategories = () => {
  const { data: jobs } = useJobs();
  
  const categories = jobs
    ? [...new Set(jobs.map((j) => j.category))].sort()
    : [];
  
  return categories;
};

export const formatSalary = (min?: number | null, max?: number | null, currency: string = "USD"): string | null => {
  if (!min && !max) return null;
  
  const formatNumber = (n: number) => {
    if (n >= 1000) {
      return `${Math.round(n / 1000)}K`;
    }
    return n.toString();
  };
  
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  
  if (min && max) {
    return `${symbol}${formatNumber(min)} - ${symbol}${formatNumber(max)}/year`;
  }
  if (min) {
    return `${symbol}${formatNumber(min)}+/year`;
  }
  if (max) {
    return `Up to ${symbol}${formatNumber(max)}/year`;
  }
  
  return null;
};

export const formatRelativeDate = (dateString: string): string => {
  const publishedDate = new Date(dateString);
  const now = new Date();
  const hoursDiff = differenceInHours(now, publishedDate);
  
  if (hoursDiff < 24) {
    return formatDistanceToNow(publishedDate, { addSuffix: true, locale: es })
      .replace("alrededor de ", "");
  }
  
  return format(publishedDate, "d MMM", { locale: es });
};
