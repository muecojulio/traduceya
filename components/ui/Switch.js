"use client";

/**
 * Checkbox input exposed as a switch (role="switch" + aria-checked), with a
 * thumb animation and a stretched-thumb "grab" feedback. State is conveyed by
 * position + color + label, not by animation alone.
 */
export function Switch({ id, checked, onChange, children, ...rest }) {
  return (
    <label className="switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        {...rest}
      />
      <span className="track" aria-hidden="true" />
      <span className="switch-text">{children}</span>
    </label>
  );
}
