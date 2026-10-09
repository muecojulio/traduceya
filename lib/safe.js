import { NAMES } from "./langs";

/**
 * Validación de lo que llega por HTTP.
 *
 * Todo lo que entra a una ruta de API pasa por aquí antes de tocar un motor
 * externo o la caché: listas blancas en vez de "confía y recorta". Así un
 * `target` inventado no acaba dentro de una URL de terceros ni como clave de
 * caché, y una "foto" que no es una imagen no se reenvía a ningún lado.
 */

const LANG_IDS = new Set(Object.keys(NAMES));

/** Límite del texto a traducir (caracteres). */
export const MAX_TEXT = 4000;

/** Límite del JSON de la foto en bytes (≈ 1.9 MB de imagen ya comprimida). */
export const MAX_PHOTO_BODY = 2_600_000;

/**
 * Devuelve un idioma de la lista (`"ja-JP"`) o `null`.
 * Acepta también el código corto (`"ja"`), como hacen los parámetros de URL.
 */
export function safeLang(value, fallback = null) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (LANG_IDS.has(raw)) return raw;
  const two = raw.slice(0, 2).toLowerCase();
  for (const id of LANG_IDS) if (id.slice(0, 2).toLowerCase() === two) return id;
  return fallback;
}

/**
 * Texto saneado para traducir: recortado, sin caracteres de control y sin
 * ceros. `null` si no queda nada.
 */
export function safeText(value, max = MAX_TEXT) {
  if (typeof value !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  const out = clean.slice(0, max).trim();
  return out || null;
}

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * Valida una foto en base64. Devuelve `{ mime, bytes }` o `null`.
 * Comprueba el prefijo, el alfabeto base64 y el tamaño ya decodificado, para no
 * reenviar a OCR.space ni a Groq algo que no es una imagen.
 */
export function safeImage(value, maxBytes = 1_900_000) {
  if (typeof value !== "string" || value.length > 2_700_000) return null;
  const match = DATA_URL.exec(value);
  if (!match) return null;
  const [, format, payload] = match;
  const bytes = Math.floor((payload.length * 3) / 4);
  if (!bytes || bytes > maxBytes) return null;
  return { mime: `image/${format === "jpeg" ? "jpeg" : format}`, bytes, dataUrl: value };
}

/**
 * Lee el cuerpo JSON con tope de tamaño explícito.
 * `null` si falta, no es JSON o se pasa del límite.
 */
export async function readJson(request, maxBytes = MAX_PHOTO_BODY) {
  const declared = Number(request?.headers?.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
