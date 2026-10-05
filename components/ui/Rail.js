"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storageGet, storageSet } from "./utils";

/**
 * Horizontal scroller: native touch scrolling + momentum, light scroll-snap,
 * hidden-but-scrollable scrollbar, overflow fades shown only when there is
 * really content outside the viewport, and a one-time "Desliza" hint.
 * `ref` (React 19 ref-as-prop) points at the scroller element.
 */
export function Rail({ label, visibleLabel = false, className = "", hint = true, style, ref, children }) {
  const outerRef = useRef(null);
  const innerRef = ref || outerRef;
  const [showHint, setShowHint] = useState(false);
  const hintDone = useRef(false);

  const update = useCallback(() => {
    const el = innerRef.current;
    const wrap = el?.parentElement;
    if (!el || !wrap) return;
    const max = el.scrollWidth - el.clientWidth;
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft >= max - 2;
    const ovL = max > 4 && !atStart;
    const ovR = max > 4 && !atEnd;
    if (ovL) wrap.dataset.ovL = "";
    else delete wrap.dataset.ovL;
    if (ovR) wrap.dataset.ovR = "";
    else delete wrap.dataset.ovR;
    if (hint && ovR && !hintDone.current && storageGet("ty-rail-hint") == null) {
      hintDone.current = true;
      setShowHint(true);
    }
  }, [innerRef, hint]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    update();
    const onScroll = () => {
      update();
      if (el.scrollLeft > 8) {
        setShowHint(false);
        storageSet("ty-rail-hint", "1");
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(update)
        : null;
    mo?.observe(el, { childList: true, subtree: false });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [innerRef, update, children]);

  return (
    <div className={`rail-wrap${className ? ` ${className}` : ""}`} style={style}>
      {visibleLabel ? <span className="small rail-label">{label}</span> : null}
      <div className="rail-box">
        <div ref={innerRef} className="rail" role={label ? "group" : undefined} aria-label={label}>
          {children}
        </div>
        <span className="rail-fade l" aria-hidden="true" />
        <span className="rail-fade r" aria-hidden="true" />
        {hint && showHint ? (
          <span className="rail-hint" aria-hidden="true">
            Desliza <span className="arr">→</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
