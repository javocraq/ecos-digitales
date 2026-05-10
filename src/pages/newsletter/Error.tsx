import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const MESSAGES: Record<string, string> = {
  notfound: "El enlace que usaste no es válido o ha expirado.",
  expired: "Este enlace ha expirado. Intenta suscribirte de nuevo.",
  "already-confirmed": "Tu suscripción ya estaba confirmada. No necesitas hacer nada más.",
};

const DEFAULT_MESSAGE = "Algo salió mal. Intenta de nuevo en un momento.";

const NewsletterError = () => {
  const [params] = useSearchParams();
  const reason = params.get("reason") || "";
  const message = MESSAGES[reason] || DEFAULT_MESSAGE;

  return (
    <>
      <SEO
        title="Error de suscripción"
        description="Hubo un problema con tu suscripción al newsletter de Ecos Digitales."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="container py-20 text-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {reason === "already-confirmed"
                ? "Ya estás suscrito"
                : "Hubo un problema"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              {message}
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Ir al inicio
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsletterError;
