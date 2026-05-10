// GET /api/newsletter/confirm?token=xxx
// Confirma la suscripción y envía email de bienvenida.

import type { NewsletterEnv } from "../../_lib/newsletter";
import {
  supabaseQuery,
  sendEmail,
  welcomeEmailHtml,
  getSiteUrl,
} from "../../_lib/newsletter";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  unsubscribe_token: string;
}

export const onRequestGet: PagesFunction<NewsletterEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const siteUrl = getSiteUrl(env);

  if (!token) {
    return Response.redirect(`${siteUrl}/newsletter/error?reason=notfound`, 302);
  }

  const { data: rows } = await supabaseQuery<Subscriber[]>(
    env,
    `subscribers?confirmation_token=eq.${token}&select=id,email,status,unsubscribe_token`,
  );

  const subscriber = rows?.[0];

  if (!subscriber) {
    return Response.redirect(`${siteUrl}/newsletter/error?reason=notfound`, 302);
  }

  if (subscriber.status === "confirmed") {
    return Response.redirect(`${siteUrl}/newsletter/error?reason=already-confirmed`, 302);
  }

  // Confirmar
  const { error } = await supabaseQuery(
    env,
    `subscribers?id=eq.${subscriber.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      }),
    },
  );

  if (error) {
    console.error("[confirm] Update error:", error);
    return Response.redirect(`${siteUrl}/newsletter/error`, 302);
  }

  // Enviar email de bienvenida
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
  await sendEmail(env, {
    to: subscriber.email,
    subject: "Bienvenido a Ecos Digitales",
    html: welcomeEmailHtml(siteUrl, unsubscribeUrl),
  });

  return Response.redirect(`${siteUrl}/newsletter/confirmado`, 302);
};
