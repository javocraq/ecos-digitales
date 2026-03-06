import { useParams, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TagPill } from "@/components/TagPill";
import { ArticleMeta } from "@/components/ArticleMeta";
import { RelatedArticles } from "@/components/RelatedArticles";
import { InlineRelatedArticles } from "@/components/InlineRelatedArticles";
import { OptimizedImage } from "@/components/OptimizedImage";
import { ArticleDetailSkeleton } from "@/components/ArticleDetailSkeleton";
import { SEO } from "@/components/SEO";
import { useArticleBySlug, useArticles } from "@/hooks/useArticles";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading: isArticleLoading } = useArticleBySlug(slug || "");
  const { data: allArticles } = useArticles();

  // Inline related: 2 articles from same category
  const inlineRelatedArticles = article && allArticles
    ? allArticles
        .filter(a => a.category_name === article.category_name && a.slug !== article.slug)
        .slice(0, 2)
    : [];

  const inlineSlugs = new Set(inlineRelatedArticles.map(a => a.slug));

  // Related articles: same category, excluding inline ones
  const relatedArticles = article && allArticles
    ? allArticles
        .filter(a => a.category_name === article.category_name && a.slug !== article.slug && !inlineSlugs.has(a.slug))
        .slice(0, 9)
    : [];

  const contentRef = useRef<HTMLDivElement>(null);

  // Load Twitter widgets.js and render tweet embeds after DOM paint
  useEffect(() => {
    if (!contentRef.current) return;
    const tweetBlocks = contentRef.current.querySelectorAll("blockquote.twitter-tweet");
    if (tweetBlocks.length === 0) return;

    const container = contentRef.current;

    // Script already loaded and ready — just re-render embeds (SPA navigation)
    const twttr = (window as any).twttr;
    if (twttr?.widgets) {
      twttr.widgets.load(container);
      return;
    }

    // Script tag exists but hasn't finished loading yet — wait for it
    const existingScript = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]'
    ) as HTMLScriptElement | null;
    if (existingScript) {
      const onLoad = () => (window as any).twttr?.widgets?.load(container);
      existingScript.addEventListener("load", onLoad);
      return () => existingScript.removeEventListener("load", onLoad);
    }

    // First time — inject the script
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [article?.content]);

  if (isArticleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <ArticleDetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return <Navigate to="/" replace />;
  }

  // Split HTML content into top-level blocks and inject inline related at ~50%
  const renderContent = (htmlContent: string) => {
    const sanitized = DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "src", "width", "height", "class", "data-lang", "data-theme", "data-dnt"],
      ALLOW_DATA_ATTR: true,
    });

    const blockRegex = /(<(?:p|h[1-6]|blockquote|ul|ol|pre|hr|div|table|figure|img|iframe)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|blockquote|ul|ol|pre|div|table|figure|iframe)>|<(?:hr|img|iframe)[^>]*\/?>)/gi;
    const blocks = sanitized.match(blockRegex) || [sanitized];

    const showInline = blocks.length >= 4 && inlineRelatedArticles.length > 0;
    const midpoint = Math.floor(blocks.length / 2);

    const firstHalf = blocks.slice(0, showInline ? midpoint : blocks.length).join("");
    const secondHalf = showInline ? blocks.slice(midpoint).join("") : "";

    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
        {showInline && (
          <InlineRelatedArticles articles={inlineRelatedArticles} currentSlug={article.slug} />
        )}
        {secondHalf && (
          <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
        )}
        {!showInline && inlineRelatedArticles.length > 0 && (
          <InlineRelatedArticles articles={inlineRelatedArticles} currentSlug={article.slug} />
        )}
      </>
    );
  };

  const seoDescription = article.excerpt
    || article.content
      ?.replace(/[#*`>\[\]()|\-]/g, '')
      ?.replace(/<[^>]*>/g, '')
      ?.replace(/\n+/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim()
      ?.substring(0, 155)
      ?.trim() + '...'
    || `Lee ${article.title} en Ecos Digitales`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": article.featured_image_url || undefined,
    "datePublished": article.published_at,
    "dateModified": article.updated_at || article.published_at,
    "author": {
      "@type": "Person",
      "name": article.author_name,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ecos Digitales",
      "url": "https://blog.nucleo.la",
    },
    "description": seoDescription,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://blog.nucleo.la/noticias/${article.slug}`,
    },
  };

  return (
    <>
      <SEO
        title={article.title}
        description={seoDescription}
        image={article.featured_image_url || undefined}
        url={`https://blog.nucleo.la/noticias/${article.slug}`}
        type="article"
        publishedTime={article.published_at}
        author={article.author_name}
        category={article.category_name}
        jsonLd={articleJsonLd}
      />
      <div className="min-h-screen bg-background">
        <Header showShare shareTitle={article.title} />

        <main className="container py-8">
          <article className="mx-auto max-w-3xl">
            <div className="mb-4">
              <TagPill category={article.category_name} />
            </div>

            <h1 className="mb-6 text-[28px] font-bold leading-tight text-foreground sm:text-[34px] lg:text-[46px]">
              {article.title}
            </h1>

            <div className="mb-8">
              <ArticleMeta
                author={article.author_name}
                publishedDate={article.published_at}
                readingTime={article.reading_time_minutes}
                variant="large"
                showShare
              />
            </div>

            {article.featured_image_url && (
              <div className="mb-10">
                <div className="overflow-hidden rounded-2xl">
                  <OptimizedImage
                    src={article.featured_image_url}
                    alt={article.featured_image_alt || article.title}
                    className="aspect-video w-full object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              </div>
            )}

            <div ref={contentRef} className="article-content prose prose-lg max-w-none dark:prose-invert">
              {renderContent(article.content)}
            </div>

            <RelatedArticles articles={relatedArticles} />
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Article;
