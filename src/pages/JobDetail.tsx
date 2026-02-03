import { useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { ArrowLeft, Building2, Share2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimilarJobs } from "@/components/jobs/SimilarJobs";
import { LoadingGrid } from "@/components/LoadingGrid";
import { ErrorState } from "@/components/ErrorState";
import { SEO } from "@/components/SEO";
import { useJobBySlug, formatSalary, formatRelativeDate } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const JobDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: job, isLoading, error } = useJobBySlug(slug || "");

  const salary = job ? formatSalary(job.salary_min, job.salary_max, job.salary_currency) : null;

  const handleApply = () => {
    if (job?.application_url) {
      window.open(job.application_url, "_blank");
      console.log("Usuario aplicó a:", job.title);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let inList = false;
    let listItems: string[] = [];

    const processInlineMarkdown = (text: string) => {
      const result = text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#2563eb] hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
      // Sanitize to prevent XSS
      return DOMPurify.sanitize(result);
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(trimmed.slice(2));
      } else {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="mb-6 list-disc ml-6 space-y-2 text-foreground/90">
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
              ))}
            </ul>
          );
          inList = false;
          listItems = [];
        }

        if (trimmed.startsWith("### ")) {
          elements.push(
            <h3
              key={index}
              className="text-xl font-semibold mt-8 mb-3 text-foreground"
              dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed.slice(4)) }}
            />
          );
        } else if (trimmed.startsWith("## ")) {
          elements.push(
            <h2
              key={index}
              className="text-2xl font-semibold mt-10 mb-4 text-foreground"
              dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed.slice(3)) }}
            />
          );
        } else if (trimmed.startsWith("# ")) {
          elements.push(
            <h1
              key={index}
              className="text-3xl font-semibold mt-10 mb-4 text-foreground"
              dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed.slice(2)) }}
            />
          );
        } else if (trimmed === "") {
          // Skip empty lines, spacing handled by margins
        } else {
          elements.push(
            <p
              key={index}
              className="mb-6 text-foreground/90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed) }}
            />
          );
        }
      }
    });

    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="list-final" className="mb-6 list-disc ml-6 space-y-2 text-foreground/90">
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
          ))}
        </ul>
      );
    }

    return elements;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <LoadingGrid />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <ErrorState
            message="No se pudo encontrar el trabajo"
            onRetry={() => window.location.reload()}
          />
          <div className="mt-8 text-center">
            <Link to="/trabajos" className="text-[#2563eb] hover:underline">
              Volver a trabajos
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generate description for SEO
  const seoDescription = `${job.title} en ${job.company}. ${job.remote_type}. ${job.job_type}. ${job.short_description?.substring(0, 100) || 'Aplica ahora en Nucleo'}`;

  return (
    <>
      <SEO
        title={`${job.title} en ${job.company}`}
        description={seoDescription}
        image={job.company_logo || undefined}
        url={`https://serif-stream.lovable.app/trabajos/${job.slug}`}
        type="website"
      />
      <div className="min-h-screen bg-white flex flex-col">
        <Header showShare shareTitle={job.title} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
          {/* Header - Article style layout */}
          <header className="mb-10">
            {/* Category badge */}
            <div className="mb-4">
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                {job.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl leading-tight mb-6">
              {job.title}
            </h1>

            {/* Meta row with share button on desktop */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {/* Company with logo */}
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {job.company_logo ? (
                      <img
                        src={job.company_logo}
                        alt={job.company}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{job.company}</span>
                </div>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-sm">{job.remote_type}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-sm">{job.job_type}</span>
              </div>

              {/* Share button - Desktop only (mobile in header) */}
              <button
                onClick={handleShare}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Compartir trabajo"
              >
                <Share2 className="h-4 w-4" />
                <span>Compartir</span>
              </button>
            </div>

            {/* Apply Button - Primary CTA */}
            <Button
              onClick={handleApply}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-3 px-8 rounded-lg transition-all duration-200"
              size="lg"
            >
              Aplicar a este trabajo
            </Button>
          </header>

          {/* Description */}
          <div className="prose-content">
            {renderMarkdown(job.description)}
          </div>

          {/* Tags / Skills */}
          {job.tags && job.tags.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
                Skills & Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-full bg-[#f3f4f6] border border-[#e5e7eb] px-4 py-2 text-sm text-[#374151]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}



          {/* Similar Jobs */}
          <div className="mt-20">
            <h3 className="mb-6 text-xl font-semibold text-foreground">
              Más oportunidades
            </h3>
            <SimilarJobs currentJob={job} />
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default JobDetail;
