import { useTopBanner } from "@/hooks/useTopBanner";

export const TopBanner = () => {
  const { data: banner, isLoading } = useTopBanner();

  if (isLoading || !banner) return null;

  const content = (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-zinc-100"
      style={{ aspectRatio: "950 / 75" }}
    >
      <img
        src={banner.imageUrl}
        alt={banner.altText}
        className="absolute inset-0 h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );

  return (
    <div className="w-full bg-background">
      <div className="container py-4">
        <div className="mx-auto w-full max-w-[950px]">
          {banner.linkUrl ? (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={banner.altText}
              className="block transition-opacity hover:opacity-90"
            >
              {content}
            </a>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
};
