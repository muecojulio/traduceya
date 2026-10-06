"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NAMES, SHORT, helloFor } from "../lib/langs";
import { LANGS, PHRASES, TONES, phraseFor, spokenPart } from "../lib/phrases";
import { useApp } from "./use-app";
import { THEMES, TINTS } from "../lib/appearance";
import { Btn, useRun } from "../components/ui/Btn";
import { Dock, TabPanel, useTabSwipe } from "../components/ui/Tabs";
import { Rail } from "../components/ui/Rail";
import { ChipRail } from "../components/ui/Chip";
import { Combobox } from "../components/ui/Combobox";
import { Switch } from "../components/ui/Switch";
import { Collapse } from "../components/ui/Collapse";
import { SwipeActions } from "../components/ui/SwipeActions";
import { Icon } from "../components/ui/Icons";
import {
  Ambient,
  Eq,
  MicRings,
  Progress,
  Skeleton,
  Ticker,
  ViewfinderHud,
  WordReveal,
  isCjk,
  useFlash,
} from "../components/ui/Viva";
import { copyText, norm } from "../components/ui/utils";

const TABS = [
  ["voz", "mic", "Hablar"],
  ["foto", "cam", "Cámara"],
  ["frases", "bolt", "Frases"],
  ["instalar", "sliders", "Ajustes"],
];

const LANG_OPTS = LANGS.map((l) => ({ value: l.id, label: l.name, sub: l.id }));

/** Traducción con acciones a la derecha (swipe) + toggle explícito + inline en desktop. */
function ReaderCard({ a, empty = { icon: "mic", hint: "Aquí aparece la traducción, en grande." } }) {
  const talkRun = useRun(() => a.talk(spokenPart(a.translation), a.targetLang));
  const copyRun = useRun(() => copyText(spokenPart(a.translation)));
  const text = spokenPart(a.translation);
  const loading = a.busy && !text;
  const isNew = useFlash(text ? text : null, 900);
  if (!text && !loading) {
    return (
      <div className="reader-empty">
        <Icon name={empty.icon} size={22} />
        <span>{empty.hint}</span>
      </div>
    );
  }
  return (
    <SwipeActions
      label="acciones de la traducción"
      actions={[
        {
          id: "copy",
          icon: <Icon name="copy" size={15} />,
          label: copyRun.state === "ok" ? "Copiado" : "Copiar",
          busy: copyRun.busy,
          ok: copyRun.state === "ok",
          onClick: () => copyRun.run(),
        },
        {
          id: "talk",
          icon: <Icon name="sound" size={15} />,
          label: "Repetir",
          busy: talkRun.busy,
          ok: talkRun.state === "ok",
          onClick: () => talkRun.run(),
        },
      ]}
    >
      <div className={"reader" + (isNew ? " is-new" : "")}>
        {loading ? (
          <Skeleton lines={3} />
        ) : (
          <p key={text} className={isCjk(text) ? "jp" : ""}>
            <WordReveal text={text} />
          </p>
        )}
      </div>
      <Btn variant="primary" onClick={() => a.setWaiter(true)}>
        <Icon name="scan" size={16} /> Mostrar al mesero
      </Btn>
    </SwipeActions>
  );
}

