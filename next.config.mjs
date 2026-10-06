/** @type {import('next').NextConfig} */
// Solo en `next dev`: el preview de Arena muestra la app dentro de un iframe,
// así que ahí el marco se permite. El build de producción no cambia: sigue con
// X-Frame-Options: DENY y frame-ancestors 'none' (nadie nos incrusta).
const dev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  dev ? "frame-ancestors 'self' https:" : "frame-ancestors 'none'",
  "form-action 'self'",
  "manifest-src 'self'",
  "img-src 'self' data: blob: https://api.qrserver.com",
  "media-src 'self' blob:",
  "connect-src 'self' https:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "worker-src 'self'",
].join("; ");

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: dev
          ? baseHeaders
          : [{ key: "X-Frame-Options", value: "DENY" }, ...baseHeaders],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
