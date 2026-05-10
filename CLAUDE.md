# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Contexto operativo del proyecto **Ecos Digitales** para asistentes Claude Code (y para humanos que se incorporen al equipo). Este archivo describe la arquitectura, convenciones y operaciones críticas. Léelo antes de hacer cambios estructurales.

---

## 1. Qué es Ecos Digitales

Medio de comunicación independiente especializado en noticias de tecnología, telecomunicaciones y negocios digitales en LATAM (foco Perú/México). Sitio público en `https://ecosdigitales.com`.

- **Stack**: React 18 + Vite + TypeScript + Tailwind + Supabase (Postgres + Auth) + Cloudflare Pages.
- **Hosting**: Cloudflare Pages, deploy automático en cada `git push origin main`.
- **CMS**: backend interno hecho a medida (no WordPress, no Strapi). Editor TipTap. Path admin obfuscado: `/r7yk5igg9myaoy090drr/*`.

---

## 2. Estructura del repo

```
Ecos Digitales/
├── public/                      # Assets estáticos servidos tal cual
│   ├── llms.txt                 # Guía para LLMs (formato llmstxt.org)
│   ├── robots.txt               # Buscadores + bots IA, disallow admin
│   └── logo-ecosdigitales-v2.svg
│
├── functions/                   # Cloudflare Pages Functions (edge runtime)
│   ├── _lib/newsletter.ts      # Helpers compartidos: Supabase REST, Resend API, email templates
│   ├── api/newsletter/
│   │   ├── subscribe.ts         # POST: registra suscriptor + envía email de confirmación
│   │   ├── confirm.ts           # GET: confirma suscripción + envía email de bienvenida
│   │   ├── unsubscribe.ts       # GET: one-click unsubscribe (estándar Gmail/Yahoo 2024)
│   │   └── webhook.ts           # POST: webhooks de Resend (opens, clicks, bounces)
│   ├── noticias/[slug].ts       # OG meta tags dinámicos para crawlers de redes
│   └── sitemap.xml.ts           # Sitemap generado dinámicamente desde Supabase
│
├── src/
│   ├── components/
│   │   ├── admin/               # Componentes específicos del admin
│   │   │   ├── AdminLayout.tsx          # Sidebar + frame
│   │   │   ├── EditionAssignment.tsx    # Toggle de ediciones en Editor.tsx
│   │   │   └── RichTextEditor.tsx       # Editor TipTap
│   │   ├── Header.tsx           # Navbar público
│   │   ├── Footer.tsx           # Dark footer (zinc-950): newsletter + 3 columnas + social
│   │   ├── NewsletterForm.tsx   # Form de suscripción con honeypot + validación
│   │   ├── PressContactBlock.tsx# Email prensa con click-to-copy (variants: compact/full/footer)
│   │   ├── HeroGrid.tsx         # Hero del home
│   │   ├── ArticleCard.tsx      # Card de nota (mobile + grid)
│   │   ├── RelatedArticles.tsx
│   │   ├── VideoEmbed.tsx       # Whitelist iframe YouTube/Vimeo
│   │   └── SEO.tsx              # Meta tags via react-helmet-async
│   │
│   ├── pages/
│   │   ├── Index.tsx            # /
│   │   ├── Article.tsx          # /noticias/:slug
│   │   ├── Search.tsx           # /buscar
│   │   ├── Toolbox.tsx          # /toolbox
│   │   ├── ToolDetail.tsx       # /toolbox/:slug
│   │   ├── EditionsIndex.tsx    # /ediciones
│   │   ├── EditionDetail.tsx    # /ediciones/:slug
│   │   ├── Prensa.tsx           # /prensa (contacto editorial, checklist, FAQ)
│   │   ├── NotFound.tsx         # 404 branded
│   │   ├── newsletter/
│   │   │   ├── Confirmado.tsx   # /newsletter/confirmado
│   │   │   ├── Desuscrito.tsx   # /newsletter/desuscrito
│   │   │   └── Error.tsx        # /newsletter/error?reason=xxx
│   │   └── admin/
│   │       ├── Login.tsx        # /<admin>/
│   │       ├── Articles.tsx     # /<admin>/articulos (lista de notas)
│   │       ├── Editor.tsx       # /<admin>/editor[/:id]
│   │       ├── Editions.tsx     # /<admin>/ediciones (gestión)
│   │       ├── Analytics.tsx    # /<admin>/dashboard
│   │       └── Settings.tsx     # /<admin>/video (config del video del home)
│   │
│   ├── hooks/
│   │   ├── useArticles.ts       # listings + by-slug
│   │   ├── useEditions.ts       # listings + detail + adjacent
│   │   └── useLatestVideo.ts    # video destacado (de site_settings)
│   │
│   ├── integrations/supabase/   # cliente + types generados
│   ├── contexts/AuthContext.tsx # auth state + signIn/signOut
│   ├── config/admin.ts          # ADMIN_BASE_PATH = "/r7yk5..."
│   └── lib/                     # utilidades
│
└── supabase/migrations/         # Schema + seeds (correr manualmente en SQL Editor)
```

