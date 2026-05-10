import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Página no encontrada"
        description="La página que buscas no existe o fue movida. Vuelve al inicio de Ecos Digitales."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="container py-20 text-center">
            <p className="text-8xl sm:text-9xl font-bold text-foreground/10 leading-none select-none">
              404
            </p>
            <h1 className="mt-6 text-xl sm:text-2xl font-semibold text-foreground">
              Página no encontrada
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              La página que buscas no existe o fue movida. Puedes volver al inicio o buscar lo que necesitas.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/"
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Ir al inicio
              </Link>
              <Link
                to="/buscar"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Buscar
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
