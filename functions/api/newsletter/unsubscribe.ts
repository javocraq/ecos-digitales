// GET /api/newsletter/unsubscribe?token=xxx
// Desuscribe al usuario con un solo clic (estándar Gmail/Yahoo 2024).

import type { NewsletterEnv } from "../../_lib/newsletter";
import { supabaseQuery, getSiteUrl } from "../../_lib/newsletter";

interface Subscriber {
  id: string;
  status: string;
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
    `subscribers?unsubscribe_token=eq.${token}&select=id,status`,
  );

  const subscriber = rows?.[0];

  if (!subscriber) {
    return Response.redirect(`${siteUrl}/newsletter/error?reason=notfound`, 302);
  }

  if (subscriber.status === "unsubscribed") {
    // Ya está desuscrito, redirigir igual
    return Response.redirect(`${siteUrl}/newsletter/desuscrito`, 302);
  }

  const { error } = await supabaseQuery(
    env,
    `subscribers?id=eq.${subscriber.id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      }),
    },
  );

  if (error) {
    console.error("[unsubscribe] Update error:", error);
    return Response.redirect(`${siteUrl}/newsletter/error`, 302);
  }

  return Response.redirect(`${siteUrl}/newsletter/desuscrito`, 302);
};
