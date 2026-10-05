"use client";

import { useEffect, useRef } from "react";
import { Rail } from "./Rail";
import { scrollChildIntoViewH, usePrefersReducedMotion } from "./utils";

/**
 * Single-select chips in a horizontal rail. Active state is shown with color +
 * check glyph (never color alone), chips are plain buttons (Tab + Enter/Space
 * work without gestures) and the selection is scrolled into view after change.
 */
export function ChipRail({ label, options, value, onChange }) {
  const railRef = useRef(null);
  const itemRefs = useRef({});
  const reduced = usePrefersReducedMotion();
  const pending = useRef(null);

  useEffect(() => {
    if (pending.current == null) return;
    scrollChildIntoViewH(railRef.current, itemRefs.current[pending.current], {
      reduced,
    });
    pending.current = null;
  }, [value, reduced]);

  return (
    <Rail ref={railRef} label={label} visibleLabel className="chip-rail">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            ref={(el) => {
              itemRefs.current[o.id] = el;
            }}
            className={"ui-btn chip" + (active ? " active" : "")}
            aria-pressed={active}
            onClick={() => {
              pending.current = o.id;
              onChange(o.id);
            }}
          >
            <span className="chip-check" aria-hidden="true">
              {active ? "✓" : "·"}
            </span>
            {o.label}
          </button>
        );
      })}
    </Rail>
  );
}
