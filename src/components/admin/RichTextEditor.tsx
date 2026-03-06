import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Minus,
  Unlink,
  Loader2,
  Table2,
  Code,
  Plus,
  Trash2,
  Twitter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

// TipTap's blockquote schema strips class/data-* attributes from blockquotes.
// This function detects blockquotes containing twitter.com/x.com links with "Tweet"
// text (the signature of our tweet embeds) and restores the twitter-tweet class
// so the correct HTML is saved to the database.
const restoreTweetEmbeds = (html: string): string =>
  html.replace(
    /<blockquote><p><a[^>]*href="(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+)"[^>]*>Tweet<\/a><\/p><\/blockquote>/g,
    '<blockquote class="twitter-tweet"><a href="$1">Tweet</a></blockquote>'
  );

export const RichTextEditor = ({ content, onUpdate }: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showTweetPopup, setShowTweetPopup] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full my-4" },
      }),
      Placeholder.configure({
        placeholder: "Comenzá a escribir tu nota...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "tiptap-table" },
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onUpdate(restoreTweetEmbeds(e.getHTML()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[400px] px-5 py-2 focus:outline-none text-neutral-800",
      },
    },
  });

  // Close table menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setShowTableMenu(false);
      }
    };
    if (showTableMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTableMenu]);

  const handleLinkSubmit = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    const url = linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkPopup(false);
  }, [editor, linkUrl]);

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkPopup(false);
  }, [editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/) && file.type !== "") {
        toast.error("Solo se aceptan imágenes JPG, PNG o WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar 5MB");
        return;
      }
      setUploadingImage(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("news-images")
          .upload(fileName, file, { contentType: file.type || "image/jpeg", upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(fileName);
        editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
        toast.success("Imagen insertada");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al subir imagen";
        toast.error(msg);
      } finally {
        setUploadingImage(false);
      }
    },
    [editor]
  );

  const handleToggleHtml = useCallback(() => {
    if (!editor) return;
    if (!showHtml) {
      // Switching to HTML mode
      setHtmlSource(editor.getHTML());
      setShowHtml(true);
    } else {
      // Switching back to visual mode
      editor.commands.setContent(htmlSource);
      onUpdate(htmlSource);
      setShowHtml(false);
    }
  }, [editor, showHtml, htmlSource, onUpdate]);

  const handleTweetInsert = useCallback(() => {
    if (!editor || !tweetUrl.trim()) return;
    const url = tweetUrl.trim();
    const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    if (!match) {
      toast.error("URL de tweet inválida. Usá el formato: https://x.com/usuario/status/123...");
      return;
    }
    // Insert as raw HTML appended to current content. TipTap's setContent will
    // strip class/data-* attrs, but restoreTweetEmbeds in onUpdate restores them
    // before saving to the database.
    const tweetBlockquote = `<blockquote class="twitter-tweet"><a href="https://twitter.com/${match[1]}/status/${match[2]}">Tweet</a></blockquote>`;
    const currentHtml = editor.getHTML();
    editor.commands.setContent(currentHtml + tweetBlockquote + "<p></p>");
    setTweetUrl("");
    setShowTweetPopup(false);
    toast.success("Tweet insertado");
  }, [editor, tweetUrl]);

  if (!editor) return null;

  const isInTable = editor.isActive("table");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Subrayado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título H2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título H3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => {
              if (editor.isActive("link")) {
                const attrs = editor.getAttributes("link");
                setLinkUrl(attrs.href || "");
              } else {
                setLinkUrl("");
              }
              setShowLinkPopup(!showLinkPopup);
            }}
            title="Insertar link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          {showLinkPopup && (
            <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLinkSubmit()}
                  placeholder="https://..."
                  autoFocus
                  className="h-8 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-sm focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all duration-200"
                />
                <button
                  onClick={handleLinkSubmit}
                  className="h-8 px-3 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"
                >
                  OK
                </button>
                {editor.isActive("link") && (
                  <button
                    onClick={handleRemoveLink}
                    className="h-8 px-2 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 transition-all duration-200"
                    title="Quitar link"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <ToolbarButton
          active={false}
          onClick={() => !uploadingImage && imageInputRef.current?.click()}
          title="Insertar imagen"
        >
          {uploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Separador horizontal"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        {/* Table */}
        <div className="relative" ref={tableMenuRef}>
          <ToolbarButton
            active={isInTable}
            onClick={() => {
              if (isInTable) {
                setShowTableMenu(!showTableMenu);
              } else {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }
            }}
            title={isInTable ? "Opciones de tabla" : "Insertar tabla 3x3"}
          >
            <Table2 className="h-4 w-4" />
          </ToolbarButton>

          {showTableMenu && isInTable && (
            <div className="absolute left-0 top-full mt-2 z-50 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().addRowBefore().run();
                  setShowTableMenu(false);
                }}
                icon={<Plus className="h-3.5 w-3.5" />}
                label="Fila arriba"
              />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                  setShowTableMenu(false);
                }}
                icon={<Plus className="h-3.5 w-3.5" />}
                label="Fila abajo"
              />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                  setShowTableMenu(false);
                }}
                icon={<Plus className="h-3.5 w-3.5" />}
                label="Columna a la izquierda"
              />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run();
                  setShowTableMenu(false);
                }}
                icon={<Plus className="h-3.5 w-3.5" />}
                label="Columna a la derecha"
              />
              <div className="my-1 h-px bg-neutral-200" />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().deleteRow().run();
                  setShowTableMenu(false);
                }}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Eliminar fila"
                destructive
              />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().deleteColumn().run();
                  setShowTableMenu(false);
                }}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Eliminar columna"
                destructive
              />
              <TableMenuItem
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  setShowTableMenu(false);
                }}
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Eliminar tabla"
                destructive
              />
            </div>
          )}
        </div>

        {/* Twitter embed */}
        <div className="relative">
          <ToolbarButton
            active={false}
            onClick={() => {
              setTweetUrl("");
              setShowTweetPopup(!showTweetPopup);
            }}
            title="Insertar tweet"
          >
            <Twitter className="h-4 w-4" />
          </ToolbarButton>

          {showTweetPopup && (
            <div className="absolute left-0 top-full mt-2 z-50 w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
              <p className="text-xs text-neutral-500 mb-2">Pegá la URL del tweet de X/Twitter</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTweetInsert()}
                  placeholder="https://x.com/usuario/status/..."
                  autoFocus
                  className="h-8 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-sm focus:bg-white focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all duration-200"
                />
                <button
                  onClick={handleTweetInsert}
                  className="h-8 px-3 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacer to push HTML toggle to the right */}
        <div className="flex-1" />

        {/* HTML Toggle */}
        <ToolbarButton
          active={showHtml}
          onClick={handleToggleHtml}
          title={showHtml ? "Volver a visual" : "Editar HTML"}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      {showHtml ? (
        <textarea
          value={htmlSource}
          onChange={(e) => setHtmlSource(e.target.value)}
          className="w-full min-h-[400px] px-5 py-3 font-mono text-sm bg-neutral-900 text-green-400 focus:outline-none resize-y"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};

const ToolbarButton = ({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
      active
        ? "bg-neutral-900 text-white shadow-sm"
        : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
    }`}
  >
    {children}
  </button>
);

const ToolbarSeparator = () => (
  <div className="mx-1.5 h-4 w-px bg-neutral-200" />
);

const TableMenuItem = ({
  onClick,
  icon,
  label,
  destructive = false,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
      destructive
        ? "text-red-500 hover:bg-red-50"
        : "text-neutral-700 hover:bg-neutral-100"
    }`}
  >
    {icon}
    {label}
  </button>
);
