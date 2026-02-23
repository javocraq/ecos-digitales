import { Clock, User, Share2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface ArticleMetaProps {
  author: string;
  publishedDate: string;
  readingTime: number;
  variant?: "default" | "large";
  showShare?: boolean;
}

export const ArticleMeta = ({
  author,
  publishedDate,
  readingTime,
  variant = "default",
  showShare = false,
}: ArticleMetaProps) => {
  const formattedDate = format(new Date(publishedDate), "d MMM, yyyy", { locale: es });

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  if (variant === "large") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          {author && (
            <>
              <span className="text-sm font-medium text-foreground">{author}</span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="text-sm">{formattedDate}</span>
          <span className="text-muted-foreground/40">·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{readingTime} min de lectura</span>
          </div>
        </div>
        
        {/* Share button - Desktop only */}
        {showShare && (
          <button
            onClick={handleShare}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Compartir artículo"
          >
            <Share2 className="h-4 w-4" />
            <span>Compartir</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{formattedDate}</span>
      <span className="text-muted-foreground/40">•</span>
      <span>{readingTime} min</span>
    </div>
  );
};
