import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Callout / Note block.
 *
 * Renders as:
 *   <aside class="callout" data-variant="note">...block content...</aside>
 *
 * Toggled via `toggleCallout`. Can wrap any block content and can be nested into
 * lists/quotes if needed. Unlike <blockquote>, it's styled as a highlighted
 * "destacado" box with a left accent bar.
 */

type CalloutVariant = "note" | "info" | "warning" | "success";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wrap the current block in a callout (or unwrap if already inside one). */
      toggleCallout: (variant?: CalloutVariant) => ReturnType;
      /** Force a wrap without toggling. */
      setCallout: (variant?: CalloutVariant) => ReturnType;
      /** Lift the current selection out of the callout. */
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "note" as CalloutVariant,
        parseHTML: (el) =>
          (el as HTMLElement).getAttribute("data-variant") || "note",
        renderHTML: (attrs) => {
          if (!attrs.variant) return {};
          return { "data-variant": attrs.variant };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside.callout" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { class: "callout" }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleCallout:
        (variant) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, variant ? { variant } : undefined),
      setCallout:
        (variant) =>
        ({ commands }) =>
          commands.wrapIn(this.name, variant ? { variant } : undefined),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
