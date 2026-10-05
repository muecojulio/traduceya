"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LANGS, PHRASES, TONES, phraseFor, spokenPart } from "../lib/phrases";
import { useApp } from "./use-app";
import { Btn, useRun } from "../components/ui/Btn";
import { Dock, TabPanel, useTabSwipe } from "../components/ui/Tabs";
import { Rail } from "../components/ui/Rail";
import { ChipRail } from "../components/ui/Chip";
import { Combobox } from "../components/ui/Combobox";
import { Switch } from "../components/ui/Switch";
import { Collapse } from "../components/ui/Collapse";
import { SwipeActions } from "../components/ui/SwipeActions";
import { copyText, norm } from "../components/ui/utils";

const TABS = [
  ["voz", "🗣️", "Hablar"],
  ["foto", "📷", "Cámara"],
  ["frases", "⚡", "Frases"],
  ["instalar", "⚙️", "Ajustes"],
];

const LANG_OPTS = LANGS.map((l) => ({ value: l.id, label: l.name, sub: l.id }));

/** Translation card with swipe-revealable actions + explicit toggle + desktop inline. */
function ReaderCard({ a }) {
  const talkRun = useRun(() => a.talk(spokenPart(a.translation), a.targetLang));
  const copyRun = useRun(() => copyText(spokenPart(a.translation)));
  if (!a.translation) return null;
  return (
    <SwipeActions
      label="acciones de la traducción"
      actions={[
        {
          id: "copy",
          icon: "⧉",
          label: copyRun.state === "ok" ? "Copiado" : "Copiar",
          busy: copyRun.busy,
          ok: copyRun.state === "ok",
          onClick: () => copyRun.run(),
        },
        {
          id: "talk",
          icon: "🔊",
          label: "Repetir",
          busy: talkRun.busy,
          ok: talkRun.state === "ok",
          onClick: () => talkRun.run(),
        },
      ]}
    >
      <div className="reader">
        <p>{spokenPart(a.translation)}</p>
      </div>
      <Btn variant="primary" onClick={() => a.setWaiter(true)}>
        Mostrar al mesero
      </Btn>
    </SwipeActions>
  );
}

/** Full-screen card for the other person; closable by tap, button or Esc. */
function Waiter({ a }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!a.waiter) return;
    ref.current?.focus?.();
    const onKey = (e) => {
      if (e.key === "Escape") a.setWaiter(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.waiter]);
  if (!a.waiter) return null;
  return (
    <div
      className="waiter"
      role="dialog"
      aria-modal="true"
      aria-label="Texto para el mesero"
      ref={ref}
      tabIndex={-1}
      onClick={() => a.setWaiter(false)}
    >
      <small>Toca cualquier lado o Esc para cerrar</small>
      <p>{spokenPart(a.translation) || "…"}</p>
      <div className="waiter-actions" onClick={(e) => e.stopPropagation()}>
        <Btn
          variant="ghost"
          onClick={() => a.talk(spokenPart(a.translation), a.targetLang)}
        >
          🔊 Repetir
        </Btn>
        <Btn variant="ghost" onClick={() => a.setWaiter(false)}>
          Cerrar
        </Btn>
      </div>
    </div>
  );
}

