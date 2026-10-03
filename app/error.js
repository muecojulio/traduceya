"use client";

export default function Error({ error, reset }) {
  return (
    <main className="prose">
      <h1>Algo salió mal</h1>
      <p>La app tuvo un problema. Vuelve a intentarlo.</p>
      {error?.message && <p className="hint">{error.message}</p>}
      <button className="primary" type="button" onClick={() => reset()}>
        Reintentar
      </button>
      <p>
        <a href="/">Volver a TraduceYa</a>
      </p>
    </main>
  );
}
