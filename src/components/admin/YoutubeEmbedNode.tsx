import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Play, X } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";

/**
 * Extrae el videoId de cualquier URL común de YouTube. Retorna null si no
 * matchea.
 */
export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns: RegExp[] = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  // Fallback: cualquier v= con 11 chars
  const fallback = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return fallback?.[1] || null;
};

/**
 * Vista del nodo dentro del editor TipTap: muestra la miniatura de YouTube
 * con overlay de play, no embebe el iframe (para que el editor no se haga
 * lento ni dispare reproducciones).
 */
const YoutubeEmbedView = ({ node, deleteNode }: NodeViewProps) => {
  const src: string = node.attrs.src || "";
  const videoId: string = node.attrs.videoId || extractYoutubeId(src) || "";
  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "";

  return (
    <NodeViewWrapper className="my-4" contentEditable={false} draggable>
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          aspectRatio: "16 / 9",
          userSelect: "none",
        }}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt="YouTube video"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.85,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
            }}
          >
            URL de YouTube no válida
          </div>
        )}

        {/* Play overlay */}
        {thumbUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,0,0,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <Play
                style={{ width: 26, height: 26, color: "#fff", marginLeft: 3 }}
                fill="#fff"
              />
            </div>
          </div>
        )}

        {/* URL footer */}
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            padding: "4px 10px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: 11,
            borderRadius: 6,
            maxWidth: "70%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {src}
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={deleteNode}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "none",
            background: "rgba(0,0,0,0.6)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
          }}
          title="Eliminar video"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

/**
 * Nodo TipTap para embebir YouTube. En el editor muestra preview con
 * thumbnail. En el HTML final emite un <div class="youtube-embed"> con un
 * <iframe> responsive 16:9 (estilos inline para no depender del CSS del
 * sitio público; DOMPurify ya permite iframe via Article.tsx).
 */
export const YoutubeEmbed = Node.create({
  name: "youtubeEmbed",
  group: "block",
  atom: true,
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      videoId: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.youtube-embed',
        getAttrs(node) {
          const el = node as HTMLElement;
          const iframe = el.querySelector("iframe");
          const iframeSrc = iframe?.getAttribute("src") || "";
          const dataId = el.getAttribute("data-video-id");
          const videoId = dataId || extractYoutubeId(iframeSrc);
          return {
            src: videoId ? `https://youtu.be/${videoId}` : iframeSrc,
            videoId: videoId || null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const src: string = node.attrs.src || "";
    const videoId: string = node.attrs.videoId || extractYoutubeId(src) || "";
    if (!videoId) {
      // Sin videoId, dejamos al menos un párrafo con el URL para no perderlo
      return ["p", {}, src];
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return [
      "div",
      mergeAttributes({
        class: "youtube-embed",
        "data-video-id": videoId,
        style:
          "position:relative;padding-bottom:56.25%;height:0;margin:1.5rem 0;border-radius:12px;overflow:hidden;background:#000;",
      }),
      [
        "iframe",
        {
          src: embedUrl,
          style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          frameborder: "0",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          title: "YouTube video player",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeEmbedView);
  },
});
