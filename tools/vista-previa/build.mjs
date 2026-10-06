/**
 * Maqueta de las 4 apariencias de TraduceYa.
 *
 *   node tools/vista-previa/build.mjs                  -> vista-previa.svg (2x2)
 *   node tools/vista-previa/build.mjs --solo=dia-idioma -> un solo teléfono
 *   node tools/vista-previa/build.mjs --out=/tmp/x.svg
 *
 * Sin dependencias: solo Node (>=18). Las paletas espejan app/globals.css
 * (secciones 13.3 y 13.4) y el acento por idioma se calcula en oklch igual que
 * el CSS, para que la maqueta no mienta.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* ===== paletas (espejo de app/globals.css) ===== */

// Acento por pestaña: [noche, día] -> [accent, accent-2, accent-ink]
const TAB_TONES = {
  voz: ["#2dd4bf", "#14b8a6", "#04241f", "#0f766e", "#115e59", "#ffffff"],
  foto: ["#fbbf24", "#f59e0b", "#2a1602", "#b45309", "#92400e", "#ffffff"],
  frases: ["#6ee7b7", "#34d399", "#05271b", "#047857", "#065f46", "#ffffff"],
  instalar: ["#38bdf8", "#0ea5e9", "#032434", "#0369a1", "#075985", "#ffffff"],
};

// Acento por idioma destino: el tono (hue oklch) sale del idioma, la
// luminosidad/croma del tema. Se calculan abajo con oklch -> sRGB.
const LANG_HUE = {
  "ja-JP": 28,
  "en-US": 265,
  "zh-CN": 350,
  "ko-KR": 300,
  "fr-FR": 205,
  "pt-BR": 150,
  "it-IT": 130,
  "de-DE": 70,
  "es-MX": 175,
};
const LANG_NAME = {
  "ja-JP": "japonés",
  "en-US": "inglés",
  "zh-CN": "chino",
  "ko-KR": "coreano",
  "fr-FR": "francés",
  "pt-BR": "portugués",
  "it-IT": "italiano",
  "de-DE": "alemán",
  "es-MX": "español",
};

const TOKENS = {
  noche: {
    shellTop: "#0a1e1b",
    shellMid: "#071412",
    shellBottom: "#04100f",
    card: "#10241f",
    cardSoft: "#0c1e1b",
    well: "#081a17",
    field: "#0d1f1c",
    ink: "#f2fdf9",
    inkDim: "#cbeade",
    muted: "#92b3ab",
    line: "#1d4139",
    lineSoft: "#2b6157",
    dock: "rgba(9,26,24,0.9)",
  },
  dia: {
    shellTop: "#ffffff",
    shellMid: "#e9f4f0",
    shellBottom: "#f2f9f7",
    card: "#ffffff",
    cardSoft: "#f6fbf9",
    well: "#edf6f3",
    field: "#f6fbf9",
    ink: "#06201c",
    inkDim: "#20403a",
    muted: "#47665e",
    line: "#c8ded7",
    lineSoft: "#b3d2c9",
    dock: "rgba(255,255,255,0.94)",
  },
};

/* ===== oklch -> sRGB (mismas matemáticas que usa el navegador) ===== */
function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const srgb = lin.map((v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, c));
  });
  return (
    "#" +
    srgb
      .map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function languageTone(lang, theme) {
  const hue = LANG_HUE[lang] ?? 175;
  const light = theme === "dia";
  return {
    accent: oklchToHex(light ? 0.47 : 0.78, light ? 0.11 : 0.12, hue),
    accent2: oklchToHex(light ? 0.38 : 0.69, light ? 0.11 : 0.12, hue),
    ink: light ? "#ffffff" : oklchToHex(0.22, 0.05, hue),
  };
}

/** Devuelve la tríada de acento que usaría la app para ese estado. */
function toneFor({ theme, tint, tab, dest }) {
  if (tint === "idioma") return languageTone(dest, theme);
  const t = TAB_TONES[tab] || TAB_TONES.voz;
  const i = theme === "dia" ? 3 : 0;
  return { accent: t[i], accent2: t[i + 1], ink: t[i + 2] };
}

/* ===== utilidades de dibujo ===== */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FONT = "'DejaVu Sans', 'Noto Sans', system-ui, sans-serif";

function text(x, y, str, { size = 13, fill = "#fff", weight = 400, ls = 0, anchor = "start" } = {}) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}"` +
    ` fill="${fill}"${ls ? ` letter-spacing="${ls}"` : ""}${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}>` +
    `${esc(str)}</text>`
  );
}

