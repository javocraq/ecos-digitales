/**
 * Splits sanitized article HTML into top-level block strings using DOMParser.
 *
 * The previous regex-based splitter broke on nested blocks (Tiptap emits
 * `<ul><li><p>…</p></li></ul>` and `<table><tr><td><p>…</p></td></tr></table>`),
 * because its non-greedy `[\s\S]*?` paired with a shared closing-tag alternation
 * stopped at the first `</p>` inside list items or table cells. That truncated
 * tables into loose paragraphs and lists into a single item.
 *
 * Using DOMParser correctly walks the document tree, so each top-level element
 * is returned as its full outerHTML, preserving nested structure.
 */
export function splitContentBlocks(html: string): string[] {
  if (typeof DOMParser === "undefined") {
    // SSR / non-browser fallback: return the whole string as a single block.
    return html.trim().length > 0 ? [html] : [];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) return [];

  const blocks: string[] = [];
  body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      blocks.push(el.outerHTML);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      // Wrap stray text (not inside any block) so it renders consistently.
      if (text.trim().length > 0) {
        blocks.push(`<p>${escapeHtml(text)}</p>`);
      }
    }
  });

  return blocks;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
