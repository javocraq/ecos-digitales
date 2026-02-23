import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTools, type Tool } from "@/hooks/useTools";
import { ExternalLink } from "lucide-react";

const ToolCard = ({ tool }: { tool: Tool }) => {
  const initials = tool.product_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to={`/toolbox/${tool.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Image with overlay on mobile, plain on desktop */}
      <div className="relative aspect-[16/10] sm:aspect-video w-full overflow-hidden bg-muted">
        {tool.image_url ? (
          <img
            src={tool.image_url}
            alt={tool.product_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-3xl font-bold text-muted-foreground">
            {initials}
          </div>
        )}

        {/* Mobile: gradient overlay with title */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:hidden" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:hidden">
          <h3 className="text-lg font-bold text-white leading-snug">
            {tool.product_name}
          </h3>
        </div>

      </div>

      {/* Content - hidden on mobile, shown on desktop */}
      <div className="hidden sm:flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-base font-semibold text-foreground line-clamp-1">
          {tool.product_name}
        </h3>
        <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
          {tool.short_description || tool.description}
        </p>
        <span className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
          Ver herramienta
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
};

const ToolboxSkeleton = () => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-8 w-28" />
        </div>
      </div>
    ))}
  </div>
);

const Toolbox = () => {
  const { data: tools, isLoading, error, refetch } = useTools();

  return (
    <>
      <SEO
        title="Toolbox"
        description="Herramientas que uso y recomiendo para automatización, IA y desarrollo. Descubre las mejores apps y servicios para potenciar tu productividad."
        url="https://blog.nucleo.la/toolbox"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Toolbox | Nucleo",
          description:
            "Herramientas recomendadas para automatización, IA y desarrollo.",
          url: "https://blog.nucleo.la/toolbox",
          publisher: { "@type": "Organization", name: "Nucleo" },
        }}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <section className="container py-8">



            {/* Content */}
            {isLoading ? (
              <ToolboxSkeleton />
            ) : error ? (
              <ErrorState
                message="No se pudieron cargar las herramientas"
                onRetry={() => refetch()}
              />
            ) : !tools || tools.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Próximamente nuevas herramientas
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Toolbox;
