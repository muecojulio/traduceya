# Seguridad de TraduceYa

Resumen de las medidas activas, de lo que se revisó y de lo que queda abierto.

## Cómo reportar un problema

Abre un issue en el repositorio, o escribe a quien opere el dominio si se trata
de una copia desplegada. Si el fallo permite leer datos de otra persona, mándalo
por un canal privado y espera antes de publicarlo.

## Qué se revisó

| Revisión | Cómo se pasa | Estado |
| --- | --- | --- |
| Dependencias vulnerables | `npm audit` | 0 avisos |
| Generador de QR propio | `python3 tools/qr-check.py` (compara contra la librería `qrcode` de Python) | 256/256 matrices idénticas |
| Validación de entradas de la API | peticiones con idioma inventado, foto que no es imagen, JSON roto y exceso de tamaño | todas 400 |
| Límite de peticiones | 41 peticiones seguidas desde una IP | 429 a partir de la 41 |
| Cabeceras y CSP | `curl -I` sobre el build de producción | verificado abajo |

## Cabeceras

`next.config.mjs` pone las que aplican a todo (documentos y estáticos):
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-origin`, `X-DNS-Prefetch-Control` y
`X-Permitted-Cross-Domain-Policies`.

`middleware.js` pone las que cambian por petición:

- **Content-Security-Policy con nonce.** `script-src 'self' 'nonce-…'
  'sha256-…'`, sin `'unsafe-inline'`. Cada respuesta lleva un nonce distinto y
  Next firma con él los guiones que genera. El único guion en línea propio (el
  arranque sin destello de `lib/appearance.js`) se autoriza por su hash SHA-256,
  calculado una vez por instancia.
  - Consecuencia: `app/layout.js` declara `dynamic = "force-dynamic"`. En una
    página prerenderada Next serviría el HTML del build, sin nonce, y el
    navegador bloquearía la hidratación. El service worker cachea la shell, así
    que las visitas siguientes no pagan ese render.
  - `style-src` conserva `'unsafe-inline'` porque Next inyecta sus propios
    estilos; no interpolamos texto del usuario en ninguna regla.
  - `connect-src` conserva `https:` por el Traductor integrado de Chrome, que
    descarga sus modelos desde orígenes de Google que no son estables de fijar.
    Es el riesgo que se acepta a cambio de que esa función exista.
- **Strict-Transport-Security** (2 años, `includeSubDomains`, `preload`), solo
  fuera de desarrollo.
- `frame-ancestors` es `'none'` en producción y `'self' https:` en desarrollo
  para que el preview de Arena pueda incrustar la app.

## Validación de entradas

Todo lo que entra por `/api` pasa por `lib/safe.js` antes de tocar un motor
externo o la caché:

- `safeLang()` — el idioma tiene que estar en la lista de `lib/langs.js`. Un
  `target` inventado ya no acaba dentro de una URL de terceros ni como clave de
  caché.
- `safeText()` — recorte, sin caracteres de control.
- `safeImage()` — `data:image/(png|jpeg|webp);base64,` con alfabeto base64
  válido y tope de tamaño ya decodificado. Una "foto" que no es imagen no se
  reenvía a nadie.
- `readJson()` — tope de bytes por ruta, con `Content-Length` como primer filtro.

Los errores que devuelve la API son mensajes fijos: no se filtra el texto de una
excepción interna al navegador.

## Límite de peticiones

`lib/limit.js` cuenta peticiones por IP en memoria de la instancia. La IP se
toma de `x-vercel-forwarded-for` cuando existe (lo pone la plataforma y no se
puede pisar) y si no de la **última** entrada de `x-forwarded-for`, que es la
que añade el proxy de confianza: la primera la escribe quien llama y serviría
para saltarse el tope o para llenar el `Map` de claves ajenas.

Es un freno, no una frontera: cada función serverless tiene su contador. Si un
día hace falta de verdad, el sitio es un KV.

## Claves

`GROQ_API_KEY`, `OCR_SPACE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` y
`CLOUDFLARE_API_TOKEN` se leen solo en el servidor, nunca se envían al
navegador y no están en el código. Sin ellas la app sigue funcionando con los
motores públicos.

## Sin registros

La app no escribe logs de texto, voz ni fotos. Lo único que toca el servidor
además de la propia traducción es la IP, en memoria y durante un minuto, para el
límite de peticiones. La caché de traducciones (12 h, 200 entradas) vive en la
memoria de la función y se pierde al reiniciarse.

## Superficie

Dos rutas de API (`/api/translate`, `/api/photo`) y ninguna base de datos. Se
retiró `/api/define`, que no llamaba nadie y sólo sumaba una salida a un
servicio externo.

## Comprobación rápida

```bash
npm audit                                    # dependencias
npm run build && npm start                   # y en otra terminal:
curl -sI http://localhost:3000/ | grep -i 'content-security-policy\|strict-transport'
curl -s -X POST http://localhost:3000/api/translate \
  -H 'Content-Type: application/json' -d '{"text":"hola","target":"<script>"}'   # 400
```
