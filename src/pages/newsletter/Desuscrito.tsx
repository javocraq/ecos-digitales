import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Desuscrito = () => (
  <>
    <SEO
      title="Te has desuscrito"
      description="Tu suscripción al newsletter de Ecos Digitales ha sido cancelada."
    />
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="container py-20 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Te has desuscrito
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            No recibirás más correos de nuestro newsletter. Si cambias de
            opinión, puedes volver a suscribirte desde nuestro sitio.
          </p>
          <div className="mt-8">
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

export default Desuscrito;
