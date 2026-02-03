import { useParams, Navigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TagPill } from "@/components/TagPill";
import { ArticleMeta } from "@/components/ArticleMeta";
import { RelatedArticles } from "@/components/RelatedArticles";
import { ArticleDetailSkeleton } from "@/components/ArticleDetailSkeleton";
import { SEO } from "@/components/SEO";
import { useArticleBySlug, useArticles } from "@/hooks/useArticles";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Fetch article from n8n API
  const { data: article, isLoading: isArticleLoading } = useArticleBySlug(slug || "");
  const { data: allArticles } = useArticles();
  
  // Get related articles from the same category (up to 9 most recent)
  const relatedArticles = article && allArticles
    ? allArticles
        .filter(a => a.category === article.category && a.slug !== article.slug)
        .slice(0, 9)
    : [];

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

  // Helper to render inline markdown (bold, italic, code, links) with sanitization
  const renderInlineMarkdown = (text: string) => {
    // Replace **bold** with <strong>
    let result = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Replace *italic* with <em>
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Replace `code` with <code>
    result = result.replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    // Replace [text](url) with <a>
    result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
    // Sanitize to prevent XSS
    return DOMPurify.sanitize(result);
  };

  // Check if block is a table
  const isTable = (block: string) => {
    const lines = block.split('\n');
    return lines.length >= 2 && lines[0].includes('|') && lines[1].includes('---');
  };

  // Render markdown table
  const renderTable = (block: string, index: number) => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    const parseRow = (row: string) => {
      return row.split('|').map(cell => cell.trim()).filter(cell => cell && !cell.match(/^-+$/));
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(2).map(parseRow); // Skip header and separator

    return (
      <div key={index} className="my-6 overflow-x-auto">
        <table className="w-full border-collapse border border-border rounded-lg">
          <thead>
            <tr className="bg-muted">
              {headers.map((header, i) => (
                <th key={i} className="border border-border px-4 py-2 text-left font-semibold text-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-muted/50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-border px-4 py-2 text-foreground/90">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render code block
  const renderCodeBlock = (block: string, index: number) => {
    const lines = block.split('\n');
    const language = lines[0].replace('```', '').trim();
    const code = lines.slice(1, -1).join('\n');
    
    return (
      <pre key={index} className="my-6 overflow-x-auto rounded-lg bg-muted p-4">
        <code className="text-sm font-mono text-foreground">{code}</code>
      </pre>
    );
  };

  // Check if block is a list
  const isList = (block: string) => {
    const lines = block.split('\n');
    return lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().match(/^\d+\./));
  };

  // Render list
  const renderList = (block: string, index: number) => {
    const lines = block.split('\n').filter(line => line.trim());
    const isOrdered = lines[0].trim().match(/^\d+\./);
    
    const ListTag = isOrdered ? 'ol' : 'ul';
    const listClass = isOrdered ? 'list-decimal' : 'list-disc';
    
    return (
      <ListTag key={index} className={`${listClass} ml-6 my-4 space-y-2 text-[15px] lg:text-lg text-foreground/90`}>
        {lines.map((line, i) => {
          const content = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
          return (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(content) }} />
          );
        })}
      </ListTag>
    );
  };

  // Main content renderer
  const renderContent = (content: string) => {
    // Split by double newlines but keep code blocks together
    const blocks: string[] = [];
    let currentBlock = '';
    let inCodeBlock = false;
    
    content.split('\n').forEach(line => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          currentBlock += '\n' + line;
          blocks.push(currentBlock);
          currentBlock = '';
          inCodeBlock = false;
        } else {
          if (currentBlock.trim()) blocks.push(currentBlock);
          currentBlock = line;
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        currentBlock += '\n' + line;
      } else if (line.trim() === '') {
        if (currentBlock.trim()) blocks.push(currentBlock);
        currentBlock = '';
      } else {
        currentBlock += (currentBlock ? '\n' : '') + line;
      }
    });
    if (currentBlock.trim()) blocks.push(currentBlock);

    return blocks.map((block, index) => {
      // Code blocks
      if (block.startsWith('```')) {
        return renderCodeBlock(block, index);
      }
      // Tables
      if (isTable(block)) {
        return renderTable(block, index);
      }
      // Lists
      if (isList(block)) {
        return renderList(block, index);
      }
      // Headers
      if (block.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-semibold mt-10 mb-4 text-foreground font-sans">
            {block.replace('## ', '')}
          </h2>
        );
      }
      if (block.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-semibold mt-8 mb-3 text-foreground font-sans">
            {block.replace('### ', '')}
          </h3>
        );
      }
      // Blockquotes
      if (block.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-primary pl-6 italic my-8 text-muted-foreground">
            {block.replace('> ', '')}
          </blockquote>
        );
      }
      // Regular paragraphs with inline formatting
      return (
        <p 
          key={index} 
          className="mb-6 text-[15px] lg:text-lg text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block) }}
        />
      );
    });
  };

  // Generate short description for SEO (first 160 characters of content)
  const seoDescription = article.content
    ?.replace(/[#*`>\[\]()]/g, '') // Remove markdown
    ?.replace(/\n+/g, ' ') // Replace newlines with spaces
    ?.substring(0, 160)
    ?.trim() + '...' || `Lee ${article.title} en Nucleo`;

  return (
    <>
      <SEO
        title={article.title}
        description={seoDescription}
        image={article.image_url || undefined}
        url={`https://serif-stream.lovable.app/noticias/${article.slug}`}
        type="article"
        publishedTime={article.published_date}
        author={article.author}
      />
      <div className="min-h-screen bg-background">
        <Header showShare shareTitle={article.title} />

      <main className="container py-8">
        {/* Centered Article Container */}
        <article className="mx-auto max-w-3xl">
          {/* Category */}
          <div className="mb-4">
            <TagPill category={article.category} />
          </div>

          {/* Title */}
          <h1 className="mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="mb-8">
            <ArticleMeta
              author={article.author}
              publishedDate={article.published_date}
              readingTime={article.reading_time}
              variant="large"
              showShare
            />
          </div>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-10 overflow-hidden rounded-2xl">
              <img
                src={article.image_url}
                alt={article.title}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="article-content">
            {renderContent(article.content)}
          </div>

          {/* Related Articles - Below the article */}
          <RelatedArticles articles={relatedArticles} />
        </article>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default Article;
