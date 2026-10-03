import { NAMES } from "../../../lib/langs";
import { translateText } from "../../../lib/translate";
import { tooMany, clientIp } from "../../../lib/limit";

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

async function viaOcrSpace(image) {
  const key = process.env.OCR_SPACE_API_KEY || "helloworld";
  try {
    const form = new URLSearchParams();
    form.set("base64Image", image);
    form.set("apikey", key);
    form.set("language", "auto");
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
  try {
    if (tooMany(clientIp(request), 20)) {
      return Response.json({ error: "Demasiadas fotos. Espera un minuto." }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const image = typeof body?.image === "string" ? body.image : "";
    const target = typeof body?.target === "string" && body.target ? body.target : "es-MX";
    if (!image.startsWith("data:image")) {
      return Response.json({ error: "No llegó una foto válida." }, { status: 400 });
    }
    if (image.length > 2_500_000) {
      return Response.json({ error: "La foto es demasiado grande." }, { status: 413 });
    }

    const vision = await viaGroqVision(image, target);
    if (vision) {
      return Response.json({ translation: vision, engine: "groq" });
    }

    const ocr = await viaOcrSpace(image);
    if (!ocr) {
      return Response.json(
        {
          error:
            "No se leyó texto en la foto. Prueba con más luz o configura una key de Groq / OCR.space.",
        },
        { status: 502 }
      );
    }

    const translated = await translateText(ocr, target);
    return Response.json({
      translation: `TEXTO ORIGINAL:\n${ocr}\n\nTRADUCCIÓN:\n${translated.translation}`,
      engine: `ocr.space + ${translated.engine}`,
    });
  } catch (e) {
    return Response.json(
      { error: e?.message || "Error de red al leer la foto." },
      { status: 502 }
    );
  }
}
