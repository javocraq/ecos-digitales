import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTools } from "@/hooks/useTools";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

const ToolDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: tools, isLoading, error, refetch } = useTools();

  const tool = useMemo(
    () => tools?.find((t) => t.slug === slug),
    [tools, slug]
  );

  const handleCopyReferral = () => {
    if (tool?.referral_code) {
      navigator.clipboard.writeText(tool.referral_code);
      toast.success("Código de referido copiado");
    }
  };

  // Convert markdown-ish description to HTML
  const descriptionHtml = useMemo(() => {
    if (!tool?.description) return "";
    let html = tool.description
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br />");
    html = `<p>${html}</p>`;
    return DOMPurify.sanitize(html);
  }, [tool]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 max-w-3xl">
          <Skeleton className="mb-4 h-6 w-24" />
          <Skeleton className="mb-2 h-10 w-3/4" />
          <Skeleton className="mb-6 h-5 w-1/2" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 text-center">
          <p className="text-lg text-muted-foreground">Herramienta no encontrada</p>
          <Link to="/toolbox" className="mt-4 inline-block text-primary hover:underline">
            Volver al Toolbox
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={tool.product_name}
        description={tool.short_description || tool.description.slice(0, 155)}
        image={tool.image_url || undefined}
        url={`https://nucleotech.news/toolbox/${tool.slug}`}
        type="website"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <article className="container max-w-3xl py-8">
            {/* Back */}
            <Link
              to="/toolbox"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Toolbox
            </Link>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground">{tool.product_name}</h1>
            {tool.short_description && (
              <p className="mt-2 text-lg text-muted-foreground">{tool.short_description}</p>
            )}

            {/* Image */}
            {tool.image_url && (
              <img
                src={tool.image_url}
                alt={tool.product_name}
                className="mt-6 w-full rounded-xl border border-border object-cover"
              />
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {tool.affiliate_url && (
                <Button asChild>
                  <a href={tool.affiliate_url} target="_blank" rel="noopener noreferrer">
                    Visitar herramienta
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
              {tool.referral_code && (
                <Button variant="outline" onClick={handleCopyReferral} className="gap-1.5">
                  <Copy className="h-4 w-4" />
                  Copiar código: {tool.referral_code}
                </Button>
              )}
            </div>

            {tool.referral_code && (
              <Badge variant="secondary" className="mt-3">
                Código de referido disponible
              </Badge>
            )}

            {/* Description */}
            <div
              className="article-content mt-8"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ToolDetail;