---

## 3. Base de datos (tablas clave)

**Schema en Supabase → `public`**.

| Tabla | Función | Notas |
|---|---|---|
| `articles` | Notas | `status` ∈ {draft, published}; `source` ∈ {Human, AI}; tiene `video_*` para embeds |
| `authors` | Autores | join via `articles.author_id` |
| `categories` | Taxonomía | join via `articles.category_id` |
| `editions` | Ediciones del Mes | UNIQUE(year, month). `is_published`, `sponsored_article_id`, `sponsor_id` |
| `edition_articles` | Junction artículo↔edición | `position` 1..50, doble UNIQUE constraint |
| `sponsors` | Marcas patrocinadoras | reusables entre ediciones |
| `site_settings` | Config global | Singleton (PRIMARY KEY BOOLEAN). Hoy solo: video destacado del home |
| `subscribers` | Newsletter | Doble opt-in. `status` ∈ {pending, confirmed, unsubscribed, bounced, complained}. Tokens UUID para confirm/unsub |
| `email_events` | Tracking Resend | Webhooks: sent, delivered, opened, clicked, bounced, complained, failed. FK → subscribers |
| `user_roles` | RBAC | El RPC `has_role()` no está propagado consistentemente — ver §6 |

### Vistas

- `v_active_subscribers` → suscriptores confirmados (para queries de envío de campañas).

### RPCs

- `get_adjacent_editions(_edition_id UUID)` → `{prev_*, next_*}` para footer de navegación entre ediciones.

### Convención de slugs

- Articles: `lower-kebab-case` derivado del título (ver `generateSlug` en `Editor.tsx`).
- Editions: `mes-año` (ej. `abril-2026`, `enero-2024`).
- Categories: `slug` columna en `categories` (ej. `aerolineas`, `inteligencia-artificial`).

---

## 4. Auth, RLS y seguridad

- **Auth**: Supabase Auth (GoTrue) con bcrypt-10 en `auth.users.encrypted_password`. JWT en localStorage via supabase-js client.
- **RLS**: activa en todas las tablas custom. Pública lee solo `is_published=true` o `is_active=true`. Escritura requiere `authenticated`.
- **⚠️ has_role()**: el setup inicial de Lovable NO incluye `public.has_role(uuid, app_role)` en producción aunque el primer migration la define. **Las migrations nuevas no deben depender de `has_role`** — usar `TO authenticated` en su lugar (en este proyecto solo los admins tienen cuentas, no hay sign-up público, así que es funcionalmente equivalente).
- **Admin path obfuscado**: `ADMIN_BASE_PATH = "/r7yk5igg9myaoy090drr"`. No es seguridad real — está en el bundle JS — pero evita scrapers casuales. `robots.txt` lo disallowea.

---

## 5. Workflows comunes

### Levantar dev local

```bash
npm install
npm run dev   # → http://localhost:8080/
```

`.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Mismo backend que producción (no hay staging).

**⚠️ `npm run dev` no sirve Pages Functions** (solo el SPA). Para probar las funciones de newsletter localmente, usar `npx wrangler pages dev -- npm run dev` con un `.dev.vars` que contenga las env vars del edge (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc.). Alternativa: deploy directo a producción (`git push origin main`).

### Aplicar una migración nueva

Las migraciones del repo **no se aplican automáticamente**. Hay que correrlas a mano:

1. Crear archivo en `supabase/migrations/<timestamp>_<nombre>.sql`
2. Commit + push
3. Abrir Supabase Dashboard → SQL Editor → query nueva (botón **+**)
4. Pegar el contenido del archivo y **Run**
5. Verificar el `RAISE NOTICE` final si lo tiene

**Buenas prácticas para migraciones:**
- Idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP IF EXISTS`)
- Atómicas (`BEGIN; ... COMMIT;`) cuando hacen múltiples cambios relacionados
- Reportan resultado al final via `DO $$ ... RAISE NOTICE ... END $$`
- Si modifican triggers, deshabilitarlos antes del bulk y rehabilitar al final

