"use client";

import { useEffect, useState } from "react";

/** SSR-safe media query hook (always false on first paint). */
export function useMediaQuery(query) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return match;
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Mouse + hover: treat card swipes as optional and reveal actions inline. */
export function useFinePointer() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** case + accent-insensitive normalizer for Spanish UI search */
export function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Center `child` horizontally inside a horizontal scroller without touching the page. */
export function scrollChildIntoViewH(scroller, child, { reduced = false } = {}) {
  if (!scroller || !child) return;
  if (scroller.scrollWidth <= scroller.clientWidth + 2) return;
  const target =
    child.offsetLeft - (scroller.clientWidth - child.clientWidth) / 2;
  const max = scroller.scrollWidth - scroller.clientWidth;
  const left = clamp(target, 0, max);
  if (Math.abs(scroller.scrollLeft - left) < 4) return;
  if (typeof scroller.scrollTo === "function") scroller.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
}

/** Clipboard with a fallback for older webviews; throws so callers can show error state. */
export async function copyText(text) {
  if (!text) throw new Error("nada");
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    ta.remove();
  }
  if (!ok) throw new Error("copy");
}

export const storageGet = (k) => {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};

export const storageSet = (k, v) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};
