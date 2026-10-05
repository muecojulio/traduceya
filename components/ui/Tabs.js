"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { scrollChildIntoViewH, usePrefersReducedMotion } from "./utils";

/**
 * Bottom dock implemented as a real accessible tablist:
 * - role=tab + aria-selected + aria-controls, roving tabindex
 * - arrows / Home / End keyboard navigation
 * - animated pill indicator that slides to the active tab
 * - horizontally scrollable if items overflow; active tab is kept visible
 */
export function Dock({ items, value, onChange, label = "Secciones" }) {
  const listRef = useRef(null);
  const indRef = useRef(null);
  const btnRefs = useRef({});
  const reduced = usePrefersReducedMotion();

  const place = useCallback(() => {
    const btn = btnRefs.current[value];
    const ind = indRef.current;
    if (!btn || !ind) return;
    ind.style.width = `${btn.offsetWidth}px`;
    ind.style.transform = `translateX(${btn.offsetLeft}px)`;
  }, [value]);

  useLayoutEffect(() => {
    place();
    scrollChildIntoViewH(listRef.current, btnRefs.current[value], { reduced });
  }, [value, reduced, place]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [place]);

  const onKeyDown = (e) => {
    const idx = items.findIndex(([id]) => id === value);
    let next = null;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next == null) return;
    e.preventDefault();
    const [id] = items[next];
    if (id !== value) onChange(id);
    btnRefs.current[id]?.focus();
  };

  return (
    <nav className="dock" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      <span className="dock-ind" ref={indRef} aria-hidden="true" />
      {items.map(([id, icon, text, badge]) => {
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            ref={(el) => {
              btnRefs.current[id] = el;
            }}
            onClick={() => onChange(id)}
          >
            <b aria-hidden="true">{icon}</b>
            {text}
            {badge ? <span className="live-dot" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </nav>
  );
}

/** Panel wrapper with correct tab ↔ panel relation + short enter animation. */
export function TabPanel({ tab, children, className = "" }) {
  return (
    <section
      id={`panel-${tab}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab}`}
      className={`panel tab-panel${className ? ` ${className}` : ""}`}
    >
      {children}
    </section>
  );
}

/**
 * Horizontal swipe on the content area switches sections.
 * Axis lock: only clearly-horizontal gestures count (|dx| > 1.2 * |dy|);
 * vertical scrolling stays with the browser. Gestures that start on
 * interactive controls or inside horizontal rails never switch tabs.
 */
export function useTabSwipe({ index, count, onSelect, disabled = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled || count < 2) return;
    const SKIP =
      'button, a, input, select, textarea, summary, video, [role="tab"], .rail, [data-no-swipe]';
    let sx = 0;
    let sy = 0;
    let st = 0;
    let axis = null;
    let tracking = false;

    const onStart = (e) => {
      tracking = false;
      axis = null;
      if (e.touches.length !== 1) return;
      if (e.target?.closest?.(SKIP)) return;
      tracking = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
    };
    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (!axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
      }
      // Take over the gesture only when it is clearly horizontal.
      if (axis === "h") e.preventDefault();
    };
    const onEnd = (e) => {
      if (!tracking) return;
      const wasH = axis === "h";
      tracking = false;
      axis = null;
      if (!wasH) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dt = Math.max(1, Date.now() - st);
      const v = dx / dt; // px/ms — admits quick flicks
      if ((dx <= -56 || (dx <= -28 && v <= -0.45)) && index < count - 1) onSelect(index + 1);
      else if ((dx >= 56 || (dx >= 28 && v >= 0.45)) && index > 0) onSelect(index - 1);
    };
    const onCancel = () => {
      tracking = false;
      axis = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [index, count, onSelect, disabled]);
  return ref;
}
