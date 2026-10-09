import { NextResponse } from "next/server";
import { BOOT_SCRIPT } from "./lib/appearance";

/**
 * Cabeceras de seguridad por petición.
 *
 * La CSP vive aquí (y no en next.config.mjs) porque necesita un nonce distinto
 * en cada respuesta: así `script-src` ya no puede llevar 'unsafe-inline', que
 * era lo que permitía ejecutar cualquier guion inyectado. Next.js lee esta
 * cabecera y firma con el mismo nonce los <script> que genera él.
 *
 * Nuestro único guion en línea (el arranque sin destello de lib/appearance.js)
 * se autoriza por su hash SHA-256, no por nonce: así el layout no tiene que
 * leer cabeceras y las páginas siguen siendo estáticas.
 *
 * Lo que no necesita por-request sigue en next.config.mjs, que sí cubre los
 * estáticos (iconos, sw.js, manifest.json) que este middleware no intercepta.
 */

const dev = process.env.NODE_ENV === "development";

/** Rutas que no son documentos: no hace falta gastar un nonce en ellas. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|sw\\.js|manifest\\.json|favicon\\.ico|icon\\.svg|.*\\.(?:png|jpg|jpeg|svg|webmanifest|woff2?|txt|xml)$).*)",
  ],
};

/** Hash del guion de arranque: se calcula una vez por instancia. */
let bootHash;
async function scriptHash() {
  if (!bootHash) {
    const bytes = new TextEncoder().encode(BOOT_SCRIPT);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    bootHash =
      "'sha256-" + btoa(String.fromCharCode(...new Uint8Array(digest))) + "'";
  }
  return bootHash;
}

export async function middleware(request) {
  const nonce = crypto.randomUUID();
  const hash = await scriptHash();

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    // El preview de Arena muestra la app en un iframe: solo en desarrollo.
    dev ? "frame-ancestors 'self' https:" : "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    // Sin api.qrserver.com: el QR se dibuja en el dispositivo (lib/qr.js).
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    // 'https:' queda por el Traductor integrado de Chrome, que descarga sus
    // modelos desde orígenes de Google que no son estables de fijar.
    dev ? "connect-src 'self' ws: https:" : "connect-src 'self' https:",
    `script-src 'self' 'nonce-${nonce}' ${hash}${dev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' en estilos: Next inyecta los suyos y no interpolamos
    // texto de la persona en ninguna regla (los colores van por CSS variables).
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "worker-src 'self'",
    dev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  if (!dev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return response;
}
