export const metadata = { title: "Privacidad — TraduceYa" };

const CAMBIOS = [
  [
    "9 de octubre de 2026",
    "El código QR de «abrir la app en otro celular» se dibuja en tu dispositivo: ya no se pide a un servicio externo, así que nadie más ve la dirección de tu copia. Se documentan las medidas de seguridad y se retira una ruta de API que no se usaba.",
  ],
  [
    "30 de septiembre de 2026",
    "Primera versión publicada de esta política.",
  ],
];

export default function Privacidad() {
  return (
    <main className="prose">
      <h1>Política de privacidad</h1>
      <p>
        <strong>Última actualización: 9 de octubre de 2026.</strong>
      </p>

      <p>
        TraduceYa es un traductor de viaje. Esta página explica, sin rodeos, qué
        datos tocan el servidor, adónde van y cuánto duran.
      </p>

      <h2>Lo corto</h2>
      <ul>
        <li>No hay cuentas, ni correo, ni publicidad, ni analítica, ni cookies.</li>
        <li>
          Lo que dices y lo que fotografías se usa solo para traducirlo en ese
          momento. No se guarda en ninguna base de datos.
        </li>
        <li>
          Tus ajustes (tema, color, voz, idiomas) viven en tu navegador y no
          salen de él.
        </li>
      </ul>

      <h2>Qué se procesa</h2>
      <ul>
        <li>
          <strong>Texto y voz.</strong> Lo que dictas se transcribe en tu
          navegador y el texto resultante se envía para traducirlo. El audio no
          se sube a este servidor.
        </li>
        <li>
          <strong>Fotos.</strong> La foto del menú o del cartel, reducida en tu
          propio dispositivo antes de enviarse, y solo cuando tocas «Tomar foto»
          o eliges una imagen de la galería.
        </li>
        <li>
          <strong>Preferencias.</strong> Tema, color de acento, voz, tono e
          idiomas, guardados en <code>localStorage</code> de tu navegador.
        </li>
        <li>
          <strong>Datos técnicos mínimos.</strong> La dirección IP, que se usa
          únicamente en memoria para limitar el número de peticiones por minuto
          y que nadie abuse del servidor. No se escribe en ningún registro.
        </li>
      </ul>

      <h2>Adónde se envía</h2>
      <p>
        La traducción pasa por el servidor de esta app y de ahí a un motor de
        traducción. Se prueban en este orden, y se usa el primero que responda:
      </p>
      <ol>
        <li>El traductor integrado del navegador, si lo tiene (no sale de él).</li>
        <li>Groq, Cloudflare Workers AI u OCR.space, si quien opera esta copia configuró esas claves.</li>
        <li>
          Motores públicos sin registro: Google (gtx), Lingva, MyMemory, Mozhi y
          LibreTranslate.
        </li>
      </ol>
      <p>
        A esos motores les llega el texto que quieres traducir (o la foto, en el
        caso de OCR.space y Groq) y el idioma de destino. Es lo mínimo para que
        puedan trabajar. Si usas un motor público, ese proveedor verá el texto de
        esa frase: evita dictar datos sensibles (nombres completos, números de
        tarjeta, direcciones) si no hace falta.
      </p>
      <p>
        <strong>El código QR ya no sale de tu dispositivo.</strong> Antes se
        pedía a un servicio de terceros (<code>api.qrserver.com</code>), que veía
        la dirección de tu copia en cada visita. Ahora el código se dibuja en el
        navegador, sin red y sin intermediarios.
      </p>

      <h2>Qué no hacemos</h2>
      <ul>
        <li>No pedimos cuenta ni correo electrónico.</li>
        <li>No usamos publicidad ni rastreadores de marketing.</li>
        <li>No guardamos un historial permanente de tus frases ni de tus fotos.</li>
        <li>No vendemos ni cedemos datos a nadie.</li>
        <li>No perfilamos ni guardamos un identificador tuyo entre visitas.</li>
      </ul>

      <h2>Cuánto dura cada cosa</h2>
      <ul>
        <li>
          <strong>Caché del servidor:</strong> hasta 12 horas y como máximo 200
          traducciones, solo en memoria, para no repetir la misma frase.
          Desaparece al reiniciarse la función.
        </li>
        <li>
          <strong>Sesión del navegador:</strong> las traducciones de la pestaña
          actual, hasta que la cierras.
        </li>
        <li>
          <strong>Preferencias:</strong> en <code>localStorage</code>, hasta que
          las cambies o borres los datos del sitio.
        </li>
        <li>
          <strong>Contador de peticiones:</strong> la IP se olvida al minuto.
        </li>
      </ul>

      <h2>Permisos del dispositivo</h2>
      <p>
        El micrófono se pide al empezar una conversación y la cámara al abrirla;
        ninguno se usa antes ni después. La linterna, la vibración y mantener la
        pantalla encendida se usan solo mientras esas funciones están activas.
        Puedes revocarlos cuando quieras en los Ajustes del sistema.
      </p>

      <h2>Seguridad</h2>
      <p>Medidas activas en esta copia:</p>
      <ul>
        <li>
          Todo el tráfico va por HTTPS y se fuerza con HSTS.
        </li>
        <li>
          Una <em>Content Security Policy</em> con un código de un solo uso por
          respuesta: el navegador solo ejecuta los guiones firmados por la app,
          así que un texto traducido no puede convertirse en código.
        </li>
        <li>
          Cabeceras de aislamiento y anti-incrustación (<code>X-Frame-Options</code>,{" "}
          <code>Cross-Origin-Opener-Policy</code>, <code>nosniff</code>, política
          de permisos reducida al micrófono y la cámara).
        </li>
        <li>
          Lo que llega por la red se valida contra listas cerradas: idiomas
          admitidos, fotos que de verdad son imágenes y tamaños máximos. Lo que
          no encaja se rechaza antes de tocar ningún motor.
        </li>
        <li>
          Límite de peticiones por minuto para que nadie agote el servicio.
        </li>
        <li>
          Las claves de los motores viven solo en el servidor. Nunca llegan al
          navegador ni se escriben en el código.
        </li>
      </ul>
      <p>
        Ninguna medida elimina el riesgo por completo: si dictas algo a un motor
        público, ese proveedor lo procesa. Para usos delicados, configura tus
        propias claves.
      </p>

      <h2>Menores</h2>
      <p>
        La app no está dirigida a menores de 13 años ni recoge datos de ellos a
        propósito.
      </p>

      <h2>Cambios en esta política</h2>
      <dl>
        {CAMBIOS.map(([fecha, texto]) => (
          <div key={fecha}>
            <dt>{fecha}</dt>
            <dd>{texto}</dd>
          </div>
        ))}
      </dl>

      <h2>Contacto y responsable</h2>
      <p>
        Si desplegaste esta copia, el responsable de los datos es quien opera el
        dominio: esta app de ejemplo no incluye un buzón central. Si la abriste
        desde un dominio ajeno, dirige ahí tus consultas de privacidad, incluidas
        las de acceso, rectificación y supresión.
      </p>
      <p>
        <a href="/">Volver a TraduceYa</a>
      </p>
    </main>
  );
}
