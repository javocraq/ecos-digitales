import { describe, it, expect } from "vitest";
import { splitContentBlocks } from "./splitContentBlocks";

describe("splitContentBlocks", () => {
  it("splits consecutive paragraphs", () => {
    const blocks = splitContentBlocks("<p>One</p><p>Two</p>");
    expect(blocks).toEqual(["<p>One</p>", "<p>Two</p>"]);
  });

  it("keeps Tiptap-style table intact (with <p> inside cells)", () => {
    // This is the shape Tiptap emits for a table. The old regex-based splitter
    // fragmented this because its non-greedy match stopped at the first </p>
    // inside a <td>.
    const html =
      '<table class="tiptap-table">' +
      "<tbody>" +
      "<tr><th><p>Especificación</p></th><th><p>Galaxy A37 5G</p></th></tr>" +
      "<tr><td><p>Procesador</p></td><td><p>Exynos 1480</p></td></tr>" +
      "</tbody>" +
      "</table>";

    const blocks = splitContentBlocks(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("<table");
    expect(blocks[0]).toContain("</table>");
    expect(blocks[0]).toContain("Galaxy A37 5G");
    expect(blocks[0]).toContain("Exynos 1480");
  });

  it("keeps bullet list with nested <li><p> intact", () => {
    // Tiptap wraps list-item content in <p>. The old splitter truncated the
    // <ul> at the first </p>, losing every list item after the first.
    const html =
      "<ul>" +
      "<li><p>Galaxy A37 5G: desde $1.799</p></li>" +
      "<li><p>Galaxy A57 5G: desde $1.999</p></li>" +
      "<li><p>Entrega inmediata</p></li>" +
      "</ul>";

    const blocks = splitContentBlocks(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].match(/<li>/g) ?? []).toHaveLength(3);
    expect(blocks[0]).toContain("Galaxy A37 5G: desde $1.799");
    expect(blocks[0]).toContain("Galaxy A57 5G: desde $1.999");
    expect(blocks[0]).toContain("Entrega inmediata");
  });

  it("preserves aside.callout blocks", () => {
    const html =
      '<p>Intro</p><aside class="callout" data-variant="note"><p>Nota importante</p></aside><p>Final</p>';

    const blocks = splitContentBlocks(html);

    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toContain('class="callout"');
    expect(blocks[1]).toContain('data-variant="note"');
    expect(blocks[1]).toContain("Nota importante");
  });

  it("handles void and self-closing top-level blocks", () => {
    const html = '<p>Before</p><hr><img src="x.jpg"><iframe src="y"></iframe><p>After</p>';
    const blocks = splitContentBlocks(html);
    expect(blocks).toHaveLength(5);
    expect(blocks[1].toLowerCase()).toContain("<hr");
    expect(blocks[2].toLowerCase()).toContain("<img");
    expect(blocks[3].toLowerCase()).toContain("<iframe");
  });

  it("returns empty array for empty/whitespace input", () => {
    expect(splitContentBlocks("")).toEqual([]);
    expect(splitContentBlocks("   \n  ")).toEqual([]);
  });

  it("wraps loose text nodes in paragraphs", () => {
    const blocks = splitContentBlocks("Orphan text<p>Block</p>");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toBe("<p>Orphan text</p>");
    expect(blocks[1]).toBe("<p>Block</p>");
  });

  it("preserves blockquote (used as current workaround for notes)", () => {
    const html = "<blockquote><p>Quoted</p></blockquote>";
    const blocks = splitContentBlocks(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("<blockquote");
    expect(blocks[0]).toContain("Quoted");
  });

  it("joined blocks produce valid HTML with nested structure intact", () => {
    // Regression: the old splitter joined fragments and the browser auto-
    // closed them, producing nested <p>s inside a single <li>.
    const html =
      "<ul><li><p>A</p></li><li><p>B</p></li></ul>" +
      "<table><tr><td><p>X</p></td><td><p>Y</p></td></tr></table>";

    const joined = splitContentBlocks(html).join("");

    // Each <li> should still have its own <p>
    expect((joined.match(/<li><p>/g) ?? []).length).toBe(2);
    // Table should keep all its cells
    expect((joined.match(/<td>/g) ?? []).length).toBe(2);
  });
});