function rect(x, y, w, h, { fill = "#fff", r = 0, stroke = "", sw = 1, opacity = 1 } = {}) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"` +
    ` opacity="${opacity}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}/>`
  );
}

/* ===== piezas de la pantalla ===== */

function chip(x, y, label, { active, tone, t }) {
  const w = Math.max(84, label.length * 8 + 34 + (active ? 16 : 0));
  const h = 44;
  const bg = active ? t.card : t.field;
  const stroke = active ? tone.accent : t.line;
  const color = active ? tone.accent : t.inkDim;
  return {
    w,
    svg:
      rect(x, y, w, h, { fill: bg, r: 22, stroke, sw: active ? 1.6 : 1 }) +
      (active ? text(x + 12, y + 28, "✓", { size: 13, fill: tone.accent, weight: 700 }) : "") +
      text(x + (active ? 30 : 13), y + 28, label, { size: 13.5, fill: color, weight: active ? 700 : 500 }),
  };
}

function label(x, y, str, t) {
  return text(x, y, str, { size: 10.5, fill: t.muted, weight: 700, ls: 1.4 });
}

function iconMic(cx, cy, color) {
  return (
    `<g stroke="${color}" stroke-width="1.9" fill="none" stroke-linecap="round">` +
    `<rect x="${cx - 4.5}" y="${cy - 10}" width="9" height="14" rx="4.5"/>` +
    `<path d="M${cx - 8} ${cy - 1} a8 8 0 0 0 16 0"/>` +
    `<path d="M${cx} ${cy + 7} v4"/></g>`
  );
}
function iconCam(cx, cy, color) {
  return (
    `<g stroke="${color}" stroke-width="1.8" fill="none" stroke-linejoin="round">` +
    `<rect x="${cx - 10}" y="${cy - 7}" width="20" height="14" rx="4"/>` +
    `<circle cx="${cx}" cy="${cy}" r="4"/></g>`
  );
}
function iconBolt(cx, cy, color) {
  return `<path d="M${cx + 2} ${cy - 10} L${cx - 6} ${cy + 1} h6 l-2 9 8 -11 h-6 z" fill="${color}"/>`;
}
function iconSliders(cx, cy, color) {
  return (
    `<g stroke="${color}" stroke-width="1.8" stroke-linecap="round">` +
    `<path d="M${cx - 9} ${cy - 5} h18"/><path d="M${cx - 9} ${cy + 4} h18"/>` +
    `<circle cx="${cx - 3}" cy="${cy - 5}" r="2.6" fill="${color}"/>` +
    `<circle cx="${cx + 4}" cy="${cy + 4}" r="2.6" fill="${color}"/></g>`
  );
}

