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

  // La instancia de Vercel se reutiliza: no dejamos crecer el Map sin control.
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

export function clientIp(request) {
  return (
    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request?.headers?.get("x-real-ip") ||
    "local"
  );
}
