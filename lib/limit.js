/**
 * Límite de peticiones por IP, en memoria de la instancia.
 *
 * Es un freno, no una frontera: en Vercel cada función serverless tiene su
 * propio Map, así que el tope real es "N instancias × max". Para un uso
 * personal basta; si un día hace falta de verdad, el sitio es un KV.
 */
const buckets = new Map();
const MAX_BUCKETS = 5000;

export function tooMany(ip, max = 40, windowMs = 60_000) {
  const now = Date.now();
  const item = buckets.get(ip) || { n: 0, start: now };
  if (now - item.start > windowMs) {
    buckets.set(ip, { n: 1, start: now });
    return false;
  }
  item.n += 1;
  buckets.set(ip, item);

  // La instancia se reutiliza: no dejamos crecer el Map sin control.
  if (buckets.size > MAX_BUCKETS) {
    for (const [key, value] of buckets) {
      if (now - value.start > windowMs) buckets.delete(key);
    }
    if (buckets.size > MAX_BUCKETS) {
      const first = buckets.keys().next().value;
      if (first !== undefined) buckets.delete(first);
    }
  }

  return item.n > max;
}

/**
 * IP de quien llama.
 *
 * `x-forwarded-for` lo puede escribir la propia persona, así que se toma la
 * última entrada (la que añade el proxy de confianza) y no la primera, que es
 * justo la que se puede falsificar para saltarse el límite o para llenar el
 * Map de claves ajenas. En Vercel `x-vercel-forwarded-for` lo pone la
 * plataforma y no se puede pisar, así que manda cuando existe.
 */
export function clientIp(request) {
  const headers = request?.headers;
  const pick = (name) => {
    const raw = headers?.get(name);
    if (!raw) return "";
    const parts = raw.split(",");
    return (parts[parts.length - 1] || "").trim().slice(0, 64);
  };
  return pick("x-vercel-forwarded-for") || pick("x-forwarded-for") || pick("x-real-ip") || "local";
}
