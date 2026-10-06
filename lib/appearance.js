/**
 * Apariencias de TraduceYa.
 *
 * Dos ejes independientes, conmutables desde Ajustes:
 *  - tema: "noche" (por defecto) o "dia"  -> html[data-theme="dia"]
 *  - tinte: "pestana" (por defecto) o "idioma" -> .shell[data-tint="idioma"][data-dest="ja-JP"]
 *
 * Se guardan en localStorage con las claves `ty-theme` y `ty-tint`.
 *
 * Este módulo es puro (sin React ni DOM) para poder usarlo desde el layout del
 * servidor —el script de arranque sin destello— y desde el cliente.
 */

import { NAMES } from "./langs";

export const THEME_KEY = "ty-theme";
export const TINT_KEY = "ty-tint";

export const THEMES = [
  { id: "noche", label: "Noche" },
  { id: "dia", label: "Día" },
];

export const TINTS = [
  { id: "pestana", label: "Por pestaña" },
  { id: "idioma", label: "Por idioma" },
];

const THEME_ALIASES = {
  dia: ["dia", "día", "claro", "light", "day"],
  noche: ["noche", "oscuro", "dark", "night"],
};

const TINT_ALIASES = {
  idioma: ["idioma", "lang", "language", "destino"],
  pestana: ["pestana", "pestaña", "tab", "tabs", "seccion"],
};

function matchAlias(value, table, fallback) {
  const v = String(value == null ? "" : value).trim().toLowerCase();
  for (const id of Object.keys(table)) {
    if (table[id].includes(v)) return id;
  }
  return fallback;
}

export function normalizeTheme(value, fallback = "noche") {
  return matchAlias(value, THEME_ALIASES, fallback);
}

export function normalizeTint(value, fallback = "pestana") {
  return matchAlias(value, TINT_ALIASES, fallback);
}

export const THEME_COLORS = { noche: "#04100f", dia: "#f2f9f7" };

/** Pinta el tema en <html> (color-scheme, meta theme-color) y en el dataset. */
export function applyAppearance({ theme, tint, dest } = {}) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (theme) {
    el.dataset.theme = theme;
    el.style.colorScheme = theme === "dia" ? "light" : "dark";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.noche);
  }
  if (tint) el.dataset.tint = tint;
  if (dest) el.dataset.dest = dest;
}

/** Preferencias guardadas por la persona (lo que sí persiste). */
export function readStoredAppearance() {
  if (typeof localStorage === "undefined") return {};
  try {
    return {
      theme: normalizeTheme(localStorage.getItem(THEME_KEY), ""),
      tint: normalizeTint(localStorage.getItem(TINT_KEY), ""),
    };
  } catch {
    return {};
  }
}

export function storeAppearance({ theme, tint }) {
  if (typeof localStorage === "undefined") return;
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme);
    if (tint) localStorage.setItem(TINT_KEY, tint);
  } catch {
    /* modo privado o storage lleno: la app sigue igual */
  }
}

/**
 * Script que corre antes del primer pintado: lee las preferencias guardadas y
 * deja el tema listo en <html> para que no haya destello de tema claro sobre
 * fondo oscuro (ni al revés). Nunca escribe en localStorage.
 */
export const BOOT_SCRIPT = `(function(){try{
var C=${JSON.stringify({
  themeKey: THEME_KEY,
  tintKey: TINT_KEY,
  langs: Object.keys(NAMES),
  themeColors: THEME_COLORS,
})};
var low=function(v){return String(v==null?"":v).trim().toLowerCase();};
var q=new URLSearchParams(location.search);
var theme="noche",tint="pestana",dest="";
try{
var st=low(localStorage.getItem(C.themeKey));
var si=low(localStorage.getItem(C.tintKey));
if(st==="dia"||st==="claro"||st==="light"||st==="day")theme="dia";
if(si==="idioma"||si==="lang"||si==="language"||si==="destino")tint="idioma";
}catch(e){}
var pt=low(q.get("tema"));
if(pt)theme=(pt==="dia"||pt==="d\\u00eda"||pt==="claro"||pt==="light"||pt==="day")?"dia":"noche";
var pi=low(q.get("tinte"));
if(pi)tint=(pi==="idioma"||pi==="lang"||pi==="language"||pi==="destino")?"idioma":"pestana";
var d=document.documentElement;
d.dataset.theme=theme;d.dataset.tint=tint;
if(dest)d.dataset.dest=dest;
d.style.colorScheme=theme==="dia"?"light":"dark";
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",C.themeColors[theme]||C.themeColors.noche);
}catch(e){}})();`;
