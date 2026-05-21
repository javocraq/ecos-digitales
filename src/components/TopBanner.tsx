import { useEffect, useRef, useState } from "react";
import { useTopBanner } from "@/hooks/useTopBanner";

const BANNER_W = 950;
const BANNER_H = 75;

/**
 * Banner HTML: el creativo es un documento fijo de 950×75 px. Para que sea
 * responsive, lo metemos en un iframe de tamaño lógico fijo (950×75) y lo
 * escalamos con transform según el ancho del contenedor.
 */
const HtmlBanner = ({ src }: { src: string }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(w > 0 ? Math.min(1, w / BANNER_W) : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height: BANNER_H * scale }}
    >
      <iframe
        src={src}
        title="Banner publicitario"
        loading="eager"
        scrolling="no"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{
          width: BANNER_W,
          height: BANNER_H,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
};

export const TopBanner = () => {
  const { data: banner, isLoading } = useTopBanner();

  if (isLoading || !banner) return null;

  const isHtml = banner.imageUrl.toLowerCase().split("?")[0].endsWith(".html");

  // Banner HTML: trae su propio click-through interno, no se envuelve en <a>.
  if (isHtml) {
    return (
      <div className="w-full bg-background">
        <div className="container py-4">
          <div className="mx-auto w-full max-w-[950px]">
            <HtmlBanner src={banner.imageUrl} />
          </div>
        </div>
      </div>
    );
  }

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
