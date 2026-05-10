// Shared helpers for newsletter Cloudflare Pages Functions.
// This file is NOT a route (no onRequest* export) — it's imported by the API functions.

export interface NewsletterEnv {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  SITE_URL?: string;
}

export function getSupabase(env: NewsletterEnv) {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Supabase credentials missing");
  return { url, key };
}

export function getSiteUrl(env: NewsletterEnv): string {
  return (env.SITE_URL || "https://ecosdigitales.com").replace(/\/$/, "");
}

// ────────────────────────────────────────────────────────────
// Supabase REST helpers (service_role)
// ────────────────────────────────────────────────────────────

export async function supabaseQuery<T>(
  env: NewsletterEnv,
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const { url, key } = getSupabase(env);
  const res = await fetch(`${url}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.method && options.method !== "GET" ? "return=representation" : "",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { data: null, error: `${res.status}: ${text}` };
  }
  const data = (await res.json()) as T;
  return { data, error: null };
}

// ────────────────────────────────────────────────────────────
// Resend REST API (no npm package needed)
// ────────────────────────────────────────────────────────────

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  env: NewsletterEnv,
  params: SendEmailParams,
): Promise<{ id?: string; error?: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Ecos Digitales <newsletter@ecosdigitales.com>",
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[Resend] Error:", res.status, text);
    return { error: text };
  }

  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

// ────────────────────────────────────────────────────────────
// Email templates (HTML strings — edge-compatible)
// ────────────────────────────────────────────────────────────

const LOGO_URL = "https://pub-a5d6cd3eaa334d2cac388aee0fa7c1f5.r2.dev/logo-og.jpg";

function emailWrapper(content: string, unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, 'Inter', sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px 32px; }
    .logo { display: block; height: 28px; margin-bottom: 32px; }
    h1 { font-size: 20px; color: #18181b; margin: 0 0 16px; font-weight: 600; }
    p { font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px; }
    .btn { display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 500; margin: 8px 0 24px; }
    .link { font-size: 13px; color: #71717a; word-break: break-all; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; }
    .footer p { font-size: 12px; color: #a1a1aa; margin: 0 0 8px; }
    .footer a { color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <img src="${LOGO_URL}" alt="Ecos Digitales" class="logo" />
      ${content}
      <div class="footer">
        <p>Ecos Digitales — Tecnología y negocios en LATAM</p>
        ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Cancelar suscripción</a></p>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function confirmationEmailHtml(confirmUrl: string): string {
  return emailWrapper(`
    <h1>Confirma tu suscripción</h1>
    <p>Alguien (esperamos que tú) se suscribió al newsletter de Ecos Digitales con este correo.</p>
    <p>Haz clic en el botón para confirmar:</p>
    <a href="${confirmUrl}" class="btn">Confirmar suscripción</a>
    <p class="link">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>${confirmUrl}</p>
    <p style="font-size: 13px; color: #71717a;">Si no solicitaste esto, ignora este correo.</p>
  `);
}

export function welcomeEmailHtml(siteUrl: string, unsubscribeUrl: string): string {
  return emailWrapper(`
    <h1>Bienvenido a Ecos Digitales</h1>
    <p>Tu suscripción está confirmada. A partir de ahora recibirás nuestro resumen semanal con lo más relevante de tecnología y negocios en Latinoamérica.</p>
    <p>Mientras tanto, puedes explorar las últimas noticias:</p>
    <a href="${siteUrl}" class="btn">Ir a Ecos Digitales</a>
    <p style="font-size: 13px; color: #71717a;">Gracias por ser parte de nuestra comunidad.</p>
  `, unsubscribeUrl);
}

// ────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

// ────────────────────────────────────────────────────────────
// JSON response helpers
// ────────────────────────────────────────────────────────────

export function jsonOk(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
