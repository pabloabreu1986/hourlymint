// Vercel Edge Middleware. Corre ANTES del filesystem, así que puede
// desviar la raíz "/" (que de otro modo sirve el index.html estático).
//
// Único cometido: cuando el visitante es un bot de previsualización
// (WhatsApp, Facebook, Telegram…), reescribir a /api/og para que la
// miniatura al compartir lleve los datos del cliente del subdominio.
// Buscadores y humanos siguen recibiendo la SPA normal.
import { next, rewrite } from "@vercel/edge";

export const config = { matcher: "/" };

const BOTS =
  /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterestbot|SkypeUriPreview/i;

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BOTS.test(ua)) return rewrite(new URL("/api/og", request.url));
  return next();
}
