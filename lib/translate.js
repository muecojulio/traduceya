import { NAMES, SHORT } from "./langs";
import { cacheGet, cacheSet, cacheKey } from "./cache";

const TEXT_MODEL = "openai/gpt-oss-20b";

async function viaGroq(text, targetId) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const target = NAMES[targetId] || "español";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `Eres un traductor. Traduce al ${target} claro y natural. Conserva nombres propios. Responde SOLO con la traducción.`,
        },
        { role: "user", content: text },
      ],
    }),
  });
  const data = await res.json();
  const out = data.choices?.[0]?.message?.content?.trim();
  return out || null;
}

async function viaLingva(text, targetId) {
  const target = SHORT[targetId] || "es";
  const hosts = ["https://lingva.ml", "https://translate.igna.wtf"];
  for (const host of hosts) {
    try {
      const url = `${host}/api/v1/auto/${target}/${encodeURIComponent(text).slice(0, 1800)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data.translation) return data.translation;
    } catch {
      /* siguiente espejo */
    }
  }
  return null;
}

async function viaLibreTranslate(text, targetId) {
  const target = SHORT[targetId] || "es";
  const hosts = [
    "https://libretranslate.de/translate",
    "https://translate.fedilab.app/translate",
  ];
  for (const url of hosts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target,
          format: "text",
        }),
      });
      const data = await res.json();
      if (data.translatedText) return data.translatedText;
    } catch {
      /* siguiente espejo */
    }
  }
  return null;
}

function guessSource(text) {
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9faf]/.test(text)) return "zh-CN";
  if (/[áéíóúñ¿¡]/i.test(text)) return "es";
  return "en";
}

async function viaCloudflare(text, targetId) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) return null;
  const target = SHORT[targetId] || "es";
  const source = guessSource(text);
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/meta/m2m100-1.2b`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          source_lang: source,
          target_lang: target,
        }),
      }
    );
    const data = await res.json();
    return data.result?.translated_text || data.result?.response || null;
  } catch {
    return null;
  }
}

async function viaMyMemory(text, targetId) {
  const target = SHORT[targetId] || "es";
  const source = guessSource(text);
  const chunk = text.slice(0, 400);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(source + "|" + target)}`;
    const res = await fetch(url);
    const data = await res.json();
    const out = data.responseData?.translatedText;
    if (!out || /INVALID|QUERY LENGTH|MYMEMORY WARNING/i.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}

async function viaGoogleGtx(text, targetId) {
  const target = SHORT[targetId] || "es";
  const source = guessSource(text);
  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: source,
      tl: target,
      dt: "t",
      q: text.slice(0, 1800),
    });
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const parts = Array.isArray(data?.[0]) ? data[0].map((row) => row?.[0]).filter(Boolean) : [];
    return parts.join("") || null;
  } catch {
    return null;
  }
}

async function viaMozhi(text, targetId) {
  const target = SHORT[targetId] || "es";
  const hosts = ["https://mozhi.aryak.me", "https://translate.bus-hit.me"];
  for (const host of hosts) {
    try {
      const params = new URLSearchParams({
        engine: "google",
        from: "auto",
        to: target,
        text: text.slice(0, 1800),
      });
      const res = await fetch(`${host}/api/translate?${params}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      const out = data["translated-text"] || data.translated_text || data.translation;
      if (out) return out;
    } catch {
      /* siguiente */
    }
  }
  return null;
}

export async function translateText(text, targetId) {
  const key = cacheKey(["t", targetId, text]);
  const cached = cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const groq = await viaGroq(text, targetId);
  if (groq) {
    const out = { translation: groq, engine: "groq" };
    cacheSet(key, out);
    return out;
  }

  const cf = await viaCloudflare(text, targetId);
  if (cf) {
    const out = { translation: cf, engine: "cloudflare" };
    cacheSet(key, out);
    return out;
  }

  const gtx = await viaGoogleGtx(text, targetId);
  if (gtx) {
    const out = { translation: gtx, engine: "gtx" };
    cacheSet(key, out);
    return out;
  }

  const lingva = await viaLingva(text, targetId);
  if (lingva) {
    const out = { translation: lingva, engine: "lingva" };
    cacheSet(key, out);
    return out;
  }

  const mozhi = await viaMozhi(text, targetId);
  if (mozhi) {
    const out = { translation: mozhi, engine: "mozhi" };
    cacheSet(key, out);
    return out;
  }

  const memory = await viaMyMemory(text, targetId);
  if (memory) {
    const out = { translation: memory, engine: "mymemory" };
    cacheSet(key, out);
    return out;
  }

  const libre = await viaLibreTranslate(text, targetId);
  if (libre) {
    const out = { translation: libre, engine: "libretranslate" };
    cacheSet(key, out);
    return out;
  }

  throw new Error(
    "Ningún motor de traducción respondió. Más adelante pega la key de Groq en Vercel."
  );
}
