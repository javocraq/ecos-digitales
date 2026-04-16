/**
 * Seeds a test article that exercises the three formatting bugs that were
 * fixed: a callout/note, a 3-item bullet list, and a 3x4 specifications table.
 *
 * Usage:
 *   npm run create-test-article
 *   # or with explicit env:
 *   node --env-file=.env scripts/create-test-article.mjs
 *
 * The article is inserted as `status = 'draft'` so it won't appear on the
 * public home page until you publish it from /admin. Its slug is:
 *   rich-text-formatting-regression-test
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.");
  console.error("Run with:  node --env-file=.env scripts/create-test-article.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SLUG = "rich-text-formatting-regression-test";
const TITLE = "Prueba de formateo: notas, listas y tablas";

// Content mirrors exactly what Tiptap emits from the admin editor, including
// the <p> wrappers inside <li> and <td>/<th>, so that we can assert the
// renderer no longer fragments them.
const CONTENT = `
<p>Este artículo existe para validar que el renderizador de la vista pública
preserva correctamente los tres tipos de bloque que anteriormente estaban
rotos: el <strong>callout/nota</strong>, la <strong>lista de viñetas</strong> y
la <strong>tabla</strong>.</p>

<aside class="callout" data-variant="note"><p>Antes de comprar, verificá la
disponibilidad regional. Los precios están expresados en soles peruanos y
pueden variar según la tienda.</p></aside>

<h2>Precios de lanzamiento</h2>
<ul>
  <li><p>Galaxy A37 5G: desde $1.799</p></li>
  <li><p>Galaxy A57 5G: desde $1.999</p></li>
  <li><p>Entrega inmediata en tiendas oficiales</p></li>
</ul>

<h2>Especificaciones comparadas</h2>
<table class="tiptap-table">
  <tbody>
    <tr>
      <th><p>Especificación</p></th>
      <th><p>Galaxy A37 5G</p></th>
      <th><p>Galaxy A57 5G</p></th>
    </tr>
    <tr>
      <td><p>Procesador</p></td>
      <td><p>Exynos 1480</p></td>
      <td><p>Exynos 1680 (4 nm)</p></td>
    </tr>
    <tr>
      <td><p>Pantalla</p></td>
      <td><p>6,7" Super AMOLED, FHD+, 120 Hz</p></td>
      <td><p>6,7" Dynamic AMOLED, FHD+, 120 Hz</p></td>
    </tr>
    <tr>
      <td><p>Brillo máximo</p></td>
      <td><p>1.900 nits</p></td>
      <td><p>1.900 nits</p></td>
    </tr>
  </tbody>
</table>

<p>Si todos los bloques aparecen correctamente arriba, los errores 1, 2 y 3
están resueltos.</p>
`.trim().replace(/\n\s*/g, "");

async function pickFirstRow(table) {
  const { data, error } = await supabase.from(table).select("id").limit(1);
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`No rows found in '${table}'. Create one first from the admin panel.`);
  }
  return data[0].id;
}

async function main() {
  const [authorId, categoryId] = await Promise.all([
    pickFirstRow("authors"),
    pickFirstRow("categories"),
  ]);

  const now = new Date().toISOString();
  const payload = {
    slug: SLUG,
    title: TITLE,
    subtitle: "Caso de prueba para callout, lista y tabla",
    content: CONTENT,
    excerpt:
      "Artículo de prueba con callout, lista de viñetas y tabla de especificaciones.",
    author_id: authorId,
    category_id: categoryId,
    status: "draft",
    published_at: now,
    reading_time_minutes: 1,
  };

  // Upsert by slug so re-running the script doesn't create duplicates.
  const { data: existing, error: selErr } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await supabase
      .from("articles")
      .update({
        ...payload,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`Updated existing test article (id=${existing.id}, slug=${SLUG}).`);
  } else {
    const { data, error } = await supabase
      .from("articles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    console.log(`Created test article (id=${data.id}, slug=${SLUG}).`);
  }

  console.log(`Preview: https://ecosdigitales.com/noticias/${SLUG}`);
  console.log("Set status to 'published' from /admin when ready.");
}

main().catch((err) => {
  console.error("Failed:", err.message ?? err);
  process.exit(1);
});
