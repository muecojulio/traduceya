"use client";

import { LANGS, PHRASES, TONES, phraseFor, spokenPart } from "../lib/phrases";
import { useApp } from "./use-app";

export default function Page() {
  const a = useApp();
  const qr = a.url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(a.url)}`
    : "";
  const langs = (
    <div className="row">
      <div>
        <label className="small">Oye</label>
        <select value={a.listenLang} onChange={(e) => a.setListenLang(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <button type="button" className="arrow-btn" onClick={a.swapLangsNow}>⇄</button>
      <div>
        <label className="small">Lee</label>
        <select value={a.targetLang} onChange={(e) => a.setTargetLang(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
  const reader = a.translation ? (
    <div className="reader"><p>{spokenPart(a.translation)}</p></div>
  ) : null;
  const tabs = [
    ["voz", "🗣️", "Hablar"],
    ["foto", "📷", "Cámara"],
    ["frases", "⚡", "Frases"],
    ["instalar", "⚙️", "Ajustes"],
  ];
  return (
    <div className="shell">
      <header className="topbar">
        <h1>TraduceYa</h1>
        <span>App</span>
      </header>
      <div className="content">
        {a.tab === "voz" && (
          <section className="panel">
            {langs}
            <label className="switch">
              <input type="checkbox" checked={a.autoTalk} onChange={(e) => a.setAutoTalk(e.target.checked)} />
              <span className="track" aria-hidden="true" />
              Conversación automática (tú hablas, se oye; luego habla el otro)
            </label>
            <button className={`mic ${a.convo || a.listening ? "listening" : ""}`} onClick={a.toggleConvo}>
              {a.convo ? "Parar" : "Empezar conversación"}
            </button>
            {a.heard && <p className="mini">{a.heard}</p>}
            {reader}
            {a.translation && (
              <button className="primary" onClick={() => a.setWaiter(true)}>Mostrar al mesero</button>
            )}
          </section>
        )}
        {a.tab === "foto" && (
          <section className="panel">
            {langs}
            <div className="viewfinder">
              {a.camOn ? (
                <video ref={a.videoRef} playsInline autoPlay muted />
              ) : a.photo ? (
                <img src={a.photo} alt="Captura" />
              ) : (
                <p>Apunta al menú o cartel</p>
              )}
            </div>
            <div className="actions">
              {!a.camOn ? (
                <button className="primary" onClick={a.startCamera}>Abrir cámara</button>
              ) : (
                <button className="mic" onClick={a.snap}>Tomar foto</button>
              )}
            </div>
            <div className="actions">
              {a.camOn && <button className="ghost" onClick={a.stopCamera}>Cerrar</button>}
              {a.camOn && (
                <button className={`ghost ${a.torchOn ? "on" : ""}`} onClick={a.toggleTorch}>
                  {a.torchOn ? "Linterna on" : "Linterna"}
                </button>
              )}
              <button className="ghost" onClick={() => a.galRef.current?.click()}>Galería</button>
            </div>
            <input ref={a.galRef} className="hidden-file" type="file" accept="image/*" onChange={a.onGallery} />
            {reader}
            {a.translation && (
              <button className="primary" onClick={() => a.setWaiter(true)}>Mostrar al mesero</button>
            )}
          </section>
        )}
        {a.tab === "frases" && (
          <section className="panel">
            {langs}
            <div className="phrase-list">
              {PHRASES.map((p) => {
                const dest = phraseFor(p, a.targetLang);
                const src = phraseFor(p, a.listenLang);
                return (
                  <button
                    key={p.es}
                    className="phrase"
                    onClick={() => {
                      a.setTranslation(dest);
                      a.talk(dest, a.targetLang);
                      a.setWaiter(true);
                    }}
                  >
                    <strong>{src}</strong>
                    <span>{dest}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {a.tab === "instalar" && (
          <section className="panel">
            <label className="small">Voz en español</label>
            <div className="chips">
              {[["mujer", "Mujer"], ["hombre", "Hombre"], ["auto", "Auto"]].map(([id, label]) => (
                <button key={id} className={`chip ${a.voiceKind === id ? "active" : ""}`} onClick={() => a.setVoiceKind(id)}>
                  {label}
                </button>
              ))}
            </div>
            <label className="small">Tono</label>
            <div className="chips">
              {TONES.map((t) => (
                <button key={t.id} className={`chip ${a.tone === t.id ? "active" : ""}`} onClick={() => a.setTone(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
            {a.esVoices.length > 0 && (
              <>
                <label className="small">Voz del celular</label>
                <select value={a.voiceURI} onChange={(e) => a.setVoiceURI(e.target.value)}>
                  <option value="">La que encaje con mujer/hombre</option>
                  {a.esVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </>
            )}
            <button className="primary" onClick={() => a.talk("Hola, esta es mi voz en español.", "es-MX")}>
              Probar voz
            </button>
            {a.canInstall && (
              <button className="primary" onClick={a.installApp}>Descargar e instalar</button>
            )}
            {qr && <img className="qr" src={qr} alt="QR" />}
            <p className="hint">{a.url}</p>
            <p className="hint">Android/Windows: Ajustes → Descargar e instalar, o Chrome ⋮ Instalar app.</p>
            <p className="hint">iPhone/iPad: Compartir → Añadir a pantalla de inicio.</p>
            <a className="legal" href="/privacidad">Política de privacidad</a>
          </section>
        )}
        <p className={`status ${a.error ? "error" : ""}`}>{a.error || a.status}</p>
      </div>
      <nav className="dock">
        {tabs.map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={a.tab === id ? "active" : ""}
            aria-current={a.tab === id ? "page" : undefined}
            onClick={() => a.goTab(id)}
          >
            <b>{icon}</b>
            {label}
          </button>
        ))}
      </nav>
      {a.waiter && (
        <button className="waiter" onClick={() => a.setWaiter(false)}>
          <small>Toca para cerrar</small>
          <p>{spokenPart(a.translation) || "…"}</p>
        </button>
      )}
    </div>
  );
}
