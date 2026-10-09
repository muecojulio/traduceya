"use client";

import { useMemo } from "react";
import { encodeQr, qrPath } from "../../lib/qr";

/**
 * QR dibujado en el dispositivo a partir de `lib/qr.js`.
 *
 * Antes la imagen se pedía a api.qrserver.com con la URL de la app como
 * parámetro: un tercero veía quién abría la app y había que abrir `img-src` en
 * la CSP. Ahora no hay red, no hay tercero y funciona sin conexión.
 */
export function Qr({ value, size = 200, quiet = 2, label = "" }) {
  const qr = useMemo(() => {
    try {
      return value ? encodeQr(value, { ec: "M" }) : null;
    } catch {
      return null;
    }
  }, [value]);
  if (!qr) return null;
  const box = qr.size + quiet * 2;
  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      role={label ? "img" : "presentation"}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
    >
      <rect width={box} height={box} fill="#fff" rx={box * 0.06} />
      <path d={qrPath(qr.modules)} transform={`translate(${quiet} ${quiet})`} fill="#04100f" />
    </svg>
  );
}
