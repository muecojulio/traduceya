import { translateText } from "../../../lib/translate";
import { tooMany, clientIp } from "../../../lib/limit";
import { readJson, safeLang, safeText } from "../../../lib/safe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** El texto a traducir no necesita más que unos KB: se rechaza lo demás. */
const BODY_LIMIT = 20_000;

export async function POST(request) {
  if (tooMany(clientIp(request))) {
    return Response.json({ error: "Demasiadas peticiones. Espera un minuto." }, { status: 429 });
  }
  try {
    const body = await readJson(request, BODY_LIMIT);
    if (!body) {
      return Response.json({ error: "Petición inválida." }, { status: 400 });
    }
    const text = safeText(body.text);
    if (!text) {
      return Response.json({ error: "No hay texto para traducir." }, { status: 400 });
    }
    const target = safeLang(body.target);
    if (!target) {
      return Response.json({ error: "Ese idioma no está en la lista." }, { status: 400 });
    }
    const result = await translateText(text, target);
    return Response.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch {
    return Response.json(
      { error: "Ningún motor de traducción respondió. Revisa tu conexión." },
      { status: 502 }
    );
  }
}
