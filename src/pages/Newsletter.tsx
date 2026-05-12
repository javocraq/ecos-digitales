import { Link } from "react-router-dom";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SEO } from "@/components/SEO";

const Newsletter = () => (
  <>
    <SEO
      title="Suscríbete al Newsletter"
      description="Recibe cada semana lo más relevante de tecnología, telecomunicaciones y negocios digitales en Latinoamérica. Sin spam."
    />
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header — just the logo */}
      <header className="w-full border-b border-border">
        <div className="container flex h-16 items-center">
          <Link
            to="/"
            className="transition-opacity hover:opacity-80"
            aria-label="Ecos Digitales — Inicio"
          >
            <img
              src="/logo-ecosdigitales-v2.svg"
              alt="Ecos Digitales"
              className="h-[24px] sm:h-[27px] w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main — centered form */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Suscríbete al Newsletter
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Recibe cada semana lo más relevante de tecnología,
            telecomunicaciones y negocios digitales en Latinoamérica.
          </p>

          <div className="mt-8">
            <NewsletterForm variant="light" source="landing" />
          </div>

          <p className="mt-4 text-xs text-muted-foreground/70">
            Sin spam. Puedes darte de baja en cualquier momento.
          </p>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <span>
          &copy; {new Date().getFullYear()}{" "}
          <Link to="/" className="underline underline-offset-2 hover:text-foreground">
            Ecos Digitales
          </Link>
        </span>
      </footer>
    </div>
  </>
);

export default Newsletter;
