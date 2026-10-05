"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { norm } from "./utils";

/**
 * Editable combobox with search: filters while typing (case- and accent-insensitive),
 * full listbox semantics (aria-expanded / aria-activedescendant / aria-selected),
 * Arrow keys + Home/End + Enter + Escape, click-outside close, "no matches"
 * message, limited height with its own scroll (overscroll contained so the page
 * never scrolls by accident). 44px+ touch targets.
 */
export function Combobox({ label, options, value, onChange, placeholder = "Buscar…", id }) {
  const uid = useId();
  const inputId = id || `${uid}-input`;
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const optRefs = useRef([]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options;
    return options.filter(
      (o) => norm(o.label).includes(q) || norm(o.sub || "").includes(q)
    );
  }, [options, query]);

  const openList = useCallback(() => {
    setQuery("");
    const idx = options.findIndex((o) => o.value === value);
    setActive(idx < 0 ? 0 : idx);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [options, value]);

  const closeList = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // on open (and on every query change) keep the active row on the selected option
  useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx < 0 ? 0 : idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  useEffect(() => {
    if (open) optRefs.current[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active, open]);

  // click outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) closeList();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, closeList]);

  const pick = (o) => {
    if (!o) return;
    onChange(o.value);
    closeList();
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    const n = filtered.length;
    const move = (d) => {
      if (!n) return;
      setActive((a) => (a + d + n) % n);
      e.preventDefault();
    };
    switch (e.key) {
      case "ArrowDown":
        if (!open) openList();
        else move(1);
        e.preventDefault();
        break;
      case "ArrowUp":
        if (!open) openList();
        else move(-1);
        e.preventDefault();
        break;
      case "Home":
        if (open) {
          setActive(0);
          e.preventDefault();
        }
        break;
      case "End":
        if (open && n) {
          setActive(n - 1);
          e.preventDefault();
        }
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          if (n) pick(filtered[active]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        }
        break;
      case "Tab":
        if (open) closeList();
        break;
      default:
    }
  };

  return (
    <div
      className={"combo" + (open ? " open" : "")}
      ref={rootRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) closeList();
      }}
    >
      <label className="small" htmlFor={inputId}>
        {label}
      </label>
      <div className="combo-field">
        <input
          ref={inputRef}
          id={inputId}
          className="combo-input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck="false"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={
            open && filtered[active] ? `${uid}-opt-${active}` : undefined
          }
          aria-describedby={`${uid}-status`}
          value={open ? query : selected ? selected.label : ""}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="combo-toggle"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => (open ? closeList() : openList())}
        >
          <span className="chev">▾</span>
        </button>
      </div>
      <span id={`${uid}-status`} className="sr-only" role="status">
        {open
          ? filtered.length
            ? `${filtered.length} ${filtered.length === 1 ? "opción disponible" : "opciones disponibles"}`
            : `Sin coincidencias para ${query}`
          : ""}
      </span>
      {open ? (
        <ul className="combo-list" id={listId} role="listbox" aria-label={label}>
          {filtered.length ? (
            filtered.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={String(o.value) || i}
                  id={`${uid}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  className={"combo-opt" + (i === active ? " active" : "")}
                  ref={(el) => {
                    optRefs.current[i] = el;
                  }}
                  onMouseDown={(e) => e.preventDefault()} // keep focus in the input; taps still deliver click
                  onClick={() => pick(o)}
                  onPointerEnter={() => setActive(i)}
                >
                  <span className="co-main">{o.label}</span>
                  {o.sub ? <span className="co-sub">{o.sub}</span> : null}
                  <span className="co-check" aria-hidden="true">
                    {isSel ? "✓" : ""}
                  </span>
                </li>
              );
            })
          ) : (
            <li className="combo-empty">Sin coincidencias para «{query}»</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
