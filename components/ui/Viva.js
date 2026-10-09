"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFinePointer, usePrefersReducedMotion } from "./utils";

/* Piezas “vivas” de la interfaz: cielo ambiental, medidores, avisos animados.
   Todas son decorativas (aria-hidden) y se congelan con prefers-reduced-motion. */

/**
 * Cielo animado: auroras que giran, orbes que respiran, una retícula en
 * perspectiva, un haz de luz, glifos que suben y un foco que sigue al puntero.
 * `glyphs` trae los caracteres del idioma destino: el fondo habla ese idioma.
 */
export function Ambient({ glyphs = [] }) {
  const ref = useRef(null);
  const fine = useFinePointer();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine) return;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
        el.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine]);

  return (
    <div className={"ambient" + (fine ? " has-spot" : "")} ref={ref} aria-hidden="true">
      <i className="aurora a1" />
      <i className="aurora a2" />
      <i className="orb orb-1" />
      <i className="orb orb-2" />
      <i className="orb orb-3" />
      <i className="grid-floor" />
      <i className="beam" />
      <GlyphField glyphs={glyphs} />
      <i className="spot" />
    </div>
  );
}

/** Glifos del idioma destino que suben muy despacio y se apagan. */
function GlyphField({ glyphs }) {
  const chars = glyphs.length ? glyphs : ["あ", "A", "你", "안", "ñ"];
  const picks = GLYPH_SLOTS.map((slot, i) => ({
    ...slot,
    char: chars[i % chars.length].slice(0, 1) || chars[0].slice(0, 1),
  }));
  return (
    <span className="glyphs">
      {picks.map((g, i) => (
        <b
          key={i}
          style={{
            left: `${g.left}%`,
            fontSize: `${g.size}rem`,
            animationDelay: `${g.delay}s`,
            animationDuration: `${g.dur}s`,
          }}
        >
          {g.char}
        </b>
      ))}
    </span>
  );
}

/** Posiciones fijas (sin Math.random: el SSR y la hidratación tienen que coincidir). */
const GLYPH_SLOTS = [
  { left: 6, size: 2.6, delay: 0, dur: 26 },
  { left: 19, size: 1.5, delay: 4, dur: 31 },
  { left: 33, size: 3.4, delay: 9, dur: 38 },
  { left: 47, size: 1.9, delay: 2, dur: 28 },
  { left: 61, size: 2.9, delay: 13, dur: 34 },
  { left: 74, size: 1.6, delay: 7, dur: 29 },
  { left: 86, size: 3.1, delay: 17, dur: 41 },
  { left: 94, size: 1.4, delay: 11, dur: 25 },
];

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

/**
 * Onda de voz. Se alimenta de `levelRef`, un número 0..1 que sube cada vez que
 * el dictado reconoce texto (ver `useVoiceEnergy`) y decae solo.
 * No abre el micrófono por su cuenta: el audio ya lo tiene el reconocedor y
 * pedirlo dos veces en el celular puede dejarlo mudo.
 */
