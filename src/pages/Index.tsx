import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { HeroGrid } from "@/components/HeroGrid";
import { MostViewed } from "@/components/MostViewed";
import { FeaturedVideo } from "@/components/FeaturedVideo";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleGridPaginated } from "@/components/ArticleGridPaginated";
import { LoadingGrid } from "@/components/LoadingGrid";
import { ErrorState } from "@/components/ErrorState";
import { Footer } from "@/components/Footer";
import { FeaturedJobsSection } from "@/components/jobs/FeaturedJobsSection";
import { SEO } from "@/components/SEO";
import { useArticles } from "@/hooks/useArticles";
import { useLatestVideo } from "@/hooks/useLatestVideo";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch articles from n8n API
  const { 
    data: articles, 
    isLoading, 
    error,
    refetch 
  } = useArticles();
  
  const { data: latestVideo, isLoading: isVideoLoading, error: videoError } = useLatestVideo();

  // Filter articles by category
  const filteredArticles = useMemo(() => {
    let result = articles || [];
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory);
    }
    
    return result;
  }, [articles, selectedCategory]);

  const heroArticles = filteredArticles.slice(0, 5);
  const feedArticles = filteredArticles.slice(5);

  return (
    <>
      <SEO
        title="Noticias Tech"
        description="Las últimas noticias de tecnología, startups, inteligencia artificial y más. Mantente informado con Nucleo."
        url="https://nucleotech.news/noticias"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Nucleo",
          "url": "https://nucleotech.news",
          "description": "Las últimas noticias de tecnología, startups, inteligencia artificial y más.",
          "publisher": {
            "@type": "Organization",
            "name": "Nucleo",
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://nucleotech.news/buscar?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
      
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <section className="container py-8">
            <LoadingGrid />
          </section>
        ) : error ? (
          <section className="container py-8">
            <ErrorState 
              message="No se pudieron cargar los artículos desde la API"
              onRetry={() => refetch()}
            />
          </section>
        ) : (
          <>
            {/* Hero Grid - 5 main articles */}
            {heroArticles.length > 0 ? (
              <HeroGrid articles={heroArticles} />
            ) : (
              <div className="container py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No se encontraron artículos
                  {selectedCategory && ` en la categoría "${selectedCategory}"`}
                </p>
              </div>
            )}

            {/* Most Viewed Section */}
            <MostViewed articles={filteredArticles.slice(0, 8)} isLoading={isLoading} />

            {/* Featured Video Section */}
            {(latestVideo || isVideoLoading) && (
              <FeaturedVideo
                videoId={latestVideo?.videoId || ""}
                title={latestVideo?.title || ""}
                description={latestVideo?.description || ""}
                isLoading={isVideoLoading}
              />
            )}

            {/* Paginated Feed */}
            {feedArticles.length > 0 && (
              <section className="container py-6">
                <SectionHeader title="Últimas noticias" />
                <ArticleGridPaginated articles={feedArticles} />
              </section>
            )}

            {/* Featured Jobs Section */}
            <FeaturedJobsSection />
          </>
        )}
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Index;