/** Un teléfono con la pantalla de Ajustes ya vestida con esa apariencia. */
function phone({ theme, tint, tab = "instalar", dest = "ja-JP", x = 0, y = 0, w = 440, h = 800 }) {
  const t = TOKENS[theme];
  const tone = toneFor({ theme, tint, tab, dest });
  const pad = 22;
  const inner = { x: pad, w: w - pad * 2 };
  const out = [];

  // marco + pantalla
  out.push(rect(x, y, w, h, { fill: theme === "dia" ? "#e7efec" : "#0b1513", r: 46 }));
  out.push(rect(x + 9, y + 9, w - 18, h - 18, { fill: t.shellBottom, r: 38 }));
  out.push(
    `<defs><linearGradient id="sky-${theme}-${tint}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${t.shellTop}"/><stop offset="0.42" stop-color="${t.shellMid}"/>` +
      `<stop offset="1" stop-color="${t.shellBottom}"/></linearGradient>` +
      `<radialGradient id="halo-${theme}-${tint}" cx="0.5" cy="0" r="0.75">` +
      `<stop offset="0" stop-color="${tone.accent}" stop-opacity="${theme === "dia" ? 0.22 : 0.3}"/>` +
      `<stop offset="1" stop-color="${tone.accent}" stop-opacity="0"/></radialGradient></defs>`
  );
  out.push(rect(x + 9, y + 9, w - 18, h - 18, { fill: `url(#sky-${theme}-${tint})`, r: 38 }));
  out.push(rect(x + 9, y + 9, w - 18, h - 18, { fill: `url(#halo-${theme}-${tint})`, r: 38 }));

  // barra superior: marca + píldora del idioma
  const bx = x + pad + 4;
  const by = y + 34;
  out.push(
    `<defs><linearGradient id="mark-${theme}-${tint}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${tone.accent}"/><stop offset="1" stop-color="${tone.accent2}"/></linearGradient></defs>`
  );
  out.push(rect(bx, by, 32, 32, { fill: `url(#mark-${theme}-${tint})`, r: 12 }));
  out.push(text(bx + 16, by + 21.5, "T", { size: 16, fill: tone.ink, weight: 700, anchor: "middle" }));
  out.push(text(bx + 44, by + 22, "TraduceYa", { size: 19, fill: t.ink, weight: 700, ls: -0.6 }));
  const pillW = 46;
  out.push(rect(x + w - pad - pillW - 2, by + 4, pillW, 24, { fill: t.cardSoft, r: 12, stroke: t.line }));
  out.push(text(x + w - pad - pillW / 2 - 2, by + 21, dest.slice(0, 2).toUpperCase(), { size: 11.5, fill: t.inkDim, weight: 700, anchor: "middle" }));
  out.push(rect(x + pad, y + 78, w - pad * 2, 1, { fill: t.line, opacity: 0.7 }));

  // contenido: Ajustes
  let cy = y + 112;
  out.push(label(inner.x + x, cy, "APARIENCIA", t));
  let cx = inner.x + x;
  for (const [id, name] of [["noche", "Noche"], ["dia", "Día"]]) {
    const c = chip(cx, cy + 10, name, { active: theme === id, tone, t });
    out.push(c.svg);
    cx += c.w + 10;
  }
  cy += 74;
  out.push(label(inner.x + x, cy, "COLOR DE ACENTO", t));
  cx = inner.x + x;
  for (const [id, name] of [["pestana", "Por pestaña"], ["idioma", "Por idioma"]]) {
    const c = chip(cx, cy + 10, name, { active: tint === id, tone, t });
    out.push(c.svg);
    cx += c.w + 10;
  }
  cy += 72;
  out.push(
    text(inner.x + x, cy + 8, tint === "idioma" ? `El acento sigue al idioma que lees: ${LANG_NAME[dest]}.` : "El acento cambia con la pestaña abierta.", {
      size: 12,
      fill: t.muted,
    })
  );

  // lector: la traducción en grande
  const ry = cy + 28;
  const rh = 150;
  out.push(rect(inner.x + x, ry, inner.w, rh, { fill: t.well, r: 20, stroke: t.line }));
  out.push(rect(inner.x + x, ry + 14, 3.5, rh - 28, { fill: tone.accent, r: 2 }));
  out.push(text(inner.x + x + 20, ry + 46, "Buenos días", { size: 27, fill: t.ink, weight: 700, ls: -0.8 }));
  out.push(text(inner.x + x + 20, ry + 70, "con todo gusto, muchas gracias", { size: 13, fill: t.inkDim }));
  out.push(rect(inner.x + x + 20, ry + 88, inner.w - 40, 46, { fill: tone.accent, r: 15 }));
  out.push(text(inner.x + x + 20 + (inner.w - 40) / 2, ry + 117, "Probar voz", { size: 15, fill: tone.ink, weight: 700, anchor: "middle" }));

  // colapsable
  const ky = ry + rh + 16;
  out.push(rect(inner.x + x, ky, inner.w, 54, { fill: t.cardSoft, r: 16, stroke: t.line }));
  out.push(text(inner.x + x + 16, ky + 33, "¿Cómo instalarla?", { size: 14.5, fill: t.ink, weight: 700 }));
  out.push(
    `<path d="M${inner.x + x + inner.w - 26} ${ky + 27} l6 6 l6 -6" fill="none" stroke="${tone.accent}" stroke-width="2" stroke-linecap="round"/>`
  );

  // voz en español: otra fila de chips para que la pantalla se vea llena
  const vy = ky + 74;
  out.push(label(inner.x + x, vy, "VOZ EN ESPAÑOL", t));
  let vx = inner.x + x;
  for (const [id, name] of [["mujer", "Mujer"], ["hombre", "Hombre"], ["auto", "Auto"]]) {
    const c = chip(vx, vy + 10, name, { active: id === "mujer", tone, t });
    out.push(c.svg);
    vx += c.w + 10;
  }

  // dock
  const dockH = 92;
  const dockY = y + h - dockH - 9;
  out.push(rect(x + 9, dockY, w - 18, dockH, { fill: t.dock, r: 0 }));
  out.push(rect(x + 9, dockY, w - 18, 1, { fill: t.line, opacity: 0.8 }));
  const items = [
    ["voz", "Hablar", iconMic(x + pad + 46, dockY + 36, t.muted)],
    ["foto", "Cámara", iconCam(x + pad + 46 + 96, dockY + 36, t.muted)],
    ["frases", "Frases", iconBolt(x + pad + 46 + 192, dockY + 36, t.muted)],
    ["instalar", "Ajustes", iconSliders(x + pad + 46 + 288, dockY + 36, tone.accent)],
  ];
  items.forEach(([id, name, iconSvg], i) => {
    const active = id === tab;
    const cxx = x + pad + 46 + i * 96;
    if (active) {
      out.push(rect(cxx - 44, dockY + 12, 88, dockH - 24, { fill: t.card, r: 16, stroke: tone.accent, sw: 1.4 }));
      out.push(rect(cxx - 44, dockY + 12, 88, dockH - 24, { fill: tone.accent, r: 16, opacity: 0.12 }));
    }
    out.push(active ? iconSvg.replaceAll(t.muted, tone.accent) : iconSvg);
    out.push(
      text(cxx, dockY + 70, name, {
        size: 11.5,
        fill: active ? tone.accent : t.muted,
        weight: active ? 700 : 600,
        anchor: "middle",
      })
    );
  });
  return out.join("\n");
}

