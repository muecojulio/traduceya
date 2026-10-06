/**
 * Set de íconos SVG en línea (trazo, 24×24, currentColor).
 * Sustituyen a los emojis: no pesan en red, heredan los colores del CSS,
 * se ven nítidos en cualquier densidad y se pueden animar por estado.
 */
const ICONS = {
  mic: (
    <>
      <path d="M12 3.2a3.1 3.1 0 0 1 3.1 3.1v4.4a3.1 3.1 0 0 1-6.2 0V6.3A3.1 3.1 0 0 1 12 3.2Z" />
      <path d="M5.6 10.6a6.4 6.4 0 0 0 12.8 0" />
      <path d="M12 17v3.6M9 20.8h6" />
    </>
  ),
  cam: (
    <>
      <path d="M4 8.6c0-1.4 1-2.4 2.3-2.4h1.5l1.2-1.9h6l1.2 1.9h1.5C19 6.2 20 7.2 20 8.6v7.8c0 1.4-1 2.4-2.3 2.4H6.3C5 18.8 4 17.8 4 16.4Z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  bolt: <path d="M13.4 2.8 5.4 13.4h4.9l-1 7.8 8.3-11.4h-5.3Z" />,
  sliders: (
    <>
      <path d="M4 8.4h8.6M18.4 8.4H20M4 15.6h3.6M13.4 15.6H20" />
      <circle cx="15.4" cy="8.4" r="2" />
      <circle cx="10" cy="15.6" r="2" />
    </>
  ),
  copy: (
    <>
      <path d="M9.4 9h8.2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-8.2c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2Z" />
      <path d="M5.6 15H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v.6" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.6h3.2L12 5.4v13.2L7.2 14.4H4Z" />
      <path d="M15.4 9.4a4 4 0 0 1 0 5.2M18.2 6.8a7.8 7.8 0 0 1 0 10.4" />
    </>
  ),
  swap: (
    <>
      <path d="M7.8 5.4 4.2 9l3.6 3.6M4.2 9h15M16.2 18.6 19.8 15l-3.6-3.6M19.8 15h-15" />
    </>
  ),
  scan: (
    <>
      <path d="M4 9.4V6.6C4 5.2 5.1 4 6.5 4h2.8M14.7 4h2.8C18.9 4 20 5.2 20 6.6v2.8" />
      <path d="M20 14.6v2.8c0 1.4-1.1 2.6-2.5 2.6h-2.8M9.3 20H6.5C5.1 20 4 18.8 4 17.4v-2.8" />
      <path d="M4.8 12h14.4" />
    </>
  ),
  translate: (
    <>
      <path d="M3.6 6.6h8.6M7.9 4.4v2.2" />
      <path d="M10.2 6.6C9.6 10.4 7 13.2 3.4 14.4M5.8 10.8c1.5 2.3 3.5 3.7 6 4.3" />
      <path d="M12.8 20l3.7-9h.4l3.7 9M14.3 17.2h4.8" />
    </>
  ),
  spark: <path d="M12 4.2l1.5 4.3 4.3 1.5-4.3 1.5L12 15.8l-1.5-4.3L6.2 10l4.3-1.5Z" />,
  close: <path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6" />,
  check: <path d="M5 12.6 9.6 17 19 6.6" />,
  bulb: (
    <>
      <path d="M9.4 17.4h5.2M10.4 20.4h3.2" />
      <path d="M12 3.4a6.2 6.2 0 0 0-3.5 11.3l.7 1.5h5.6l.7-1.5A6.2 6.2 0 0 0 12 3.4Z" />
    </>
  ),
  image: (
    <>
      <path d="M4 8.8C4 6.8 5.1 5.6 7 5.6h10c1.9 0 3 1.2 3 3.2v6.4c0 2-1.1 3.2-3 3.2H7c-1.9 0-3-1.2-3-3.2Z" />
      <path d="M6.6 17l3.6-3.4 2.6 2.4 2.2-1.8 2.4 2.2" />
      <circle cx="8.6" cy="9.8" r="1.4" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.4M8 10.8l4 4 4-4" />
      <path d="M4.8 18.4c0 .9.7 1.6 1.6 1.6h11.2c.9 0 1.6-.7 1.6-1.6" />
    </>
  ),
};

export function Icon({ name, size = 20, strokeWidth = 1.7, className = "", ...rest }) {
  return (
    <svg
      className={`ico${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICONS[name] || null}
    </svg>
  );
}
