"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { clamp, useFinePointer } from "./utils";

/**
 * Swipe-to-reveal action panel for a card.
 * - Touch only; axis-locked via CSS `touch-action: pan-y` + drag-direction check,
 *   so vertical page scroll keeps working and the browser stays in charge.
 * - Never starts on nested buttons/links/fields (they keep their own gestures).
 * - Movement is clamped to the panel width; release uses a 45% threshold or a
 *   quick flick; a post-drag click is swallowed so the card doesn't activate.
 * - A visible "⋯" toggle opens/closes the panel (swipe is never the only way);
 *   when hidden the panel is `inert` + aria-hidden (no focus, no announcements).
 * - On fine-pointer (desktop) the actions render inline instead of being swiped.
 */
export function SwipeActions({ actions, label = "Acciones", children }) {
  const fine = useFinePointer();
  const uid = useId();
  const panelId = `${uid}-panel`;
  const [open, setOpen] = useState(false);
  const [w, setW] = useState(0);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const panelRef = useRef(null);
  const drag = useRef({ id: -1, x0: 0, y0: 0, x: 0, t0: 0, mode: null });
  const moved = useRef(false);

  const measure = useCallback(() => {
    if (fine) return;
    const p = panelRef.current;
    if (p) setW(Math.ceil(p.offsetWidth) + 8);
  }, [fine]);

  useEffect(() => {
    measure();
  }, [measure, actions]);

  useEffect(() => {
    if (fine) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fine, measure]);

  const setX = (px) => {
    const c = cardRef.current;
    if (c) c.style.transform = `translateX(${px}px)`;
  };

  useEffect(() => {
    if (drag.current.mode === "h") return; // hand control to the drag
    setX(open ? -w : 0);
  }, [open, w]);

  const onPointerDown = (e) => {
    if (fine || e.pointerType === "mouse") return;
    const c = e.target.closest?.(
      "button, a, input, select, textarea, label, video, [data-no-swipe]"
    );
    if (c) return; // controls keep their taps
    const d = drag.current;
    d.id = e.pointerId;
    d.x0 = e.clientX;
    d.y0 = e.clientY;
    d.x = 0;
    d.t0 = performance.now();
    d.mode = null;
    moved.current = false;
    cardRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (d.id !== e.pointerId || d.mode === "v") return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.mode) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
      if (d.mode === "h") cardRef.current?.classList.add("dragging");
    }
    d.x = dx;
    if (Math.abs(dx) > 4) moved.current = true;
    const base = open ? -w : 0;
    setX(clamp(base + dx, -w, 0));
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = -1;
    cardRef.current?.classList.remove("dragging");
    if (d.mode !== "h") return;
    const dt = Math.max(1, performance.now() - d.t0);
    const v = d.x / dt;
    const base = open ? -w : 0;
    const eff = clamp(base + d.x, -w, 0);
    const shouldOpen =
      eff <= -w * 0.45 ||
      (eff <= -w * 0.2 && v <= -0.4) ||
      (eff > -w * 0.55 && v >= 0.4);
    setOpen(shouldOpen);
    d.mode = null;
    d.x = 0;
  };

  // swallow the click that follows a drag, and let a body tap close the panel
  const onClickCapture = (e) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
      return;
    }
    if (open && !e.target.closest?.("button, a, [data-no-swipe]")) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector(".swipe-toggle")?.focus();
    }
  };

  const renderAct = (a) => (
    <button
      key={a.id}
      type="button"
      className="ui-btn ghost swipe-act"
      onClick={a.onClick}
      aria-busy={a.busy || undefined}
    >
      <span className="ui-btn-in">
        <span className="ui-slot">
          {a.busy ? (
            <span className="ui-spin" aria-hidden="true" />
          ) : a.ok ? (
            <span className="ui-mark ok" aria-hidden="true">
              ✓
            </span>
          ) : (
            <span aria-hidden="true">{a.icon}</span>
          )}
        </span>
        <span className="ui-btn-label">{a.label}</span>
      </span>
    </button>
  );

  return (
    <div
      className={"swipe" + (open ? " open" : "") + (fine ? " fine" : "")}
      ref={rootRef}
      onKeyDown={onKeyDown}
      style={{ "--sw": `${w}px` }}
    >
      {!fine ? (
        <div
          id={panelId}
          className="swipe-panel"
          ref={panelRef}
          role="group"
          aria-label={label}
          aria-hidden={!open}
          inert={!open || undefined}
        >
          {actions.map(renderAct)}
        </div>
      ) : null}
      <div
        className="swipe-card"
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {!fine ? (
          <button
            type="button"
            className="swipe-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? `Cerrar ${label.toLowerCase()}` : `Abrir ${label.toLowerCase()}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "⋯"}
          </button>
        ) : null}
        {children}
        {fine ? (
          <div className="swipe-fine" role="group" aria-label={label}>
            {actions.map(renderAct)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