/* ===== apariencias y salida ===== */

const APARENCIAS = [
  { id: "noche-pestana", theme: "noche", tint: "pestana", tab: "instalar", dest: "ja-JP", title: "Noche · acento por pestaña", note: "Ajustes con el celeste de la sección" },
  { id: "noche-idioma", theme: "noche", tint: "idioma", tab: "instalar", dest: "ja-JP", title: "Noche · acento por idioma", note: "El acento sale del japonés (destino)" },
  { id: "dia-pestana", theme: "dia", tint: "pestana", tab: "instalar", dest: "ja-JP", title: "Día · acento por pestaña", note: "Modo claro, mismo celeste oscurecido" },
  { id: "dia-idioma", theme: "dia", tint: "idioma", tab: "instalar", dest: "ja-JP", title: "Día · acento por idioma", note: "Tono japonés más oscuro, para AA" },
];

function sheet() {
  const W = 1240;
  const phoneW = 440;
  const phoneH = 800;
  const colX = [80, 720];
  const rowY = [236, 1230];
  const H = rowY[1] + phoneH + 200;
  const parts = [
    rect(0, 0, W, H, { fill: "#0b1512" }),
    rect(0, 0, W, 4, { fill: "#2dd4bf" }),
    text(80, 92, "TraduceYa · las 4 apariencias", { size: 34, fill: "#f2fdf9", weight: 700, ls: -0.8 }),
    text(80, 126, "Noche/día (html[data-theme]) × acento por pestaña o por idioma destino (.shell[data-tint][data-dest])", {
      size: 14.5,
      fill: "#92b3ab",
    }),
    text(80, 154, "Conmutables en Ajustes · localStorage ty-theme / ty-tint · el enlace (?tema= &tinte= &idioma=) pinta la visita sin guardarse", {
      size: 13,
      fill: "#6f8f87",
    }),
  ];
  APARENCIAS.forEach((a, i) => {
    const x = colX[i % 2];
    const y = rowY[Math.floor(i / 2)];
    parts.push(rect(x - 16, y - 16, phoneW + 32, phoneH + 108, { fill: "#0f1d1a", r: 56, stroke: "#1d4139" }));
    parts.push(phone({ ...a, x, y }));
    parts.push(text(x + 4, y + phoneH + 36, a.title, { size: 17, fill: "#eafcf7", weight: 700 }));
    parts.push(text(x + 4, y + phoneH + 60, a.note, { size: 13, fill: "#8fb0a8" }));
  });
  const footY = rowY[1] + phoneH + 120;
  parts.push(rect(80, footY - 34, W - 160, 1, { fill: "#1d4139" }));
  parts.push(
    text(80, footY + 2, "Enlaces directos:  /?tab=instalar&tema=dia   ·   /?tab=instalar&tema=dia&tinte=idioma&idioma=ja", {
      size: 14,
      fill: "#cbeade",
      weight: 700,
    })
  );
  parts.push(
    text(80, footY + 28, "La maqueta la genera tools/vista-previa/build.mjs; el acento por idioma se calcula en oklch igual que app/globals.css.", {
      size: 12.5,
      fill: "#6f8f87",
    })
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${parts.join("\n")}
</svg>
`;
}

function solo(id) {
  const a = APARENCIAS.find((x) => x.id === id);
  if (!a) {
    console.error(`Apariencia desconocida: ${id}. Usa una de: ${APARENCIAS.map((x) => x.id).join(", ")}`);
    process.exit(1);
  }
  const W = 600;
  const H = 1000;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${rect(0, 0, W, H, { fill: a.theme === "dia" ? "#eef5f3" : "#0b1512" })}
${rect(64, 40, 472, 820, { fill: a.theme === "dia" ? "#dbe7e3" : "#0f1d1a", r: 50 })}
${phone({ ...a, x: 80, y: 50 })}
${text(300, 916, a.title, { size: 21, fill: a.theme === "dia" ? "#06201c" : "#eafcf7", weight: 700, anchor: "middle" })}
${text(300, 944, a.note, { size: 14, fill: "#6f8f87", anchor: "middle" })}
</svg>
`;
}

const args = process.argv.slice(2);
const flag = (name, fallback = "") => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes("=") ? hit.split("=").slice(1).join("=") : "1";
};
const soloId = flag("solo");
const base = dirname(fileURLToPath(import.meta.url));
const out = resolve(flag("out") || (soloId ? `${base}/vista-previa-${soloId}.svg` : `${base}/vista-previa.svg`));

const svg = soloId ? solo(soloId) : sheet();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg, "utf8");
console.log(`${out} (${svg.length} bytes)`);
