import { useState, useCallback } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const EMAIL = "prensa@ecosdigitales.com";

interface PressContactBlockProps {
  variant?: "compact" | "full" | "footer";
}

export const PressContactBlock = ({ variant = "compact" }: PressContactBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = EMAIL;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (variant === "footer") {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            handleCopy();
            toast.success("Copiado en tu portapapeles");
          }}
          className="text-sm text-zinc-300 hover:text-white transition-colors text-left break-all cursor-pointer"
          aria-label="Copiar email de prensa al portapapeles"
        >
          {EMAIL}
        </button>
        <Link
          to="/prensa"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Envía tu nota →
        </Link>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Prensa:</span>
        </div>
        <button
          type="button"
          onClick={() => {
            handleCopy();
            toast.success("Copiado en tu portapapeles");
          }}
          className="text-sm text-foreground hover:underline cursor-pointer"
          aria-label="Copiar email de prensa al portapapeles"
        >
          {EMAIL}
        </button>
      </div>
    );
  }

  // variant === "full"
  return (
    <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Email de prensa</span>
      </div>

      <button
        type="button"
        onClick={() => {
          handleCopy();
          toast.success("Copiado en tu portapapeles");
        }}
        className="text-xl sm:text-2xl font-semibold text-foreground hover:underline break-all cursor-pointer"
        aria-label="Copiar email de prensa al portapapeles"
      >
        {EMAIL}
      </button>
    </div>
  );
};