/** Pantalla completa para la otra persona; se cierra con toque, botón o Esc. */
function Waiter({ a }) {
  const ref = useRef(null);
  const text = spokenPart(a.translation);
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
      <p key={text} className={isCjk(text) ? "jp" : ""}>
        {text ? <WordReveal text={text} max={22} step={34} /> : "…"}
      </p>
      <div className="waiter-actions" onClick={(e) => e.stopPropagation()}>
        <Btn variant="ghost" onClick={() => a.talk(text, a.targetLang)}>
          <Icon name="sound" size={16} /> Repetir
        </Btn>
        <Btn variant="ghost" onClick={() => a.setWaiter(false)}>
          <Icon name="close" size={15} /> Cerrar
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

  // Par de idiomas + flecha: deja claro quién habla y quién escucha
  const langs = (
    <>
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
          <Icon name="swap" size={18} />
        </Btn>
        <Combobox
          label="Lee"
          value={a.targetLang}
          onChange={a.setTargetLang}
          options={LANG_OPTS}
          placeholder="Buscar idioma…"
        />
      </div>
      <div className="pair" aria-hidden="true">
        <span className="langtag">
          <Icon name="mic" size={11} /> {NAMES[a.listenLang] || a.listenLang}
        </span>
        <i className="via" />
        <span className="langtag dest">
          {NAMES[a.targetLang] || a.targetLang} <Icon name="sound" size={11} />
        </span>
      </div>
    </>
  );

  // Frases: búsqueda + feedback por tarjeta
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

  const listening = !!a.listening;

  return (
    <div className="shell" data-tab={a.tab} data-tint={a.tint} data-dest={a.targetLang}>
      <Ambient />
      <Progress on={a.busy} />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="translate" size={18} strokeWidth={1.9} />
          </span>
          <h1>TraduceYa</h1>
        </div>
        <div className="top-right">
          <Ticker items={helloFor(a.targetLang)} />
          <span className="pill-live">
            <i aria-hidden="true" />
            {SHORT[a.targetLang] || "app"}
          </span>
        </div>
      </header>
      <div className="content" ref={contentRef}>
        {a.tab === "voz" && (
          <TabPanel tab="voz">
            {langs}
            <Switch id="auto-talk" checked={a.autoTalk} onChange={a.setAutoTalk}>
              Conversación automática (tú hablas, se oye; luego habla el otro)
            </Switch>
            <div className={"mic-wrap" + (a.convo || listening ? " live" : "")}>
              <MicRings on={a.convo || listening} />
              <Btn
                variant="mic"
                aria-pressed={!!a.convo}
                onClick={a.toggleConvo}
              >
                {listening ? (
                  <>
                    <Eq bars={4} /> Escuchando… suelta cuando termines
                  </>
                ) : a.convo ? (
                  "Parar conversación"
                ) : (
                  "Empezar conversación"
                )}
              </Btn>
            </div>
            {a.heard ? (
              <p className="mini heard">
                <Icon name="mic" size={13} /> {a.heard}
              </p>
            ) : null}
            <ReaderCard
              a={a}
              empty={{
                icon: "mic",
                hint: "Toca «Empezar conversación» y habla: la traducción aparece aquí, en grande.",
              }}
            />
          </TabPanel>
        )}
        {a.tab === "foto" && (
          <TabPanel tab="foto">
            {langs}
            <div className="viewfinder" data-no-swipe="" data-live={a.camOn ? "" : undefined}>
              {a.camOn ? (
                <>
                  <video ref={a.videoRef} playsInline autoPlay muted />
                  <ViewfinderHud live />
                </>
              ) : a.photo ? (
                <>
                  <img src={a.photo} alt="Captura" />
                  <ViewfinderHud />
                </>
              ) : (
                <>
                  <p className="vf-empty">
                    <span className="vf-emoji" aria-hidden="true">
                      🍜
                    </span>
                    Apunta al menú o al cartel
                    <span className="mini">Con la linterna se lee mejor de noche</span>
                  </p>
                  <ViewfinderHud />
                </>
              )}
            </div>
            <div className="actions">
              {!a.camOn ? (
                <Btn variant="primary" run={camRun} onClick={() => camRun.run()}>
                  <Icon name="cam" size={16} /> Abrir cámara
                </Btn>
              ) : (
                <Btn variant="mic" run={snapRun} onClick={() => snapRun.run()}>
                  <Icon name="scan" size={16} /> Tomar foto
                </Btn>
              )}
            </div>
            <div className="actions">
              {a.camOn && (
                <Btn variant="ghost" onClick={a.stopCamera}>
                  <Icon name="close" size={15} /> Cerrar
                </Btn>
              )}
              {a.camOn && (
                <Btn
                  variant="ghost"
                  className={a.torchOn ? "on" : ""}
                  aria-pressed={a.torchOn}
                  onClick={a.toggleTorch}
                >
                  <Icon name="bulb" size={15} /> {a.torchOn ? "Linterna on" : "Linterna"}
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => a.galRef.current?.click()}>
                <Icon name="image" size={15} /> Galería
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
            <ReaderCard
              a={a}
              empty={{
                icon: "scan",
                hint: "Toma la foto del menú: el texto traducido aparece aquí en grande.",
              }}
            />
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
                    <Icon name="close" size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            {list.length ? (
              <>
                <div className="pair" aria-hidden="true">
                  <span className="count-badge">{list.length} frases</span>
                  <i className="via" />
                  <span className="langtag">funcionan sin internet</span>
                </div>
                <Rail label={`Frases disponibles (${list.length})`} className="rail-cards">
                  {list.map((p, i) => {
                    const dest = phraseFor(p, a.targetLang);
                    const src = phraseFor(p, a.listenLang);
                    const played = flash === p.es;
                    const isCopied = copied === p.es;
                    const isBusy = phraseBusy === p.es;
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
                          disabled={isBusy}
                          aria-busy={isBusy || undefined}
                        >
                          <strong>{src}</strong>
                          <span>{dest}</span>
                          {played ? (
                            <span className="phrase-ok">
                              <Icon name="check" size={12} /> Reproducida
                            </span>
                          ) : null}
                        </button>
                        {isBusy ? (
                          <span className="eq-live" aria-hidden="true">
                            <Eq bars={3} />
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className={"phrase-copy" + (isCopied ? " ok" : "")}
                          aria-label={
                            isCopied ? "Traducción copiada" : `Copiar traducción de «${src}»`
                          }
                          onClick={() => copyPhrase(p)}
                        >
                          {isCopied ? <Icon name="check" size={15} /> : <Icon name="copy" size={15} />}
                        </button>
                      </article>
                    );
                  })}
                </Rail>
              </>
            ) : (
              <div className="reader-empty" role="status">
                <Icon name="spark" size={20} />
                <span>
                  Sin coincidencias para «{q}». Prueba con otra palabra — o escríbela en español.
                </span>
              </div>
            )}
          </TabPanel>
        )}
        {a.tab === "instalar" && (
          <TabPanel tab="instalar">
            <ChipRail
              label="Apariencia"
              value={a.theme}
              onChange={a.setTheme}
              options={THEMES}
            />
            <ChipRail
              label="Color de acento"
              value={a.tint}
              onChange={a.setTint}
              options={TINTS}
            />
            <p className="hint">
              {a.tint === "idioma"
                ? `El acento sigue al idioma que lees: ${NAMES[a.targetLang] || a.targetLang}.`
                : "El acento cambia con la pestaña que tienes abierta."}
            </p>
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
              <Icon name="sound" size={16} /> Probar voz
            </Btn>
            {a.canInstall && (
              <Btn variant="primary" run={installRun} onClick={() => installRun.run()}>
                <Icon name="download" size={16} /> Descargar e instalar
              </Btn>
            )}
            <Collapse label="¿Cómo instalarla?" defaultOpen>
              {qr && (
                <img
                  className="qr"
                  src={qr}
                  alt="Código QR para abrir TraduceYa en otro dispositivo"
                />
              )}
              <p className="hint mono">{a.url}</p>
              <p className="hint">
                Android/Windows: Ajustes → Descargar e instalar, o Chrome ⋮ Instalar app.
              </p>
              <p className="hint">iPhone/iPad: Compartir → Añadir a pantalla de inicio.</p>
            </Collapse>
            <a className="legal" href="/privacidad">
              <Icon name="spark" size={13} /> Política de privacidad
            </a>
          </TabPanel>
        )}
        <p className={`status ${a.error ? "error" : ""}`} role={a.error ? "alert" : "status"}>
          {a.busy && !a.error ? <Eq bars={3} /> : null}
          {a.error || a.status}
        </p>
      </div>
      <Dock
        items={TABS.map(([id, icon, text]) => [
          id,
          <Icon name={icon} size={21} />,
          text,
          id === "voz" && a.convo,
        ])}
        value={a.tab}
        onChange={a.goTab}
      />
      <Waiter a={a} />
    </div>
  );
}
