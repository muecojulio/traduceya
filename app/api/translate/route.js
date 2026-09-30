import { translateText } from "../../../lib/translate";
import { tooMany, clientIp } from "../../../lib/limit";

export async function POST(request) {
  try {
    if (tooMany(clientIp(request))) {
      return Response.json({ error: "Demasiadas peticiones. Espera un minuto." }, { status: 429 });
    }
    const body = await request.json();
    const text = String(body.text || "").trim().slice(0, 4000);
    const target = body.target || "es-MX";
    if (!text) {
      return Response.json({ error: "No hay texto para traducir." }, { status: 400 });
    }
    const result = await translateText(text, target);
    return Response.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    return Response.json(
      { error: e.message || "Error de red al traducir." },
      { status: 500 }
    );
  }
}
