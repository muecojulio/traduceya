# Sistema de interacciones — `components/ui/`

Kit pequeño y sin dependencias externas para el micro-sistema de interacción de TraduceYa.
Reutiliza las clases visuales existentes (`.primary/.ghost/.mic/.chip/.arrow-btn`) para no
duplicar estilos: los componentes aportan comportamiento y semántica accesible, el CSS vive
en `app/globals.css` (sección "UI kit").

| Componente | Qué hace |
| --- | --- |
| `Btn` + `useRun` | Estados `idle → loading → ok/err` con spinner, ✓/!, `aria-busy`, bloqueo de doble envío, shake discreto en error y `is-ok` glow en éxito. |
| `Dock`, `TabPanel`, `useTabSwipe` | Dock inferior como `role=tablist` real: `aria-selected`, `aria-controls`, flechas + Home/End con roving tabindex, píldora indicadora animada, y swipe horizontal (ratio 1.2 + umbral/velocidad, excluye controles y carriles) para cambiar sección. Paneles animan su entrada (~200 ms). |
| `Rail` | Scroll horizontal nativo con momentum y `scroll-snap` moderado; scrollbar oculta visualmente; fades de desbordamiento solo cuando hay contenido fuera de vista (medido con scroll + ResizeObserver + MutationObserver); pista "Desliza" una vez por sesión. |
| `ChipRail` | Chips de selección única: `aria-pressed`, ✓ visible (no solo color), grupo nombrado, y la opción activa se centra con scroll suave (inmediato con `prefers-reduced-motion`). |
| `Combobox` | Combobox editable con búsqueda: filtra ignorando mayúsculas y diacríticos, `aria-expanded`/`aria-activedescendant`/`aria-selected`, flechas + Home/End + Enter + Escape, clic fuera cierra, "sin coincidencias" anunciado, altura limitada con scroll contenido. |
| `Switch` | Checkbox expuesto como `role=switch` + `aria-checked`, thumb que se estira al presionar. |
| `Collapse` | Panel plegable animado (`grid-template-rows`), `aria-expanded` + `inert` cuando está cerrado. |
| `SwipeActions` | Deslizar tarjeta para revelar acciones (solo puntero táctil, eje bloqueado, clic tras arrastre anulado, umbral 45 % o flick rápido). Botón ⋯ siempre visible como alternativa, panel `inert`+`aria-hidden` al estar oculto y acciones inline en escritorio. |
| `utils.js` | `usePrefersReducedMotion`, `useFinePointer`, normalizador de búsqueda, `scrollChildIntoViewH`, `copyText` con fallback. |

Reglas transversales (en `globals.css`): `prefers-reduced-motion` corta animaciones y
`scroll-snap` suavizado; foco visible global; objetivos táctiles ≥ 44 px;
`touch-action: manipulation` en controles. El zoom del navegador no se bloquea.
