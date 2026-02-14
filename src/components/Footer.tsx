import { Linkedin, Youtube } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="container py-8">
        {/* Sígueme section */}
        <div className="flex items-center justify-center gap-6">
          <span className="text-sm text-muted-foreground">Sígueme</span>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.linkedin.com/in/javierfloresmacias/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground transition-opacity hover:opacity-70"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a 
              href="https://www.youtube.com/@jfloresmacias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground transition-opacity hover:opacity-70"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Herramientas section */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="text-sm text-muted-foreground">Herramientas</span>
          <a 
            href="/toolbox" 
            className="text-sm text-foreground hover:underline"
          >
            Ver toolbox →
          </a>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {currentYear} Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};