export function Waveform({ levelRef, on = false, bars = 30 }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const live = on && !reduced;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !live) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const values = new Array(bars).fill(0.06);
    let raf = 0;
    let t = 0;
    let last = performance.now();
    let color = "#2dd4bf";
    let colorAt = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * dpr));
      canvas.height = Math.max(1, Math.round(box.height * dpr));
    };
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const bar = (x, y, w, h, r) => {
      const radius = Math.min(r, w / 2, h / 2);
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
        return;
      }
      ctx.fillRect(x, y, w, h);
    };

    const draw = (now) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      t += dt;
      const level = levelRef?.current ?? 0;
      if (levelRef) levelRef.current = Math.max(0, level - dt * 1.5);
      if (now - colorAt > 500) {
        colorAt = now;
        const read = getComputedStyle(canvas).getPropertyValue("--wave").trim();
        // Si el tema cambia a un color que canvas no entiende, se queda el anterior.
        if (/^(#|rgb|hsl|oklch|oklab|color)/i.test(read)) color = read;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const gap = 2 * dpr;
      const bw = (w - gap * (bars - 1)) / bars;
      const mid = (bars - 1) / 2;
      for (let i = 0; i < bars; i++) {
        const center = 1 - Math.abs(i - mid) / (mid || 1);
        const idle = 0.1 + 0.07 * Math.sin(t * 2.2 + i * 0.5);
        const voice = level * (0.3 + 0.8 * center) * (0.65 + 0.55 * Math.sin(t * 11 + i * 1.9));
        const target = Math.min(1, Math.max(idle, voice + idle * 0.6));
        values[i] += (target - values[i]) * Math.min(1, dt * 16);
        const bh = Math.max(2.5 * dpr, values[i] * h);
        ctx.globalAlpha = 0.3 + 0.7 * values[i];
        bar(i * (bw + gap), (h - bh) / 2, bw, bh, 2 * dpr);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [live, bars, levelRef]);

  return <canvas ref={ref} className="waveform" data-on={live || undefined} aria-hidden="true" />;
}

/**
 * Nivel de voz 0..1: `bump()` lo sube (se llama cuando el dictado trae texto
 * nuevo) y la onda lo deja caer sola. Es una ref, no estado: no re-renderiza.
 */
export function useVoiceEnergy() {
  const level = useRef(0);
  const bump = useCallback((amount = 1) => {
    level.current = Math.min(1, level.current + 0.42 * Math.min(1.6, amount));
  }, []);
  return { level, bump };
}

/** Confeti: estalla cuando cambia `signal`. Una sola vez por cambio. */
export function Confetti({ signal, count = 34 }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const canvas = ref.current;
    if (!canvas || !signal || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const box = canvas.getBoundingClientRect();
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    const style = getComputedStyle(canvas);
    const palette = (style.getPropertyValue("--confetti") || "#2dd4bf,#fbbf24,#38bdf8,#a3e635")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const originX = canvas.width * 0.5;
    const originY = canvas.height * 0.55;
    const bits = Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / count - 0.5) * 2.5 + Math.sin(i * 12.9898) * 0.3;
      const speed = 240 + ((i * 37) % 260);
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * dpr,
        vy: Math.sin(angle) * speed * dpr,
        size: (3 + ((i * 13) % 4)) * dpr,
        spin: ((i % 7) - 3) * 0.9,
        rot: (i * 0.7) % Math.PI,
        color: palette[i % palette.length],
        life: 0,
        max: 0.9 + ((i * 7) % 6) / 10,
      };
    });
    let raf = 0;
    let last = performance.now();
    const draw = (now) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const b of bits) {
        b.life += dt;
        if (b.life > b.max) continue;
        alive++;
        b.vy += 620 * dpr * dt;
        b.vx *= 1 - 1.4 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.spin * dt;
        const k = 1 - b.life / b.max;
        ctx.save();
        ctx.globalAlpha = Math.max(0, k);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size * (0.4 + 0.6 * k));
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [signal, reduced, count]);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

/**
 * Inclinación 3D + brillo que sigue al puntero (solo con ratón).
 * Devuelve el ref para el elemento; el CSS hace el resto con --rx/--ry/--mx/--my.
 */
export function useTilt({ max = 6, scale = 1.01 } = {}) {
  const ref = useRef(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduced) return;
    let raf = 0;
    const set = (x, y) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const px = (x - box.left) / box.width;
        const py = (y - box.top) / box.height;
        el.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        el.style.setProperty("--tilt-scale", String(scale));
      });
    };
    const onMove = (e) => set(e.clientX, e.clientY);
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--tilt-scale", "1");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced, max, scale]);

  return ref;
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

/** Número que cuenta hasta su valor en vez de aparecer de golpe. */
export function CountUp({ to = 0, ms = 520 }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    if (reduced || from.current === to) {
      from.current = to;
      setShown(to);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (to - a) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, reduced]);
  return <>{shown}</>;
}
