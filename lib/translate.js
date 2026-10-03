import { NAMES, SHORT } from "./langs";
import { cacheGet, cacheSet, cacheKey } from "./cache";

const TEXT_MODEL = "openai/gpt-oss-20b";

// Tope por motor: si un espejo público se cuelga no puede tumbar la función de Vercel.
const ENGINE_TIMEOUT = 7000;

function signal(ms = ENGINE_TIMEOUT) {
  return AbortSignal.timeout(ms);
}

async function json(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function viaGroq(text, targetId) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const target = NAMES[targetId] || "español";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: signal(),
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
    if (!res.ok) return null;
    const data = await json(res);
    const out = data?.choices?.[0]?.message?.content?.trim();
    return out || null;
  } catch {
    return null;
  }
}

async function viaLingva(text, targetId) {
  const target = SHORT[targetId] || "es";
  const hosts = ["https://lingva.ml"];
  for (const host of hosts) {
    try {
      const url = `${host}/api/v1/auto/${target}/${encodeURIComponent(text).slice(0, 1800)}`;
      const res = await fetch(url, { signal: signal(), headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = await json(res);
      if (data?.translation) return data.translation;
    } catch {
      /* siguiente espejo */
    }
  }
  return null;
}

async function viaLibreTranslate(text, targetId) {
  const target = SHORT[targetId] || "es";
  const hosts = [
    "https://de.libretranslate.com/translate",
    "https://translate.fedilab.app/translate",
  ];
  for (const url of hosts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        signal: signal(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target,
          format: "text",
        }),
      });
      if (!res.ok) continue;
      const data = await json(res);
      if (data?.translatedText) return data.translatedText;
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
        signal: signal(),
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
    if (!res.ok) return null;
    const data = await json(res);
    return data?.result?.translated_text || data?.result?.response || null;
  } catch {
    return null;
  }
}

async function viaMyMemory(text, targetId) {
  const target = SHORT[targetId] || "es";
  const source = guessSource(text);
  const chunk = text.slice(0, 490);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(source + "|" + target)}`;
    const res = await fetch(url, { signal: signal() });
    if (!res.ok) return null;
    const data = await json(res);
    const out = data?.responseData?.translatedText;
    if (!out || /INVALID|QUERY LENGTH|MYMEMORY WARNING|^PLEASE/i.test(out)) return null;
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
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
      signal: signal(),
    });
    if (!res.ok) return null;
    const data = await json(res);
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
        signal: signal(),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await json(res);
      const out = data?.["translated-text"] || data?.translated_text || data?.translation;
      if (out) return out;
    } catch {
      /* siguiente */
    }
  }
  return null;
}

// Orden de respaldo. Si una key está configurada, ese motor va primero.
const ENGINES = [
  ["groq", viaGroq],
  ["cloudflare", viaCloudflare],
  ["gtx", viaGoogleGtx],
  ["lingva", viaLingva],
  ["mymemory", viaMyMemory],
  ["mozhi", viaMozhi],
  ["libretranslate", viaLibreTranslate],
];

export async function translateText(text, targetId) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("No hay texto para traducir.");

  const key = cacheKey(["t", targetId, clean]);
  const cached = cacheGet(key);
  if (cached) return { ...cached, cached: true };

  for (const [name, engine] of ENGINES) {
    const out = await engine(clean, targetId);
    if (out && String(out).trim()) {
      const result = { translation: String(out).trim(), engine: name };
      cacheSet(key, result);
      return result;
    }
  }

  throw new Error(
    "Ningún motor de traducción respondió. Revisa tu conexión o pega la key de Groq en Vercel."
  );
}
