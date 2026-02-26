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
  const formattedDateShort = format(new Date(publishedDate), "d MMM", { locale: es });
  const formattedDateLong = format(new Date(publishedDate), "d MMM, yyyy", { locale: es });

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Enlace copiado al portapapeles");
  };

  if (variant === "large") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-4 text-muted-foreground whitespace-nowrap overflow-hidden min-w-0">
          {author && (
            <>
              <span className="text-[11px] sm:text-xs font-medium text-foreground truncate">{author}</span>
              <span className="text-muted-foreground/40 flex-shrink-0">·</span>
            </>
          )}
          <span className="text-[11px] sm:text-xs flex-shrink-0">
            <span className="sm:hidden">{formattedDateShort}</span>
            <span className="hidden sm:inline">{formattedDateLong}</span>
          </span>
          <span className="text-muted-foreground/40 flex-shrink-0">·</span>
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <Clock className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
            <span className="text-[11px] sm:text-xs">
              <span className="sm:hidden">{readingTime} min</span>
              <span className="hidden sm:inline">{readingTime} min de lectura</span>
            </span>
          </div>
        </div>

        {/* Share button - Desktop only */}
        {showShare && (
          <button
            onClick={handleShare}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex-shrink-0 ml-4"
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
