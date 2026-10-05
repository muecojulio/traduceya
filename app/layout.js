import "./globals.css";
import Install from "./install";

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
  themeColor: "#071412",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Install />
        {children}
      </body>
    </html>
  );
}
