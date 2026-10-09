"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const VARIANTS = {
  primary: "primary",
  ghost: "ghost",
  mic: "mic",
  icon: "arrow-btn",
  plain: "ui-plain",
};

/**
 * Feedback state machine for an async action: idle → loading → ok/err → idle.
 * Use with <Btn run={feed}> to wire spinner, ✓/! mark, aria-busy and double-submit lock.
 */
export function useRun(fn, { okMs = 1300, errMs = 2200 } = {}) {
  const [state, setState] = useState("idle");
  const stateRef = useRef("idle");
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef(0);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
      clearTimeout(timer.current);
    },
    []
  );

  const run = useCallback(
    async (...args) => {
      if (stateRef.current === "loading") return; // avoid duplicate submits
      clearTimeout(timer.current);
      stateRef.current = "loading";
      setState("loading");
      try {
        await fnRef.current?.(...args);
        stateRef.current = "ok";
        if (alive.current) setState("ok");
        timer.current = setTimeout(() => {
          stateRef.current = "idle";
          if (alive.current) setState("idle");
        }, okMs);
      } catch {
        stateRef.current = "err";
        if (alive.current) setState("err");
        timer.current = setTimeout(() => {
          stateRef.current = "idle";
          if (alive.current) setState("idle");
        }, errMs);
      }
    },
    [okMs, errMs]
  );

  return { state, run, busy: state === "loading" };
}

function Slot({ state }) {
  if (state === "loading") return <span className="ui-spin" aria-hidden="true" />;
  if (state === "ok")
    return (
      <span className="ui-mark ok" aria-hidden="true">
        ✓
      </span>
    );
  if (state === "err")
    return (
      <span className="ui-mark bad" aria-hidden="true">
        !
      </span>
    );
  return <span className="ui-mark keep" aria-hidden="true">·</span>;
}

/** Onda que sale del punto exacto del toque. Un <i> por toque, se limpia solo. */
function useRipple() {
  const ref = useRef(null);
  return useCallback(
    (event) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const size = Math.max(box.width, box.height) * 1.6;
      const wave = document.createElement("i");
      wave.className = "ripple";
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${event.clientX - box.left - size / 2}px`;
      wave.style.top = `${event.clientY - box.top - size / 2}px`;
      el.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove(), { once: true });
      setTimeout(() => wave.remove(), 900); // por si la animación no llega a correr
    },
    []
  );
}

/**
 * Button with consistent microinteractions + async feedback states.
 * Keeps the app's legacy look classes (.primary/.ghost/.mic/.arrow-btn).
 */
export function Btn({
  variant = "ghost",
  run,
  loading,
  disabled,
  className = "",
  children,
  type = "button",
  onPointerDown,
  ...rest
}) {
  const ref = useRef(null);
  const ripple = useRipple();
  const state = run?.state || (loading ? "loading" : "idle");
  const isLoading = state === "loading";
  const hasSlot = !!run; // reserve icon slot only for stateful buttons → stable width
  const cls = [
    "ui-btn",
    VARIANTS[variant] || variant,
    state === "ok" ? "is-ok" : "",
    state === "err" ? "is-err" : "",
    isLoading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      <span className="ui-btn-in">
        {hasSlot ? (
          <span className="ui-slot">
            <Slot state={state} />
          </span>
        ) : null}
        <span className="ui-btn-label">{children}</span>
      </span>
    </button>
  );
}
