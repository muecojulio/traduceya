import { cacheGet, cacheSet, cacheKey } from "../../../lib/cache";
import { tooMany, clientIp } from "../../../lib/limit";

export async function GET(request) {
  try {
    if (tooMany(clientIp(request), 60)) {
      return Response.json({ error: "Demasiadas peticiones." }, { status: 429 });
    }
    const word = new URL(request.url).searchParams.get("q") || "";
    const q = word.trim().slice(0, 80);
    if (!q) return Response.json({ error: "Falta la palabra." }, { status: 400 });
    const key = cacheKey(["def", q]);
    const cached = cacheGet(key);
    if (cached) return Response.json(cached);

    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`
    );
    if (!res.ok) return Response.json({ word: q, meanings: [] });
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    const out = {
      word: first?.word || q,
      phonetic: first?.phonetic || "",
      meanings: (first?.meanings || []).slice(0, 3).map((m) => ({
        part: m.partOfSpeech,
        def: m.definitions?.[0]?.definition || "",
      })),
    };
    cacheSet(key, out);
    return Response.json(out, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    return Response.json({ error: e.message || "Sin definición." }, { status: 500 });
  }
}
