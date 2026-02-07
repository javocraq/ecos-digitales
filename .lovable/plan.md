

# Plan SEO para Nucleo

## Resumen

De los 5 puntos que mencionas, hay cosas que se pueden implementar directamente en el codigo y otras que requieren acciones manuales fuera de Lovable. Aqui va el desglose:

---

## 1. Subir sitemap a Google Search Console

**Esto es manual, no requiere codigo.** Lo que si puedo hacer es:

- Crear un **edge function** que genere dinamicamente un `sitemap.xml` consultando tu API de articulos y trabajos. Asi el sitemap siempre estara actualizado.
- El sitemap incluira todas las URLs: `/noticias`, `/noticias/:slug`, `/trabajos/:slug`, y `/`.

**Lo que tu haras despues:**
1. Ir a [Google Search Console](https://search.google.com/search-console)
2. Verificar tu dominio (con DNS o meta tag)
3. Enviar la URL del sitemap: `https://tu-dominio.com/sitemap.xml`

---

## 2. Verificar que meta descriptions sean unicas por articulo

**Ya esta parcialmente implementado.** El componente `SEO` genera descripciones dinamicas. Lo que mejorare:

- Generar la descripcion a partir del contenido del articulo (primeros ~155 caracteres), limpiando markdown
- Asegurar que cada pagina (Index, Jobs, Article, JobDetail) tenga una descripcion unica y descriptiva
- Agregar fallbacks para cuando no haya contenido disponible

---

## 3. Agregar structured data (JSON-LD) para noticias

**Se implementara en el componente SEO.** Agregare JSON-LD tipo `NewsArticle` en cada pagina de articulo con:

- `headline`, `image`, `datePublished`, `author`, `publisher`
- Tambien agregare `WebSite` schema en la pagina principal
- Tambien `JobPosting` schema en las paginas de trabajos

---

## 4. Internal linking entre noticias relacionadas

**Ya existe parcialmente.** El componente `RelatedArticles` muestra articulos de la misma categoria. Lo que mejorare:

- Dentro del contenido del articulo, detectar menciones de keywords que coincidan con titulos/categorias de otros articulos y convertirlas en links internos
- Alternativamente, agregar una seccion "Lee tambien" con links a articulos de otras categorias para diversificar el internal linking

---

## 5. Optimizar titulos con keywords

**Esto es mas editorial que tecnico**, pero puedo mejorar la estructura de los titulos SEO:

- Ajustar el formato del `<title>` para incluir la categoria: `"Titulo del Articulo | Categoria | Nucleo"`
- Agregar keywords relevantes en el meta tag `keywords` basado en la categoria del articulo
- Mapear categorias a keywords SEO relevantes (IA, trabajo remoto, No Code, etc.)

---

## Detalles tecnicos

### Archivos a crear:
- `supabase/functions/sitemap/index.ts` -- Edge function para generar sitemap.xml dinamico

### Archivos a modificar:
- `src/components/SEO.tsx` -- Agregar JSON-LD structured data, mejorar formato de titulos, agregar keywords por categoria
- `src/pages/Article.tsx` -- Mejorar generacion de meta description, agregar seccion "Lee tambien" con links a otras categorias
- `src/pages/Index.tsx` -- Asegurar meta description unica
- `src/pages/Jobs.tsx` -- Agregar schema WebSite y meta description unica
- `src/pages/JobDetail.tsx` -- Agregar schema JobPosting

### Edge Function - Sitemap:
La funcion consultara tu API de articulos (`/webhook/v2/articles`) y generara un XML con todas las URLs, incluyendo `lastmod`, `changefreq` y `priority` para cada una.

### JSON-LD - Ejemplo para articulos:
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Titulo del articulo",
  "image": "url-de-imagen",
  "datePublished": "2026-02-04",
  "author": { "@type": "Person", "name": "Autor" },
  "publisher": { "@type": "Organization", "name": "Nucleo" }
}
```

### Nota importante sobre previsualizaciones sociales:
Como se identifico anteriormente, los meta tags OG no son visibles para crawlers de redes sociales porque la app es una SPA. El sitemap y JSON-LD tienen el mismo problema para crawlers que no ejecutan JavaScript. Sin embargo, **Google si ejecuta JavaScript**, asi que el JSON-LD y los meta tags funcionaran para el SEO de Google. Para redes sociales, se necesitaria configurar prerendering a nivel de servidor/CDN.
