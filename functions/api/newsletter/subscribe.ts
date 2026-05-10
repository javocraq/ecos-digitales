// POST /api/newsletter/subscribe
// Registra un suscriptor con status 'pending' y envía email de confirmación.

import type { NewsletterEnv } from "../../_lib/newsletter";
import {
  supabaseQuery,
  sendEmail,
  confirmationEmailHtml,
  getSiteUrl,
  isValidEmail,
  jsonOk,
  jsonError,
} from "../../_lib/newsletter";

interface SubscribeBody {
  email?: string;
  source?: string;
  website?: string; // honeypot
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  confirmation_token: string;
  unsubscribe_token: string;
  created_at: string;
}

export const onRequestPost: PagesFunction<NewsletterEnv> = async ({ request, env }) => {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return jsonError("Cuerpo de la solicitud inválido", 400);
  }

  // Honeypot: si el campo oculto tiene contenido, devolver éxito falso
  if (body.website) {
    return jsonOk({ success: true, message: "Revisa tu correo para confirmar la suscripción." });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return jsonError("Ingresa un email válido", 400);
  }

  const source = body.source || "footer";
  const siteUrl = getSiteUrl(env);
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || null;
  const referer = request.headers.get("referer") || null;

  // Rate limiting: max 3 suscripciones por IP en el último minuto
  if (ip) {
    const { data: recent } = await supabaseQuery<Subscriber[]>(
      env,
      `subscribers?ip_address=eq.${encodeURIComponent(ip)}&created_at=gte.${new Date(Date.now() - 60_000).toISOString()}&select=id`,
    );
    if (recent && recent.length >= 3) {
      return jsonError("Demasiadas solicitudes. Intenta en un momento.", 429);
    }
  }

  // Verificar si el email ya existe
  const { data: existing } = await supabaseQuery<Subscriber[]>(
    env,
    `subscribers?email=eq.${encodeURIComponent(email)}&select=id,email,status,confirmation_token,unsubscribe_token,created_at`,
  );

  const subscriber = existing?.[0];

  if (subscriber) {
    if (subscriber.status === "confirmed") {
      return jsonOk({ success: true, message: "Ya estás suscrito. ¡Gracias!" });
    }

    if (subscriber.status === "unsubscribed") {
      // Reactivar: generar nuevos tokens y volver a pending
      await supabaseQuery(env, `subscribers?id=eq.${subscriber.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "pending",
          confirmation_token: crypto.randomUUID(),
          unsubscribe_token: crypto.randomUUID(),
          unsubscribed_at: null,
          unsubscribe_reason: null,
          source,
        }),
      });
      // Re-fetch para tener los nuevos tokens
      const { data: updated } = await supabaseQuery<Subscriber[]>(
        env,
        `subscribers?id=eq.${subscriber.id}&select=confirmation_token,unsubscribe_token`,
      );
      if (updated?.[0]) {
        const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${updated[0].confirmation_token}`;
        await sendEmail(env, {
          to: email,
          subject: "Confirma tu suscripción — Ecos Digitales",
          html: confirmationEmailHtml(confirmUrl),
        });
      }
      return jsonOk({ success: true, message: "Revisa tu correo para confirmar la suscripción." });
    }

    // Status 'pending': reenviar confirmación si se creó hace >1min (evitar spam)
    const createdAt = new Date(subscriber.created_at).getTime();
    if (Date.now() - createdAt < 60_000) {
      return jsonOk({ success: true, message: "Ya enviamos un correo de confirmación. Revisa tu bandeja." });
    }

    // Reenviar
    const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${subscriber.confirmation_token}`;
    await sendEmail(env, {
      to: email,
      subject: "Confirma tu suscripción — Ecos Digitales",
      html: confirmationEmailHtml(confirmUrl),
    });
    return jsonOk({ success: true, message: "Revisa tu correo para confirmar la suscripción." });
  }

  // Nuevo suscriptor
  const { data: inserted, error } = await supabaseQuery<Subscriber[]>(env, "subscribers", {
    method: "POST",
    body: JSON.stringify({
      email,
      status: "pending",
      source,
      referrer_url: referer,
      ip_address: ip,
    }),
  });

  if (error || !inserted?.[0]) {
    console.error("[subscribe] Insert error:", error);
    return jsonError("Hubo un problema. Inténtalo de nuevo en un momento.", 500);
  }

  const newSub = inserted[0];
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${newSub.confirmation_token}`;

  const emailResult = await sendEmail(env, {
    to: email,
    subject: "Confirma tu suscripción — Ecos Digitales",
    html: confirmationEmailHtml(confirmUrl),
  });

  if (emailResult.error) {
    console.error("[subscribe] Email send error:", emailResult.error);
    // El suscriptor se creó pero el email falló — no es crítico, puede reenviar
  }

  return jsonOk({ success: true, message: "Revisa tu correo para confirmar la suscripción." });
};
