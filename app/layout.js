import "@fontsource-variable/space-grotesk/index.css";
import "./globals.css";
import Install from "./install";
import { BOOT_SCRIPT } from "../lib/appearance";

export const metadata = {
  title: "TraduceYa",
  description: "Traduce voz y fotos. Incluye japonés.",
  applicationName: "TraduceYa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TraduceYa",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom nunca se bloquea: sin maximumScale ni user-scalable=no (accesibilidad).
  viewportFit: "cover",
  themeColor: "#04100f",
};

export default function RootLayout({ children }) {
  return (
    // El script de arranque deja el tema en <html> antes del primer pintado;
    // suppressHydrationWarning evita el aviso de React por esos atributos.
    <html lang="es" suppressHydrationWarning>
      <body>
        {/* Sin destello: elige noche/día y el tinte leyendo localStorage y el
            enlace (?tema=, ?tinte=, ?idioma=) antes de que se pinte la app. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <Install />
        {children}
      </body>
    </html>
  );
}
