import { useState, useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobListItem } from "@/components/jobs/JobListItem";
import { JobSearch } from "@/components/jobs/JobSearch";
import { LatestNewsWidget } from "@/components/jobs/LatestNewsWidget";
import { JobsLoadingSkeleton } from "@/components/LoadingGrid";
import { ErrorState } from "@/components/ErrorState";
import { SEO } from "@/components/SEO";
import { useJobs } from "@/hooks/useJobs";

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const isMobile = useIsMobile();
  const {
    data: jobs,
    isLoading,
    error,
    refetch
  } = useJobs();

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs || [];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query)
      );
    }

    return result;
  }, [jobs, searchQuery]);

  return (
    <>
      <SEO
        title="Trabajos Tech"
        description="Encuentra las mejores oportunidades laborales en tecnología. Trabajos remotos, híbridos y presenciales en startups y empresas tech."
        url="https://nucleotech.news/trabajos"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Trabajos Tech | Nucleo",
          "description": "Encuentra las mejores oportunidades laborales en tecnología.",
          "url": "https://nucleotech.news/trabajos",
          "publisher": { "@type": "Organization", "name": "Nucleo" },
        }}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

      <main className="flex-1">
        <section className="container py-8">
          {isLoading ? (
            <JobsLoadingSkeleton />
          ) : error ? (
            <ErrorState message="No se pudieron cargar los trabajos" onRetry={() => refetch()} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Contenido Principal - Lista de Trabajos (primero en mobile) */}
              <div className="flex-1 order-1">
                <h2 className="mb-4 text-sm font-semibold text-foreground lg:hidden">Trabajos</h2>
                
                {/* Lista de Trabajos con scroll */}
                <div className="lg:h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
                  {filteredAndSortedJobs.length > 0 ? (
                    <div>
                      {(isMobile ? filteredAndSortedJobs.slice(0, visibleCount) : filteredAndSortedJobs).map(job => (
                        <JobListItem key={job.id} job={job} />
                      ))}
                      {isMobile && visibleCount < filteredAndSortedJobs.length && (
                        <div className="py-6 flex justify-center">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="w-full rounded-lg border border-primary text-primary py-3 text-sm font-medium hover:bg-primary/5 transition-colors"
                          >
                            Ver más trabajos
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-card p-12 text-center">
                      <p className="text-lg text-muted-foreground">
                        No hay trabajos que coincidan con tu búsqueda
                      </p>
                      {searchQuery && (
                        <button 
                          onClick={() => {
                            setSearchQuery("");
                          }} 
                          className="mt-4 text-primary hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - Noticias (después de trabajos en mobile) */}
              <aside className="w-full lg:w-72 flex-shrink-0 order-2 lg:h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
                <LatestNewsWidget />
              </aside>
            </div>
          )}
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Jobs;