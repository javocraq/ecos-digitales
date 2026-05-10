import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sobre Ecos Digitales",
  description:
    "Medio de comunicación independiente especializado en tecnología, telecomunicaciones y negocios digitales en América Latina.",
  url: "https://ecosdigitales.com/sobre-nosotros",
  publisher: {
    "@type": "Organization",
    name: "Ecos Digitales",
    url: "https://ecosdigitales.com",
    areaServed: "LATAM",
  },
};

const SobreNosotros = () => (
  <>
    <SEO
      title="Sobre Ecos Digitales"
      description="Medio de comunicación independiente especializado en tecnología, telecomunicaciones y negocios digitales en América Latina. Cobertura editorial desde 2017."
      url="https://ecosdigitales.com/sobre-nosotros"
      type="website"
      jsonLd={aboutJsonLd}
    />
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <article className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-[28px] font-bold leading-tight text-foreground sm:text-[34px] lg:text-[46px]">
            Sobre Ecos Digitales
          </h1>

          <div className="article-content prose prose-lg max-w-none dark:prose-invert">
            <p>
              Ecos Digitales es un medio de comunicación independiente
              especializado en noticias de tecnología, telecomunicaciones y
              negocios digitales en América Latina. Cubrimos inteligencia
              artificial, ciberseguridad, startups, innovación, transformación
              digital y la industria tech regional.
            </p>
            <p>
              Nuestro foco geográfico es Perú, México y la región
              hispanohablante, aunque cubrimos desarrollos globales cuando
              tienen impacto directo en la región.
            </p>

            <h2>Línea editorial</h2>
            <p>
              Publicamos noticias, análisis y reportes sobre la industria
              tecnológica. Nuestros artículos se clasifican en categorías que
              incluyen Inteligencia Artificial, Ciberseguridad,
              Telecomunicaciones, Aerolíneas, Startups, Negocios Digitales,
              Innovación, Hardware, Software, Tecnología de Consumo, Política
              Digital, Blockchain, Criptomonedas, Internet, Empresas Tech,
              Computación Cuántica y Transformación Digital, entre otras.
            </p>
            <p>
              La línea editorial prioriza el rigor informativo sobre el
              volumen. Cubrimos lanzamientos de productos, reportes de
              industria, nombramientos ejecutivos, eventos del sector, casos de
              transformación digital, resultados financieros y rondas de
              inversión en tecnología.
            </p>

            <h2>Ediciones del Mes</h2>
            <p>
              Cada mes publicamos una curaduría editorial con las 10 noticias
              más relevantes del período. Las{" "}
              <Link to="/ediciones">Ediciones del Mes</Link> se publican el día
              1 del mes siguiente al que cubren — la edición de marzo se publica
              el 1 de abril — y representan una selección manual de las notas
              que consideramos más significativas.
            </p>
            <p>
              El archivo de ediciones cubre todos los meses desde 2017 hasta el
              presente, agrupado por año.
            </p>

            <h2>Cobertura y presencia</h2>
            <p>
              Operamos desde 2017. Publicamos contenido diariamente y
              mantenemos presencia en{" "}
              <a
                href="https://www.linkedin.com/company/ecosdigitales/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              ,{" "}
              <a
                href="https://www.youtube.com/@jfloresmacias"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>{" "}
              e{" "}
              <a
                href="https://www.instagram.com/ecosdigitales/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              .
            </p>

            <h2>Newsletter</h2>
            <p>
              Enviamos un resumen semanal con lo más relevante de tecnología y
              negocios en Latinoamérica. Puedes suscribirte desde el pie de
              cualquier página del sitio. Usamos doble opt-in: recibirás un
              correo de confirmación antes de activar tu suscripción.
            </p>

            <h2>Contacto</h2>
            <p>
              Para enviar notas de prensa, visita nuestra página de{" "}
              <Link to="/prensa">prensa</Link>.
            </p>
            <p>
              Para consultas generales, puedes escribirnos a{" "}
              <a href="mailto:prensa@ecosdigitales.com">
                prensa@ecosdigitales.com
              </a>
              .
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  </>
);

export default SobreNosotros;
