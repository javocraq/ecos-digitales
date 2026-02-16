import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedVideoProps {
  videoId: string;
  title: string;
  description: string;
  isLoading?: boolean;
}

// YouTube thumbnail component with fallback handling
const YouTubeThumbnail = ({ 
  videoId, 
  title, 
  className 
}: { 
  videoId: string; 
  title: string; 
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Try standard quality as final fallback
      setImgSrc(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={title}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
};

export const FeaturedVideo = ({
  videoId,
  title,
  description,
  isLoading = false,
}: FeaturedVideoProps) => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (isLoading) {
    return (
      <div className="bg-[#FAFAFA] dark:bg-muted/30">
      <section className="container py-4 md:py-6">
        <SectionHeader title="Último video" />
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center gap-3 pt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
            <Skeleton className="w-full md:w-80 lg:w-96 aspect-video rounded-xl" />
          </div>
        </div>
      </section>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] dark:bg-muted/30">
    <section className="container py-4 md:py-6">
      <SectionHeader title="Último video" />
      
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/20"
      >
        {/* Mobile layout: Thumbnail on top */}
        <div className="md:hidden">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <YouTubeThumbnail
              videoId={videoId}
              title={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Desktop layout: Side by side like the reference */}
        <div className="hidden md:flex md:flex-row items-stretch">
          {/* Left content */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl lg:text-3xl font-semibold text-foreground leading-tight mb-4">
                {title}
              </h3>
              <p className="text-base text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
          </div>
          
          {/* Right: Video thumbnail */}
          <div className="w-80 lg:w-96 flex-shrink-0 p-4">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <YouTubeThumbnail
                videoId={videoId}
                title={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </a>
    </section>
    </div>
  );
};
