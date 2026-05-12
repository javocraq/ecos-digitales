import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface NewsletterFormProps {
  /** Visual variant: "dark" for the footer, "light" for standalone pages */
  variant?: "dark" | "light";
  /** Attribution source stored in the database */
  source?: string;
}

export const NewsletterForm = ({ variant = "dark", source = "footer" }: NewsletterFormProps) => {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();

      if (!trimmed || !EMAIL_RE.test(trimmed)) {
        setStatus("error");
        setMessage("Ingresa un email válido");
        return;
      }

      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmed,
            source,
            ...(honeypot ? { website: honeypot } : {}),
          }),
        });

        const data = (await res.json()) as { success: boolean; message: string };

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
          setEmail("");
        } else {
          setStatus("error");
          setMessage(data.message || "Hubo un problema. Inténtalo de nuevo.");
        }
      } catch {
        setStatus("error");
        setMessage("Error de conexión. Inténtalo de nuevo.");
      }
    },
    [email, honeypot],
  );

  return (
    <div>
      {status === "success" ? (
        <p className={cn("text-sm", variant === "dark" ? "text-emerald-400" : "text-emerald-600")} role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor={`${source}-newsletter-email`} className="sr-only">
            Tu email
          </label>
          <input
            id={`${source}-newsletter-email`}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            required
            className={cn(
              "flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1",
              variant === "dark"
                ? "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500"
                : "border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary",
            )}
          />
          {/* Honeypot — oculto para humanos, visible para bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={cn(
              "shrink-0 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              variant === "dark"
                ? "bg-white text-zinc-950 focus-visible:ring-zinc-400 focus-visible:ring-offset-zinc-950"
                : "bg-foreground text-background focus-visible:ring-primary focus-visible:ring-offset-background",
            )}
          >
            {status === "loading" ? "Enviando..." : "Suscribirme"}
          </button>
        </form>
      )}
      {status === "error" && message && (
        <p className={cn("mt-2 text-xs", variant === "dark" ? "text-red-400" : "text-red-500")} role="alert">
          {message}
        </p>
      )}
    </div>
  );
};
