import { NAMES, OCR_LANG } from "../../../lib/langs";
import { translateText } from "../../../lib/translate";
import { tooMany, clientIp } from "../../../lib/limit";
import { readJson, safeImage, safeLang, safeText } from "../../../lib/safe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VISION_MODEL = "qwen/qwen3.6-27b";

async function viaGroqVision(image, targetId) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const target = NAMES[targetId] || "español";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Lee TODO el texto visible en esta foto. Luego tradúcelo al ${target}. Formato:\nTEXTO ORIGINAL:\n...\n\nTRADUCCIÓN:\n...`,
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function viaOcrSpace(image, ocrLang) {
  const key = process.env.OCR_SPACE_API_KEY || "helloworld";
  try {
    const form = new URLSearchParams();
    form.set("base64Image", image);
    form.set("apikey", key);
    form.set("language", ocrLang);
    form.set("OCREngine", "2");
    form.set("scale", "true");
    form.set("isOverlayRequired", "false");
    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      signal: AbortSignal.timeout(45_000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.ParsedResults?.[0]?.ParsedText?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (tooMany(clientIp(request), 20)) {
    return Response.json({ error: "Demasiadas fotos. Espera un minuto." }, { status: 429 });
  }
  try {
    const body = await readJson(request);
    if (!body) return Response.json({ error: "Petición inválida." }, { status: 400 });

    const photo = safeImage(body.image);
    if (!photo) {
      return Response.json({ error: "No llegó una foto válida." }, { status: 400 });
    }
    const target = safeLang(body.target);
    if (!target) {
      return Response.json({ error: "Ese idioma no está en la lista." }, { status: 400 });
    }

    const vision = await viaGroqVision(photo.dataUrl, target);
    if (vision) return Response.json({ translation: vision, engine: "groq" });

    // OCR.space solo acepta idiomas de su lista: "auto" no es uno de ellos.
    const ocr = await viaOcrSpace(photo.dataUrl, OCR_LANG[target] || "eng");
    if (!ocr) {
      return Response.json(
        {
          error:
            "No se leyó texto en la foto. Prueba con más luz o configura una key de Groq / OCR.space.",
        },
        { status: 502 }
      );
    }

    const found = safeText(ocr);
    if (!found) return Response.json({ error: "La foto no traía texto legible." }, { status: 502 });

    const translated = await translateText(found, target);
    return Response.json({
      translation: `TEXTO ORIGINAL:\n${found}\n\nTRADUCCIÓN:\n${translated.translation}`,
      engine: `ocr.space + ${translated.engine}`,
    });
  } catch {
    return Response.json(
      { error: "No se pudo leer la foto. Vuelve a intentarlo." },
      { status: 502 }
    );
  }
}
