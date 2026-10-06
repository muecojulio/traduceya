# TraduceYa

App web instalable para viaje: habla o apunta la cámara y sale la traducción (incluye japonés).

## Qué hace

- Hablar: un botón. Ida y vuelta para conversar.
- Cámara: se abre en la app, linterna, foto del menú y lector grande.
- Mostrar al mesero: pantalla con letras enormes.
- Frases: cuenta, alergias, baño, ayuda. Funcionan sin internet.
- App: QR e instalar en la pantalla de inicio.
- Ajuste a pantalla completa por dispositivo; pestañas fijas abajo (safe-area).

## Look & feel (capa visual)

Todo el estilo vive en `app/globals.css`, organizado por secciones y con tokens en `:root`:

- **Acento por contexto.** El color no es fijo: `.shell[data-tab]` cambia `--accent`,
  y lo siguen botones, bordes, anillos de foco, la píldora del dock y los orbes del fondo.
  Hablar = turquesa, cámara = ámbar, frases = menta, ajustes = celeste.
- **Fondo ambiental.** Tres orbes de color que derivan lento, grano fino (SVG en línea) y una
  viga de luz que cruza cada ~18 s. Sin `filter: blur` sobre bloques grandes para no castigar
  la GPU del celular.
- **Tipografía.** Space Grotesk variable autohospedada (`@fontsource-variable/space-grotesk`,
  ~22 kB el subconjunto latin) para marca, etiquetas y textos grandes; el cuerpo y el CJK
  siguen con la pila del sistema. No se pide nada a Google Fonts: la CSP (`font-src 'self'`)
  se respeta y la tipografía funciona offline.
- **Profundidad.** Paneles y tarjetas con degradado + `hairline` iluminada arriba y sombra tintada;
  el borde superior usa una máscara con el acento.
- **Feedback.** Anillos y barras de ecualizador mientras escucha, esqueleto con brillo mientras
  llega la traducción, entrada palabra por palabra, destello al aterrizar el texto, HUD de cámara
  con línea de escaneo, barra de progreso indeterminada, y estados ✓/! en cada botón.
- **Accesibilidad.** `prefers-reduced-motion` congela orbes, ecualizadores, escaneo y grano;
  los estados nunca dependen solo del color; objetivos táctiles ≥ 44 px; zoom del navegador libre.

## Apariencia: noche/día y acento por idioma

Dos ajustes, conmutables en **Ajustes** (pestaña `instalar`):

- **Apariencia**: `Noche` (por defecto) o `Día`, en `localStorage` como `ty-theme`.
  Se aplica con `html[data-theme="dia"]` (tokens claros en `app/globals.css`, sección 13,
  con contraste AA y los orbes del fondo en `multiply`).
- **Color de acento**: `Por pestaña` (turquesa, ámbar, menta, celeste) o `Por idioma`,
  y entonces el acento sale del idioma que lees. En `localStorage` como `ty-tint`,
  aplicado con `.shell[data-tint="idioma"][data-dest="ja-JP"]`.

El tema y el tinte se fijan **antes del primer pintado** con un script en línea
(`lib/appearance.js`) que lee `localStorage` y los parámetros del enlace: al abrir la app
no hay destello de claro sobre oscuro. React los mantiene al día después.

El modo mesero (la pantalla enorme para enseñar al mesero) se queda oscuro a propósito:
es una pantalla que se enseña de lejos.

## Parámetros de URL

Enlaces directos a un estado concreto. Son de un solo uso: **no se guardan** en
`localStorage` y la app no los reescribe en la barra de direcciones, así que compartir
un enlace no cambia los ajustes de quien lo abre.

| Parámetro | Valores | Qué hace |
| --- | --- | --- |
| `tab` | `voz`, `foto`, `frases`, `instalar` | Abre esa pestaña |
| `idioma` | `ja`, `ja-JP`, `en-US`… | Idioma que se lee (destino) |
| `oye` | `es`, `es-MX`, `ja`… | Idioma que se escucha (origen) |
| `tema` | `dia`, `noche` | Modo claro u oscuro |
| `tinte` | `pestana`, `idioma` | De dónde sale el color de acento |

