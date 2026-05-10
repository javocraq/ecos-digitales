import { useState, useCallback } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const NewsletterForm = () => {
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
            source: "footer",
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
        <p className="text-sm text-emerald-400" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Tu email
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            required
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            {status === "loading" ? "Enviando…" : "Suscribirme"}
          </button>
        </form>
      )}
      {status === "error" && message && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {message}
        </p>
      )}
    </div>
  );
};