export default function Page() {
  const a = useApp();
  const qr = a.url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(a.url)}`
    : "";

  const swapRun = useRun(a.swapLangsNow);
  const camRun = useRun(a.startCamera);
  const snapRun = useRun(a.snap);
  const voiceRun = useRun(() => a.talk("Hola, esta es mi voz en español.", "es-MX"));
  const installRun = useRun(a.installApp);

  const tabIdx = Math.max(0, TABS.findIndex(([id]) => id === a.tab));
  const contentRef = useTabSwipe({
    index: tabIdx,
    count: TABS.length,
    onSelect: (i) => a.goTab(TABS[i][0]),
  });

  const langs = (
    <div className="row">
      <Combobox
        label="Oye"
        value={a.listenLang}
        onChange={a.setListenLang}
        options={LANG_OPTS}
        placeholder="Buscar idioma…"
      />
      <Btn
        variant="icon"
        className="swap-btn"
        aria-label="Intercambiar idiomas"
        run={swapRun}
        onClick={() => swapRun.run()}
      >
        ⇄
      </Btn>
      <Combobox
        label="Lee"
        value={a.targetLang}
        onChange={a.setTargetLang}
        options={LANG_OPTS}
        placeholder="Buscar idioma…"
      />
    </div>
  );

  // Frases: search + per-card feedback
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState(null);
  const [copied, setCopied] = useState(null);
  const [phraseBusy, setPhraseBusy] = useState(null);
  const flashT = useRef(0);
  const copyT = useRef(0);
  const list = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return PHRASES;
    return PHRASES.filter(
      (p) => norm(p.es).includes(s) || norm(p.ja).includes(s) || norm(p.en).includes(s)
    );
  }, [q]);

  async function playPhrase(p) {
    if (phraseBusy) return;
    const dest = phraseFor(p, a.targetLang);
    setPhraseBusy(p.es);
    try {
      a.setTranslation(dest);
      await a.talk(dest, a.targetLang);
      a.setWaiter(true);
      setFlash(p.es);
      clearTimeout(flashT.current);
      flashT.current = setTimeout(() => setFlash(null), 1400);
    } finally {
      setPhraseBusy(null);
    }
  }

  async function copyPhrase(p) {
    const dest = phraseFor(p, a.targetLang);
    try {
      await copyText(dest);
      setCopied(p.es);
      clearTimeout(copyT.current);
      copyT.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      a.setError("No se pudo copiar. Permite el portapapeles o transcribe a mano.");
    }
  }

  useEffect(
    () => () => {
      clearTimeout(flashT.current);
      clearTimeout(copyT.current);
    },
    []
  );

  return (
    <div className="shell">
      <header className="topbar">
        <h1>TraduceYa</h1>
        <span>App</span>
      </header>
      <div className="content" ref={contentRef}>
        {a.tab === "voz" && (
          <TabPanel tab="voz">
            {langs}
            <Switch id="auto-talk" checked={a.autoTalk} onChange={a.setAutoTalk}>
              Conversación automática (tú hablas, se oye; luego habla el otro)
            </Switch>
            <Btn
              variant="mic"
              className={a.convo || a.listening ? "listening" : ""}
              aria-pressed={!!a.convo}
              onClick={a.toggleConvo}
            >
              {a.convo ? "Parar" : "Empezar conversación"}
            </Btn>
            {a.heard && <p className="mini">{a.heard}</p>}
            <ReaderCard a={a} />
          </TabPanel>
        )}
        {a.tab === "foto" && (
          <TabPanel tab="foto">
            {langs}
            <div className="viewfinder" data-no-swipe="">
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
                <Btn variant="primary" run={camRun} onClick={() => camRun.run()}>
                  Abrir cámara
                </Btn>
              ) : (
                <Btn variant="mic" run={snapRun} onClick={() => snapRun.run()}>
                  Tomar foto
                </Btn>
              )}
            </div>
            <div className="actions">
              {a.camOn && <Btn variant="ghost" onClick={a.stopCamera}>Cerrar</Btn>}
              {a.camOn && (
                <Btn
                  variant="ghost"
                  className={a.torchOn ? "on" : ""}
                  aria-pressed={a.torchOn}
                  onClick={a.toggleTorch}
                >
                  {a.torchOn ? "Linterna on" : "Linterna"}
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => a.galRef.current?.click()}>
                Galería
              </Btn>
            </div>
            <input
              ref={a.galRef}
              id="gallery-file"
              className="hidden-file"
              type="file"
              accept="image/*"
              onChange={a.onGallery}
              aria-label="Elegir foto de la galería"
            />
            <ReaderCard a={a} />
          </TabPanel>
        )}
        {a.tab === "frases" && (
          <TabPanel tab="frases">
            {langs}
            <div className="search-field">
              <label className="small" htmlFor="frase-q">
                Buscar frase
              </label>
              <div className="search">
                <input
                  id="frase-q"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej.: cuenta, alergia, agua…"
                  autoComplete="off"
                />
                {q ? (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Limpiar búsqueda"
                    onClick={() => setQ("")}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </div>
            {list.length ? (
              <Rail label={`Frases disponibles (${list.length})`} className="rail-cards">
                {list.map((p, i) => {
                  const dest = phraseFor(p, a.targetLang);
                  const src = phraseFor(p, a.listenLang);
                  const played = flash === p.es;
                  const isCopied = copied === p.es;
                  return (
                    <article
                      key={p.es}
                      className="phrase-card"
                      style={{ "--i": i }}
                      data-ok={played ? "" : undefined}
                    >
                      <button
                        type="button"
                        className="ui-btn phrase"
                        onClick={() => playPhrase(p)}
                        disabled={phraseBusy === p.es}
                        aria-busy={phraseBusy === p.es || undefined}
                      >
                        <strong>{src}</strong>
                        <span>{dest}</span>
                        {played ? (
                          <span className="phrase-ok">
                            <span aria-hidden="true">✓</span> Reproducida
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className={"phrase-copy" + (isCopied ? " ok" : "")}
                        aria-label={
                          isCopied
                            ? "Traducción copiada"
                            : `Copiar traducción de «${src}»`
                        }
                        onClick={() => copyPhrase(p)}
                      >
                        {isCopied ? "✓" : "⧉"}
                      </button>
                    </article>
                  );
                })}
              </Rail>
            ) : (
              <p className="mini" role="status">
                Sin coincidencias para «{q}». Prueba otra palabra.
              </p>
            )}
          </TabPanel>
        )}
        {a.tab === "instalar" && (
          <TabPanel tab="instalar">
            <ChipRail
              label="Voz en español"
              value={a.voiceKind}
              onChange={a.setVoiceKind}
              options={[
                { id: "mujer", label: "Mujer" },
                { id: "hombre", label: "Hombre" },
                { id: "auto", label: "Auto" },
              ]}
            />
            <ChipRail
              label="Tono"
              value={a.tone}
              onChange={a.setTone}
              options={TONES.map((t) => ({ id: t.id, label: t.name }))}
            />
            {a.esVoices.length > 0 ? (
              <div className="combo-block">
                <Combobox
                  label="Voz del celular"
                  value={a.voiceURI}
                  onChange={a.setVoiceURI}
                  placeholder="Buscar voz…"
                  options={[
                    { value: "", label: "La que encaje con mujer/hombre" },
                    ...a.esVoices.map((v) => ({
                      value: v.voiceURI,
                      label: v.name,
                      sub: v.lang,
                    })),
                  ]}
                />
              </div>
            ) : null}
            <Btn variant="primary" run={voiceRun} onClick={() => voiceRun.run()}>
              Probar voz
            </Btn>
            {a.canInstall && (
              <Btn variant="primary" run={installRun} onClick={() => installRun.run()}>
                Descargar e instalar
              </Btn>
            )}
            <Collapse label="¿Cómo instalarla?" defaultOpen>
              {qr && <img className="qr" src={qr} alt="Código QR para abrir TraduceYa en otro dispositivo" />}
              <p className="hint">{a.url}</p>
              <p className="hint">
                Android/Windows: Ajustes → Descargar e instalar, o Chrome ⋮ Instalar app.
              </p>
              <p className="hint">iPhone/iPad: Compartir → Añadir a pantalla de inicio.</p>
            </Collapse>
            <a className="legal" href="/privacidad">
              Política de privacidad
            </a>
          </TabPanel>
        )}
        <p className={`status ${a.error ? "error" : ""}`} role={a.error ? "alert" : "status"}>
          {a.error || a.status}
        </p>
      </div>
      <Dock
        items={TABS.map(([id, icon, text]) => [id, icon, text, id === "voz" && a.convo])}
        value={a.tab}
        onChange={a.goTab}
      />
      <Waiter a={a} />
    </div>
  );
}
