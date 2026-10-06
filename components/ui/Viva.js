"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./utils";

/* Piezas “vivas” de la interfaz: fondo ambiental, medidores, avisos animados.
   Todas son decorativas (aria-hidden) y se congelan con prefers-reduced-motion. */

/** Cielo animado: orbes de color que respiran, grano y una viga de luz. */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <i className="orb orb-1" />
      <i className="orb orb-2" />
      <i className="orb orb-3" />
      <i className="beam" />
    </div>
  );
}

/** Barras de ecualizador. `on={false}` las deja quietas (reduced motion también). */
export function Eq({ bars = 5, className = "", on = true }) {
  const reduced = usePrefersReducedMotion();
  return (
    <span className={`eq${className ? ` ${className}` : ""}`} aria-hidden="true" data-off={!on || reduced || undefined}>
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

/** Texto que rota cada `every` ms (saludos del idioma destino). */
export function Ticker({ items = [], every = 2800, className = "" }) {
  const [i, setI] = useState(0);
  const list = items.filter(Boolean);
  useEffect(() => {
    if (list.length < 2) return;
    let t = 0;
    const tick = () => {
      if (document.visibilityState === "visible") setI((v) => (v + 1) % list.length);
    };
    t = setInterval(tick, every);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, every]);
  if (!list.length) return null;
  return (
    <span className={`greet${className ? ` ${className}` : ""}`} aria-hidden="true">
      <b key={`${i}-${list[i % list.length]}`}>{list[i % list.length]}</b>
    </span>
  );
}

/** Línea de progreso indeterminada mientras hay una llamada en vuelo. */
export function Progress({ on }) {
  if (!on) return null;
  return (
    <div className="progress" role="presentation" aria-hidden="true">
      <i />
    </div>
  );
}

/** Tres anillos que salen del botón de micrófono mientras escucha. */
export function MicRings({ on }) {
  return (
    <span className="rings" aria-hidden="true" style={{ opacity: on ? 1 : 0 }}>
      <i />
      <i />
      <i />
    </span>
  );
}

/** HUD de cámara: marco de enfoque, línea de escaneo y piloto de grabación. */
export function ViewfinderHud({ live = false, label = "" }) {
  return (
    <>
      <span className="hud" aria-hidden="true">
        <i className="tl" />
        <i className="tr" />
        <i className="bl" />
        <i className="br" />
      </span>
      <span className="scanline" aria-hidden="true" />
      {live ? (
        <span className="rec" aria-hidden="true">
          <i /> {label || "Listo para leer"}
        </span>
      ) : null}
    </>
  );
}

/** Filas de carga con brillo que barre. */
export function Skeleton({ lines = 3 }) {
  return (
    <span className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

const CJK = /[\u3005-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
export const isCjk = (t) => CJK.test(String(t || ""));

/**
 * Entrada de la traducción palabra por palabra.
 * Mantiene los saltos de línea y limita el retraso para que nunca se sienta lento.
 */
export function WordReveal({ text = "", step = 26, max = 16, className = "" }) {
  const reduced = usePrefersReducedMotion();
  const lines = String(text).split("\n");
  let n = 0;
  return (
    <span className={className}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: "block" }}>
          {line.split(/(\s+)/).map((tok, ti) => {
            if (!tok.trim()) return <span key={ti}>{tok}</span>;
            const i = n++;
            // solo las primeras `max` palabras entran animadas: el resto aparece ya en su sitio
            if (reduced || i >= max) return <span key={ti}>{tok}</span>;
            return (
              <span key={ti} className="word" style={{ animationDelay: `${i * step}ms` }}>
                {tok}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** Marca temporizada: devuelve true un rato después de cada cambio de `key`. */
export function useFlash(key, ms = 1400) {
  const [on, setOn] = useState(false);
  const t = useRef(0);
  useEffect(() => {
    if (key == null) return;
    setOn(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return on;
}
