import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PressContactBlock } from "@/components/PressContactBlock";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Rocket,
  BarChart3,
  UserCheck,
  CalendarDays,
  Building2,
  TrendingUp,
  XCircle,
  CheckCircle2,
} from "lucide-react";

const TOPICS = [
  {
    icon: Rocket,
    text: "Lanzamientos de productos y servicios tecnológicos",
  },
  {
    icon: BarChart3,
    text: "Reportes de industria, estudios y data de mercado (IDC, Gartner, consultoras)",
  },
  {
    icon: UserCheck,
    text: "Nombramientos ejecutivos en empresas tech, telco y digitales",
  },
  {
    icon: CalendarDays,
    text: "Eventos, conferencias y workshops del sector",
  },
  {
    icon: Building2,
    text: "Casos de transformación digital y adopción tecnológica empresarial",
  },
  {
    icon: TrendingUp,
    text: "Resultados financieros y rondas de inversión en tech",
  },
];

const REJECTED = [
  "Contenido puramente promocional sin ángulo informativo",
  "Notas de sectores fuera de tecnología y negocios",
  "Material sin fuente verificable o sin contacto de la agencia",
];

const CHECKLIST = [
  "Titular claro y descriptivo",
  "Cuerpo de la nota en el correo o como adjunto (.docx, .pdf)",
  "Una o dos imágenes en alta resolución (mínimo 1200 px de ancho), con créditos",
  "Datos de contacto de la agencia o vocero",
];

const FAQ = [
  {
    q: "¿Publican todas las notas que reciben?",
    a: "No, evaluamos según relevancia editorial y línea temática.",
  },
  {
    q: "¿Cobran por publicar notas de prensa?",
    a: "No, la publicación es completamente gratuita.",
  },
  {
    q: "¿Pueden cubrir nuestro evento?",
    a: "Escríbenos a prensa@ecosdigitales.com con los detalles y te confirmamos disponibilidad.",
  },
];

const contactPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Prensa — Ecos Digitales",
  description:
    "Canal oficial de prensa de Ecos Digitales. Envía tus notas de prensa de tecnología y negocios.",
  url: "https://ecosdigitales.com/prensa",
  contactPoint: {
    "@type": "ContactPoint",
    email: "prensa@ecosdigitales.com",
    contactType: "Press inquiries",
    areaServed: "LATAM",
    availableLanguage: ["Spanish", "English"],
  },
};

const Prensa = () => {
  return (
    <>
      <SEO
        title="Envía tu nota de prensa"
        description="Canal oficial de prensa de Ecos Digitales. Envía tus notas de prensa de tecnología y negocios a prensa@ecosdigitales.com. Cobertura en Perú y Latinoamérica."
        url="https://ecosdigitales.com/prensa"
        type="website"
        jsonLd={contactPageJsonLd}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero */}
          <section className="container py-16 md:py-24 text-center">
            <h1 className="mx-auto max-w-3xl text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-bold leading-[1.1] text-foreground tracking-tight">
              Envía tu nota de prensa a Ecos Digitales
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
              Cubrimos tecnología, innovación y negocios en Perú y
              Latinoamérica.
            </p>
            <div className="mx-auto mt-10 max-w-lg">
              <PressContactBlock variant="full" />
            </div>
          </section>

          {/* Qué publicamos */}
          <section className="container pb-16">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Qué publicamos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOPICS.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-5"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm leading-relaxed text-foreground">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Qué no publicamos */}
          <section className="container pb-16">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Qué no publicamos
            </h2>
            <ul className="space-y-3">
              {REJECTED.map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Cómo enviar tu nota */}
          <section className="container pb-16">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Cómo enviar tu nota
            </h2>
            <ol className="space-y-3">
              {CHECKLIST.map((text, i) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground pt-0.5">
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* Tiempos de respuesta */}
          <section className="container pb-16">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Tiempos de respuesta
            </h2>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                Revisamos todas las notas que recibimos. Si tu material es
                publicado, te enviamos el link en un plazo de 24 a 48 horas
                hábiles.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="container pb-16">
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Preguntas frecuentes
            </h2>
            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible>
                {FAQ.map(({ q, a }, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm text-left">
                      {q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA final */}
          <section className="container pb-16">
            <div className="mx-auto max-w-lg">
              <PressContactBlock variant="full" />
            </div>
          </section>

          {/* Nota legal */}
          <section className="container pb-20">
            <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/70">
              Las notas de prensa enviadas pueden ser editadas o adaptadas
              editorialmente por nuestro equipo antes de su publicación, en línea
              con nuestra línea editorial.
            </p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Prensa;
