/** @type {import('next').NextConfig} */
// Cabeceras que aplican a TODO lo que sirve la app (documentos y estáticos).
// La Content-Security-Policy no está aquí: vive en middleware.js porque
// necesita un nonce por respuesta (ver el comentario de ese archivo).
const dev = process.env.NODE_ENV === "development";

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), " +
      "bluetooth=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  // Aislamiento del documento: no se comparte proceso con otros orígenes.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Nuestros recursos no se pueden incrustar desde otro origen.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
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
