import { useParams, Link, Navigate } from "react-router-dom";
import { useMemo } from "react";
import DOMPurify from "dompurify";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTools } from "@/hooks/useTools";
import { useArticles } from "@/hooks/useArticles";
import { RelatedArticles } from "@/components/RelatedArticles";
import { ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";

/** Infer a category badge from the product name */
const inferCategory = (name: string): string => {
  const lower = name.toLowerCase();
  if (/\bai\b|inteligencia artificial|gpt|llm|machine learning|fathom|chatgpt|gemini|copilot/.test(lower)) return "IA";
  if (/no.?code|bubble|webflow|glide|adalo|softr/.test(lower)) return "No-code";
  if (/automat|zapier|make|n8n|integromat/.test(lower)) return "Automatización";
  if (/design|figma|canva|framer/.test(lower)) return "Diseño";
  if (/dev|code|github|vercel|supabase|api/.test(lower)) return "Desarrollo";
  return "Herramienta";
};

// ── Markdown renderer (mirrors Article.tsx logic) ──────────────────────
const renderInlineMarkdown = (text: string) => {
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(
    /`(.+?)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
  );
  return DOMPurify.sanitize(result);
};

const isList = (block: string) => {
  const lines = block.split("\n");
  return lines.every(
    (line) =>
      line.trim().startsWith("- ") ||
      line.trim().startsWith("* ") ||
      !!line.trim().match(/^\d+\./)
  );
};

const renderList = (block: string, index: number) => {
  const lines = block.split("\n").filter((l) => l.trim());
  const isOrdered = !!lines[0].trim().match(/^\d+\./);
  const Tag = isOrdered ? "ol" : "ul";
  const cls = isOrdered ? "list-decimal" : "list-disc";
  return (
    <Tag key={index} className={`${cls} ml-6 my-4 space-y-2 text-[15px] lg:text-lg text-foreground/90`}>
      {lines.map((line, i) => {
        const content = line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
        return <li key={i} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content) }} />;
      })}
    </Tag>
  );
};

const renderMarkdownContent = (content: string) => {
  const blocks: string[] = [];
  let current = "";
  let inCode = false;

  content.split("\n").forEach((line) => {
    if (line.startsWith("```")) {
      if (inCode) {
        current += "\n" + line;
        blocks.push(current);
        current = "";
        inCode = false;
      } else {
        if (current.trim()) blocks.push(current);
        current = line;
        inCode = true;
      }
    } else if (inCode) {
      current += "\n" + line;
    } else if (line.trim() === "") {
      if (current.trim()) blocks.push(current);
      current = "";
    } else {
      current += (current ? "\n" : "") + line;
    }
  });
  if (current.trim()) blocks.push(current);

  return blocks.map((block, index) => {
    if (block.startsWith("```")) {
      const lines = block.split("\n");
      const code = lines.slice(1, -1).join("\n");
      return (
        <pre key={index} className="my-6 overflow-x-auto rounded-lg bg-muted p-4">
          <code className="text-sm font-mono text-foreground">{code}</code>
        </pre>
      );
    }
    if (isList(block)) return renderList(block, index);
    if (block.startsWith("## "))
      return (
        <h2 key={index} className="text-2xl font-semibold mt-10 mb-4 text-foreground font-sans">
          {block.replace("## ", "")}
        </h2>
      );
    if (block.startsWith("### "))
      return (
        <h3 key={index} className="text-xl font-semibold mt-8 mb-3 text-foreground font-sans">
          {block.replace("### ", "")}
        </h3>
      );
    if (block.startsWith("> "))
      return (
        <blockquote key={index} className="border-l-4 border-primary pl-6 italic my-8 text-muted-foreground">
          {block.replace("> ", "")}
        </blockquote>
      );
    return (
      <p
        key={index}
        className="mb-6 text-[15px] lg:text-lg text-foreground/90 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block) }}
      />
    );
  });
};

// ── Loading skeleton ───────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <main className="flex-1 container py-8">
      <div className="mx-auto max-w-4xl">
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-2 h-10 w-3/4" />
        <Skeleton className="mb-6 h-5 w-1/2" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────
const ToolDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: tools, isLoading, error, refetch } = useTools();
  const { data: allArticles } = useArticles();

  const tool = useMemo(() => tools?.find((t) => t.slug === slug), [tools, slug]);

  const category = useMemo(() => (tool ? inferCategory(tool.product_name) : ""), [tool]);

  // Related articles: match product_name in title or content
  const relatedArticles = useMemo(() => {
    if (!tool || !allArticles) return [];
    const name = tool.product_name.toLowerCase();
    const words = name.split(/\s+/).filter((w) => w.length > 3);

    const matched = allArticles.filter((a) =>
      words.some(
        (w) =>
          a.title.toLowerCase().includes(w) ||
          a.content?.toLowerCase().includes(w) ||
          a.category?.toLowerCase().includes(w)
      )
    );

    if (matched.length > 0) {
      return matched
        .sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime())
        .slice(0, 6);
    }

    // Fallback: 3 most recent
    return [...allArticles]
      .sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime())
      .slice(0, 3);
  }, [tool, allArticles]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <ErrorState message="No se pudo cargar la herramienta" onRetry={() => refetch()} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tool) return <Navigate to="/toolbox" replace />;

  const seoDescription = tool.short_description || tool.description?.replace(/[#*`>\[\]()|\-]/g, "").replace(/\s+/g, " ").trim().substring(0, 155) + "...";

  return (
    <>
      <SEO
        title={`${tool.product_name} - Análisis y Guía Completa`}
        description={seoDescription}
        image={tool.image_url || undefined}
        url={`https://nucleotech.news/toolbox/${tool.slug}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Review",
          name: `${tool.product_name} - Análisis y Guía Completa`,
          description: seoDescription,
          url: `https://nucleotech.news/toolbox/${tool.slug}`,
          publisher: { "@type": "Organization", name: "Nucleo" },
          itemReviewed: {
            "@type": "SoftwareApplication",
            name: tool.product_name,
            url: tool.affiliate_url,
          },
        }}
      />
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
        <Header />

        <main className="flex-1">
          {/* Hero image */}
          {tool.image_url && (
            <div className="w-full bg-muted">
              <div className="container">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-b-2xl">
                  <img
                    src={tool.image_url}
                    alt={tool.product_name}
                    className="aspect-video w-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="container py-8">
            <article className="mx-auto max-w-3xl">
              <header className="mb-10">
                {/* Category badge */}
                <div className="mb-4">
                  <Badge>{category}</Badge>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl mb-6">
                  {tool.product_name}
                </h1>

                {/* Meta row */}
                {tool.short_description && (
                  <p className="text-sm text-muted-foreground mb-6">{tool.short_description}</p>
                )}

                {/* CTA + Share row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* CTA Button */}
                  {tool.affiliate_url && (
                    <Button
                      asChild
                      className="w-full sm:w-auto font-semibold text-base py-3 px-8 rounded-lg"
                      size="lg"
                    >
                      <a href={tool.affiliate_url} target="_blank" rel="noopener noreferrer">
                        Obtener {tool.product_name}
                        <ExternalLink className="ml-1.5 h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  {/* Share button - Desktop only */}
                  <button
                    onClick={handleShare}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Compartir herramienta"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Compartir</span>
                  </button>
                </div>
              </header>

              {/* Description */}
              <div className="article-content mt-10">
                {renderMarkdownContent(tool.description)}
              </div>

              {/* Related articles - same carousel as news */}
              <RelatedArticles articles={relatedArticles} />
            </article>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ToolDetail;
