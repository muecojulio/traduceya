const store = new Map();
const MAX = 200;
const TTL = 1000 * 60 * 60 * 12;

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value) {
  if (store.size >= MAX) {
    const first = store.keys().next().value;
    if (first) store.delete(first);
  }
  store.set(key, { value, exp: Date.now() + TTL });
}

export function cacheKey(parts) {
  return parts.map((p) => String(p || "").trim().toLowerCase()).join("|");
}
