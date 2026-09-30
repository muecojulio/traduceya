const buckets = new Map();

export function tooMany(ip, max = 40, windowMs = 60_000) {
  const now = Date.now();
  const item = buckets.get(ip) || { n: 0, start: now };
  if (now - item.start > windowMs) {
    buckets.set(ip, { n: 1, start: now });
    return false;
  }
  item.n += 1;
  buckets.set(ip, item);
  return item.n > max;
}

export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
