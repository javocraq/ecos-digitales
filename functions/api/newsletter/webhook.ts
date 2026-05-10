// POST /api/newsletter/webhook
// Recibe webhooks de Resend para tracking de eventos (opens, clicks, bounces, etc.)

import type { NewsletterEnv } from "../../_lib/newsletter";
import { supabaseQuery, jsonOk, jsonError } from "../../_lib/newsletter";

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    created_at?: string;
    click?: { link?: string };
  };
}

// Mapa de tipos de evento Resend → nuestro schema
const EVENT_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "failed",
};

// Verificación básica del webhook via Svix
async function verifyWebhook(
  secret: string,
  headers: Headers,
  body: string,
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature || !secret) return false;

  // Verificar que el timestamp no sea demasiado viejo (5 minutos)
  const ts = parseInt(svixTimestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  try {
    // El secret tiene prefijo "whsec_" — hay que quitarlo y decodificar base64
    const rawSecret = secret.replace(/^whsec_/, "");
    const keyBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const msg = new TextEncoder().encode(`${svixId}.${svixTimestamp}.${body}`);
    const sig = await crypto.subtle.sign("HMAC", key, msg);
    const computed = `v1,${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;

    // Resend puede enviar varias firmas separadas por espacio
    return svixSignature.split(" ").some((s) => s === computed);
  } catch (e) {
    console.error("[webhook] Signature verification error:", e);
    return false;
  }
}

export const onRequestPost: PagesFunction<NewsletterEnv> = async ({ request, env }) => {
  const body = await request.text();

  // Verificar firma si hay secret configurado
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const valid = await verifyWebhook(secret, request.headers, body);
    if (!valid) {
      return jsonError("Invalid webhook signature", 401);
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const eventType = EVENT_MAP[payload.type];
  if (!eventType) {
    // Evento no mapeado — ignorar silenciosamente
    return jsonOk({ received: true });
  }

  const email = payload.data.to?.[0];
  if (!email) {
    return jsonOk({ received: true });
  }

  // Buscar suscriptor por email
  const { data: rows } = await supabaseQuery<{ id: string }[]>(
    env,
    `subscribers?email=eq.${encodeURIComponent(email)}&select=id`,
  );
  const subscriberId = rows?.[0]?.id || null;

  // Registrar evento
  await supabaseQuery(env, "email_events", {
    method: "POST",
    body: JSON.stringify({
      subscriber_id: subscriberId,
      email,
      event_type: eventType,
      resend_email_id: payload.data.email_id || null,
      metadata: payload.data,
    }),
  });

  // Actualizar suscriptor según tipo de evento
  if (subscriberId) {
    if (eventType === "bounced") {
      await supabaseQuery(env, `subscribers?id=eq.${subscriberId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "bounced" }),
      });
    } else if (eventType === "complained") {
      await supabaseQuery(env, `subscribers?id=eq.${subscriberId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "complained" }),
      });
    } else if (eventType === "sent") {
      // Incrementar contadores via RPC sería ideal, pero PATCH funciona
      // para un volumen bajo. TODO: usar RPC para atomicidad en alto volumen.
      await supabaseQuery(env, `subscribers?id=eq.${subscriberId}`, {
        method: "PATCH",
        body: JSON.stringify({ last_email_sent_at: new Date().toISOString() }),
      });
    } else if (eventType === "opened") {
      await supabaseQuery(env, `subscribers?id=eq.${subscriberId}`, {
        method: "PATCH",
        body: JSON.stringify({ last_email_opened_at: new Date().toISOString() }),
      });
    }
  }

  return jsonOk({ received: true });
};
