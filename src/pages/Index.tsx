import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroGrid } from "@/components/HeroGrid";
import { MostViewed } from "@/components/MostViewed";
import { FeaturedVideo } from "@/components/FeaturedVideo";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleGridPaginated } from "@/components/ArticleGridPaginated";
import { FeaturedHeadlines } from "@/components/FeaturedHeadlines";
import { LoadingGrid } from "@/components/LoadingGrid";
import { ErrorState } from "@/components/ErrorState";
import { Footer } from "@/components/Footer";

import { SEO } from "@/components/SEO";
import { useArticles } from "@/hooks/useArticles";
import { useLatestVideo } from "@/hooks/useLatestVideo";

const Index = () => {
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("categoria");

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
      result = result.filter((a) => a.category_name === selectedCategory);
    }
    
    return result;
  }, [articles, selectedCategory]);

  // Hero: 1 featured + 2 side (3 articles, matches desktop layout)
  const heroArticles = filteredArticles.slice(0, 3);
  // Featured headlines: next 3 articles after hero
  const headlineArticles = filteredArticles.slice(3, 6);
  // Most viewed: next 4
  const mostViewedArticles = filteredArticles.slice(6, 10);
  // Feed: everything else
  const feedArticles = filteredArticles.slice(10);

  return (
    <>
      <SEO
        title="Noticias de Tecnología"
        description="Las últimas noticias de tecnología, telecomunicaciones, ciberseguridad e inteligencia artificial. Ecos Digitales."
        url="https://blog.nucleo.la/noticias"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Ecos Digitales",
          "url": "https://blog.nucleo.la",
          "description": "Las últimas noticias de tecnología, telecomunicaciones, ciberseguridad e inteligencia artificial.",
          "publisher": {
            "@type": "Organization",
            "name": "Ecos Digitales",
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://blog.nucleo.la/buscar?q={search_term_string}",
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
            {/* Hero Grid - 3 main articles (1 featured + 2 side) */}
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

            {/* Featured Headlines Banner */}
            <FeaturedHeadlines articles={headlineArticles} />

            {/* Most Viewed Section */}
            <MostViewed articles={mostViewedArticles} isLoading={isLoading} />

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

          </>
        )}
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Index;
