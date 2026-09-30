import "./globals.css";
import Install from "./install";

export const metadata = {
  title: "TraduceYa",
  description: "Traduce voz y fotos. Incluye japonés.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TraduceYa",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
