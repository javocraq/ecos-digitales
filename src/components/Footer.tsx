import { Link } from "react-router-dom";
import { Linkedin, Youtube, Instagram } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/company/ecosdigitales/",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    href: "https://www.youtube.com/@jfloresmacias",
    label: "YouTube",
    icon: Youtube,
  },
  {
    // TODO: confirmar URL de Instagram
    href: "https://www.instagram.com/ecosdigitales/",
    label: "Instagram",
    icon: Instagram,
  },
];

const FooterColumnHeader = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
    {children}
  </h4>
);

const FooterLink = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    className="block text-sm leading-relaxed text-zinc-400 transition-colors hover:text-white"
  >
    {children}
  </Link>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-zinc-950 text-zinc-100">
      {/* ── Bloque 1: Logo + Social ─────────────────────────── */}
      <div className="container flex flex-col items-center gap-6 py-12 sm:flex-row sm:items-center sm:justify-between md:py-16">
        <Link to="/" aria-label="Ecos Digitales — Inicio">
          <img
            src="/logo-ecosdigitales-v2.svg"
            alt="Ecos Digitales"
            className="h-8 sm:h-9 w-auto brightness-0 invert"
          />
        </Link>

        <div className="flex items-center gap-5">
          {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>

      {/* ── Bloque 2: Newsletter ────────────────────────────── */}
      <div className="border-y border-zinc-800">
        <div className="container py-10 md:py-12">
          <div className="mx-auto max-w-2xl text-center sm:text-left">
            <h3 className="text-lg font-semibold text-zinc-100 sm:text-xl">
              Recibe lo mejor de la tecnología cada semana
            </h3>
            <p className="mt-2 mb-5 text-sm text-zinc-400">
              Análisis, lanzamientos y tendencias de tech y negocios en LATAM.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── Bloque 3: Dos columnas ──────────────────────────── */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-10">
          {/* Col 1 — Ediciones */}
          <div>
            <FooterColumnHeader>Ediciones</FooterColumnHeader>
            <nav className="flex flex-col gap-2.5" aria-label="Ediciones del mes">
              <FooterLink to="/ediciones">Edición actual</FooterLink>
              <FooterLink to="/ediciones">Ediciones anteriores</FooterLink>
            </nav>
          </div>

          {/* Col 2 — Ecos Digitales */}
          <div>
            <FooterColumnHeader>Ecos Digitales</FooterColumnHeader>
            <nav className="flex flex-col gap-2.5" aria-label="Sobre el medio">
              <FooterLink to="/sobre-nosotros">Sobre Ecos Digitales</FooterLink>
              {/* TODO: crear página /equipo */}
              <FooterLink to="/equipo">Equipo editorial</FooterLink>
              <FooterLink to="/prensa">Envía tu nota de prensa</FooterLink>
            </nav>
          </div>
        </div>
      </div>

      {/* ── Bloque 4: Línea inferior ────────────────────────── */}
      <div className="border-t border-zinc-800">
        <div className="container py-6 text-center text-xs text-zinc-500">
          <span>© {currentYear} Ecos Digitales. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
};
