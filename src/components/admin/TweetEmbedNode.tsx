import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Twitter, X } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";

const TweetEmbedView = ({ node, deleteNode }: NodeViewProps) => {
  const src: string = node.attrs.src || "";
  const match = src.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
  const username = match?.[1] || "tweet";

  return (
    <NodeViewWrapper className="my-4" contentEditable={false} draggable>
      <div
        style={{
          background: "#f5f5f5",
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Twitter style={{ width: 18, height: 18, color: "#fff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#1a1a1a",
              lineHeight: 1.3,
            }}
          >
            @{username}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#999",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.4,
            }}
          >
            {src}
          </div>
        </div>
        <button
          type="button"
          onClick={deleteNode}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e5e5e5";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#999";
          }}
          title="Eliminar tweet"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const TweetEmbed = Node.create({
  name: "tweetEmbed",
  group: "block",
  atom: true,
  isolating: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote.twitter-tweet',
        getAttrs(node) {
          const el = node as HTMLElement;
          const anchor = el.querySelector("a");
          return { src: anchor?.getAttribute("href") || null };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const src = node.attrs.src || "";
    // Produces the exact HTML that Twitter widgets.js expects
    return [
      "blockquote",
      mergeAttributes({ class: "twitter-tweet" }),
      ["a", { href: src }, "Tweet"],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetEmbedView);
  },
});
