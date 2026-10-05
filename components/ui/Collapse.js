"use client";

import { useId, useState } from "react";

/**
 * Animated disclosure: grid-rows 0fr→1fr keeps the open/close smooth without
 * measuring heights, focusable state and announcements stay in sync
 * (aria-expanded + inert when closed so links inside are skipped while hidden).
 */
export function Collapse({ label, defaultOpen = false, children }) {
  const uid = useId();
  const btnId = `${uid}-btn`;
  const bodyId = `${uid}-body`;
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"collapse" + (open ? " open" : "")}>
      <button
        type="button"
        id={btnId}
        className="ui-btn ghost collapse-btn"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <span className="chev" aria-hidden="true">
          ▾
        </span>
      </button>
      <div
        id={bodyId}
        role="region"
        aria-labelledby={btnId}
        className="collapse-body"
      >
        <div className="collapse-inner" inert={open ? undefined : true}>
          <div className="collapse-pad">{children}</div>
        </div>
      </div>
    </div>
  );
}
