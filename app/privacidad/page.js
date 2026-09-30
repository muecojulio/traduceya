export const metadata = { title: "Privacidad — TraduceYa" };

export default function Privacidad() {
  return (
    <main className="prose">
      <h1>Política de privacidad</h1>
      <p>Última actualización: 30 de septiembre de 2026.</p>
      <p>
        TraduceYa es un traductor de viaje. Esta página describe qué datos se usan y
        para qué. No vendemos datos.
      </p>
      <h2>Qué se procesa</h2>
      <ul>
        <li>Texto o audio que tú envías para traducir.</li>
        <li>Fotos que tú tomas o eliges para leer un menú o cartel.</li>
        <li>Preferencias de voz e idioma, guardadas solo en tu dispositivo.</li>
      </ul>
      <h2>Dónde se envía</h2>
      <p>
        La traducción puede pasar por el servidor de la app y, según disponibilidad,
        por motores con key tuya (Groq, Cloudflare, OCR.space) o por APIs públicas
        de respaldo (Lingva, MyMemory, LibreTranslate, espejos de traducción).
        Las fotos se envían solo cuando tocas capturar o eliges una imagen.
      </p>
      <h2>Qué no hacemos</h2>
      <ul>
        <li>No pedimos cuenta ni correo.</li>
        <li>No usamos publicidad ni rastreadores de marketing.</li>
        <li>No guardamos un historial permanente de tus frases o fotos en una base de datos.</li>
      </ul>
      <h2>Caché</h2>
      <p>
        Hay caché temporal en memoria del servidor y en tu sesión del navegador para
        no repetir la misma traducción. Se borra sola con el tiempo o al cerrar la pestaña.
      </p>
      <h2>Permisos del celular</h2>
      <p>
        Micrófono y cámara se piden solo para hablar o leer texto en foto. Se pueden
        revocar en Ajustes del sistema.
      </p>
      <h2>Contacto</h2>
      <p>
        Si desplegaste esta copia, el responsable es quien opera el dominio. Esta
        app de ejemplo no recolecta un buzón central.
      </p>
      <p>
        <a href="/">Volver a TraduceYa</a>
      </p>
    </main>
  );
}