### Deploy

Push a `main` → Cloudflare Pages despliega automáticamente en ~1-2 min. Verificar via `gh` CLI o el dashboard de CF.

### Cache busting de assets en `/public/`

Los assets en `/public/` no llevan content-hash. Si cambia un asset crítico (ej. logo), **renombrar el archivo** (`logo-v2.svg` → `logo-v3.svg`) en lugar de sobrescribir. La caché de Cloudflare + browser tiene `max-age=14400` (4h), así que sobrescribir hace que algunos usuarios vean el viejo durante horas.

---

## 6. Features y módulos relevantes

### Editor de notas
- Path: `/<admin>/editor[/:id]`
- TipTap rich text con extensiones: TextAlign (default `justify`), Tweet embed, Callout, Tables, Code block.
- Categorías: dropdown autocomplete con opción "Crear «query»" inline (inserta en `categories`).
- Panel "Ediciones del Mes" al final: toggle por edición. Al marcar inserta en `edition_articles` con position = max+1.

### Ediciones del Mes
- **Pública**: `/ediciones` (índice con cards del año en curso + archivo histórico colapsable por año), `/ediciones/:slug` (detalle con hero + 10 notas + sponsored).
- **Admin**: `/<admin>/ediciones` para gestionar artículos de cada edición sin entrar a cada nota (lista expandible + modal de búsqueda).
- Visibilidad: una edición sale a la luz el día 1 del mes siguiente. Hoy (mes en curso) se oculta automáticamente — la lógica vive en `useEditions.ts` (filtro `(year, month) < (currentYear, currentMonth)`).
- Histórico: ver `supabase/migrations/20260505173628_seed_historical_editions.sql` para entender cómo se siembra.

### Video destacado del home
- Tabla `site_settings` (singleton). Editable desde `/<admin>/video`.
- Componente `FeaturedVideo` en `Index.tsx` lee del hook `useLatestVideo`.
- **No depende** de servicios externos (antes era un webhook n8n, se migró a Supabase).

### Sitemap
- `functions/sitemap.xml.ts` genera dinámicamente desde Supabase.
- Incluye home, /noticias, /ediciones, /toolbox, /buscar + cada artículo + cada edición publicada + cada tool.
- Cache: 5min browser, 1h CDN. Los nuevos artículos aparecen en el sitemap dentro de la hora siguiente a la publicación.
- **NO regenerar manualmente** — el viejo `public/sitemap.xml` quedó deprecado.

### Newsletter (doble opt-in con Resend)
- **Flujo**: subscribe (pending) → email de confirmación → click → confirmed → email de bienvenida. Unsubscribe con un solo clic.
- **Backend**: Cloudflare Pages Functions en `functions/api/newsletter/`. Usan Supabase REST API con `service_role` key (NO el cliente JS). Resend REST API via `fetch()` (sin npm package).
- **Helpers compartidos**: `functions/_lib/newsletter.ts` — queries a Supabase, envío de email, plantillas HTML, validación.
- **Plantillas de email**: HTML con tablas (compatibilidad Gmail/Outlook/Apple Mail), branding editorial: Fraunces serif + Inter sans, wordmark como texto, barra carmesí `#B21C40`, responsive <600px, dark mode support.
- **Protección anti-bot**: campo honeypot (`website`) en el form + rate limiting por IP (3/min).
- **Webhook de Resend**: verificación Svix HMAC-SHA256. Actualiza status del suscriptor en bounces/complaints. Registra eventos en `email_events`.
- **Env vars** (en Cloudflare Pages → Settings → Environment variables):
  - `SUPABASE_SERVICE_ROLE_KEY` — clave service_role de Supabase (NO la anon key)
  - `RESEND_API_KEY` — API key de Resend
  - `RESEND_WEBHOOK_SECRET` — Svix signing secret (formato `whsec_...`)
  - `SITE_URL` — defaults a `https://ecosdigitales.com`
- **Dominio**: `ecosdigitales.com` debe estar verificado en Resend (DKIM/SPF/DMARC) para enviar desde `newsletter@ecosdigitales.com`.