Ejemplos:

- `/?tab=instalar&tema=dia` — Ajustes en modo claro.
- `/?tab=instalar&tema=dia&tinte=idioma&idioma=ja` — Ajustes claro con acento japonés.
- `/?tab=foto&oye=es-MX&idioma=ja-JP` — Cámara, de español a japonés.
- `/?tab=frases&idioma=en-US&tinte=idioma` — Frases con acento del inglés.

El código corto (`ja`) se resuelve al idioma completo (`ja-JP`); lo que no se reconoce se
ignora en silencio para no romper el arranque.

## Herramientas

`node tools/vista-previa/build.mjs` escribe `tools/vista-previa/vista-previa.svg`: una
maqueta de las cuatro apariencias (noche/día × por pestaña/por idioma). Sin dependencias:
solo Node, para poder mirarla o rasterizarla con lo que tengas a mano.

## Base de datos e índices

No hay base de datos. Las frases van en el cliente y la caché es memoria + sessionStorage.
No aplica crear índices SQL. Si más adelante hay historial persistente, indexar `created_at` y el par de idiomas.

## Caché

- Memoria en servidor (TTL 12 h, máx. 200 entradas) para traducciones repetidas.
- sessionStorage en el navegador.
- Service worker para estáticos (no cachea POST de `/api`).

## APIs

Orden de traducción (las keys no se quitan):

1. Traductor del navegador (si existe)
2. Groq (recomendada, con key)
3. Cloudflare Workers AI (opcional, con key)
4. Google gtx (pública, sin registro)
5. Lingva (pública; proyecto [thedaviddelta/lingva-translate](https://github.com/thedaviddelta/lingva-translate))
6. MyMemory (pública)
7. Mozhi / espejos (pública)
8. LibreTranslate (pública; [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate))

Si un motor devuelve error, HTML o vacío, se ignora y sigue el siguiente de la lista.

Fotos: Groq visión o OCR.space.
Definiciones cortas en inglés: [dictionaryapi.dev](https://dictionaryapi.dev) vía `/api/define?q=`.

Variables:

- GROQ_API_KEY (recomendada)
- OCR_SPACE_API_KEY (opcional)
- CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (opcional)

Nunca subas esas keys a GitHub.

## Runtime

Node.js `24.x` (`engines` en package.json y `.nvmrc`). Es la versión compatible con
Vercel (el plan Hobby ya no acepta Node 20 desde octubre de 2026).

## Publicar en Vercel

1. Sube el repo a GitHub (rama `main`).
2. En https://vercel.com/new importa el repo. Vercel detecta Next.js solo
   (`vercel.json` también lo declara).
3. No hace falta configurar Build Command ni Output Directory: usa `npm install`
   y `npm run build`.
4. Variables (opcionales, se pueden dejar vacías):
   `GROQ_API_KEY`, `OCR_SPACE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
   Sin keys la app usa los motores públicos de respaldo.
5. Deploy. El build no necesita ninguna variable: no hay pasos que fallen si faltan.

Notas de despliegue:

- `package-lock.json` está versionado para que Vercel instale exactamente lo mismo que en local.
- Las rutas de API declaran `runtime = "nodejs"` y `maxDuration` (hasta 60 s) para que
  las llamadas a los motores no mueran con timeout en el plan Hobby.
- Cada motor externo tiene un límite de tiempo propio (7 s texto, 45 s foto): si un
  espejo público se cuelga, se pasa al siguiente en vez de tumbar la función.
- Los iconos PWA se sirven como PNG (`/icon-192.png`, `/icon-512.png`,
  `/icon-maskable-512.png`, `/apple-icon.png`) además del SVG.

## Privacidad

Ruta `/privacidad`.

## Publicar (resumen)

1. Repo `traduceya` en GitHub.
2. En https://vercel.com/new importa el repo.
3. Pega las variables (si las tienes) y Deploy.
4. Abre la URL en el celular e instálala.

## Límites

- Vercel Hobby: uso personal, no comercial.
- La voz funciona mejor en Chrome o Edge.
- La linterna no enciende en todos los iPhone.
- No es un intérprete de auriculares en tiempo real.
