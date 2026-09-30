# TraduceYa

App web instalable para viaje: habla o apunta la cámara y sale la traducción (incluye japonés).

## Qué hace

- Hablar: un botón. Ida y vuelta para conversar.
- Cámara: se abre en la app, linterna, foto del menú y lector grande.
- Mostrar al mesero: pantalla con letras enormes.
- Frases: cuenta, alergias, baño, ayuda. Funcionan sin internet.
- App: QR e instalar en la pantalla de inicio.
- Ajuste a pantalla completa por dispositivo; pestañas fijas abajo (safe-area).

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
6. Mozhi / espejos (pública)
7. MyMemory (pública)
8. LibreTranslate (pública; [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate))

Fotos: Groq visión o OCR.space.
Definiciones cortas en inglés: [dictionaryapi.dev](https://dictionaryapi.dev) vía `/api/define?q=`.

Variables:

- GROQ_API_KEY (recomendada)
- OCR_SPACE_API_KEY (opcional)
- CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN (opcional)

Nunca subas esas keys a GitHub.

## Runtime

Node.js `24.x` (`engines` en package.json y `.nvmrc`).

## Privacidad

Ruta `/privacidad`.

## Publicar

1. Repo privado `traduceya`.
2. En https://vercel.com/new importa el repo.
3. Pega las variables y Deploy.
4. Abre la URL en el celular e instálala.

## Límites

- Vercel Hobby: uso personal, no comercial.
- La voz funciona mejor en Chrome o Edge.
- La linterna no enciende en todos los iPhone.
- No es un intérprete de auriculares en tiempo real.