### Prensa
- Página pública `/prensa` con guidelines editoriales, checklist de envío, FAQ y contacto.
- Email: `prensa@ecosdigitales.com`. Click-to-copy con toast en todas las instancias (componente `PressContactBlock`).

### Footer
- Dark mode forzado (`bg-zinc-950`) con colores hardcoded (no CSS variables) para mantener el fondo oscuro independiente del tema del sitio.
- 4 bloques: logo+social, newsletter form, 3 columnas de links, copyright.
- Logo invertido con CSS filter `brightness-0 invert`.

### OG meta tags dinámicos
- `functions/noticias/[slug].ts` intercepta requests de crawlers (FB, Twitter, WhatsApp, LinkedIn, Discord, Slack, IA bots) y devuelve HTML con OG tags específicos del artículo.
- Usuarios humanos (Chrome/Safari/Firefox) reciben el SPA normal.
- **Pendiente**: replicar este patrón para `/ediciones/:slug` cuando se compartan editorialmente.

---

## 7. Convenciones de UI

- **Paleta editorial** (emails y branding): carmesí `#B21C40` (primario), negro tinta `#1A1A1A`, gris medio `#4B5563`, gris claro `#9CA3AF`.
- **Tipografía editorial** (emails): Fraunces (serif, titulares/wordmark), Inter (sans, cuerpo/UI). Fallbacks: Georgia, -apple-system.
- **Tipografía web**: sans default (Inter o similar). El serif (`var(--font-serif)`) se reserva para `.article-content` (cuerpo de notas).
- **Categorías** en cards: `text-muted-foreground` + `capitalize` (NO uppercase, NO azul).
- **Fechas en cards**: helper `formatCardDate()` — formato `"d MMM"` (ej. "5 Mar"), nunca uppercase.
- **Justificado**: el cuerpo de los artículos va `text-align: justify` con `hyphens: auto`. Los párrafos individuales pueden override con TipTap.
- **Color "Slack" en analytics**: aubergine `#4A154B`, blue `#36C5F0`, green `#2EB67D`, yellow `#ECB22E`, red `#E01E5A`.

---

## 8. Cosas que NO hay que hacer

- **No tocar el path admin** (`ADMIN_BASE_PATH`) sin actualizar todos los redirects (Login, Editor, AdminLayout).
- **No depender de `has_role()`** en migraciones nuevas — usar `TO authenticated`.
- **No regenerar el sitemap a mano** — la function lo hace sola.
- **No agregar OG/Twitter meta tags solo en React-Helmet** si querés que los lean los crawlers. React-Helmet es client-side; los crawlers necesitan SSR via Pages Functions (ver `functions/noticias/[slug].ts` como referencia).
- **No commitear `.env`** — está en `.gitignore` aunque históricamente se filtró una vez (revisar antes de cada commit).
- **No usar el cliente Supabase JS en Pages Functions** — las functions de newsletter usan `service_role` key via REST API directo (`fetch`). El cliente JS de `src/integrations/` es solo para el frontend (anon key).
- **No instalar paquetes npm para Resend** — se usa la REST API via `fetch()` desde el edge runtime. Zero dependencies.
- **No skipear hooks (`--no-verify`) ni firmas de commits** sin pedirlo explícitamente.

---

## 9. Comandos útiles

```bash
# Dev server
npm run dev

# Build de producción
npm run build

# Lint
npm run lint

# Tests (Vitest)
npm test

# Levantar logs de Vite si está como background
tail -f /tmp/claude-501/.../vite.output
```

---

## 10. Pendientes / mejoras conocidas

- **Reordenar posiciones en una edición** desde el admin (drag-and-drop). Hoy se hace via Supabase Studio. El UNIQUE constraint en `(edition_id, position)` complica el swap atómico — necesita un RPC.
- **OG dinámico para `/ediciones/:slug`** (ver §6).
- **Sindicación a redes sociales** vía n8n self-hosted al publicar una nota — workflow ya diseñado, falta deployar la instancia n8n. Ver historial de conversación.
- **Páginas pendientes**: `/sobre-nosotros` y `/equipo` (links en footer apuntan a `#` con TODO).
- **Migrar `useArticles()` a server-side search** cuando crucemos las 5k notas publicadas (hoy 3.1k, carga todo en cliente).
- **Recuperación del gap 2025**: 14 meses sin artículos publicados. No hay backup. Posible recuperación manual desde Instagram/LinkedIn de 2025.
