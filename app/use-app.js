"use client";

import { useEffect, useRef, useState } from "react";
import { TONES, spokenPart } from "../lib/phrases";
import { buzz, speakText, shrinkDataUrl } from "../lib/speech";
import {
  applyAppearance,
  normalizeTheme,
  normalizeTint,
  readLinkState,
  readStoredAppearance,
  storeAppearance,
} from "../lib/appearance";

export function useApp() {
  const [tab, setTab] = useState("voz");
  // Apariencia: noche/día y de dónde sale el acento (pestaña o idioma destino).
  const [theme, setThemeState] = useState("noche");
  const [tint, setTintState] = useState("pestana");
  const [listenLang, setListenLang] = useState("es-MX");
  const [targetLang, setTargetLang] = useState("ja-JP");
  const [listening, setListening] = useState(false);
  // true mientras hay una traducción o una lectura de foto en vuelo (barra de progreso + esqueleto)
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState("");
  const [translation, setTranslation] = useState("");
  const [photo, setPhoto] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [autoTalk, setAutoTalk] = useState(true);
  const [convo, setConvo] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [waiter, setWaiter] = useState(false);
  const [voiceKind, setVoiceKind] = useState("mujer");
  const [tone, setTone] = useState("natural");
  const [voiceURI, setVoiceURI] = useState("");
  const [esVoices, setEsVoices] = useState([]);
  const [canInstall, setCanInstall] = useState(false);
  const recRef = useRef(null);
  const installRef = useRef(null);
  const listenRef = useRef(listenLang);
  const targetRef = useRef(targetLang);
  const autoRef = useRef(true);
  const convoRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const galRef = useRef(null);
  const wakeRef = useRef(null);

  useEffect(() => {
    setUrl(window.location.origin);
    const loadVoices = () => {
      const list = window.speechSynthesis?.getVoices?.() || [];
      setEsVoices(list.filter((v) => v.lang.toLowerCase().startsWith("es")));
    };
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    const onInstall = (e) => {
      e.preventDefault();
      installRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    navigator.wakeLock?.request("screen").then((lock) => {
      wakeRef.current = lock;
    }).catch(() => {});
    return () => {
      convoRef.current = false;
      recRef.current?.stop?.();
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
      streamRef.current = null;
      window.speechSynthesis?.cancel();
      wakeRef.current?.release?.();
    };
  }, []);

  // Enlaces directos (?tab= &idioma= &oye= &tema= &tinte=): pintan esta visita.
  // Las preferencias guardadas mandan en el resto; el enlace no se persiste.
  useEffect(() => {
    const link = readLinkState(window.location.search);
    const stored = readStoredAppearance();
    const nextTheme = link.theme || stored.theme || "noche";
    const nextTint = link.tint || stored.tint || "pestana";
    setThemeState(nextTheme);
    setTintState(nextTint);
    if (link.listenLang) setListenLang(link.listenLang);
    if (link.targetLang) setTargetLang(link.targetLang);
    if (link.tab) setTab(link.tab);
    applyAppearance({
      theme: nextTheme,
      tint: nextTint,
      dest: link.targetLang || targetRef.current,
    });
    // Ya hidrató React: el atributo de arranque sobra (si no, pisaría a la
    // pestaña activa al cambiar de sección).
    delete document.documentElement.dataset.bootTab;
  }, []);

  // Mantén <html> (y el color de la barra del navegador) al día con el estado.
  useEffect(() => {
    applyAppearance({ theme, tint, dest: targetLang });
  }, [theme, tint, targetLang]);

  useEffect(() => {
    listenRef.current = listenLang;
    targetRef.current = targetLang;
  }, [listenLang, targetLang]);

  useEffect(() => {
    autoRef.current = autoTalk;
  }, [autoTalk]);

  useEffect(() => {
    if (tab !== "foto") stopCamera();
    if (tab !== "voz") stopConvo();
  }, [tab]);

  async function translateText(text, sourceId) {
    setBusy(true);
    try {
      if (window.Translator?.create) {
        try {
          const sourceLanguage = (sourceId || listenLang).slice(0, 2);
          const targetLanguage = targetLang.slice(0, 2);
          const avail = await window.Translator.availability({ sourceLanguage, targetLanguage });
          if (avail !== "unavailable") {
            const tr = await window.Translator.create({ sourceLanguage, targetLanguage });
            const out = await tr.translate(text);
            if (out) return out;
          }
        } catch {}
      }
      const ck = `ty:${targetLang}:${text}`;
      try {
        const hit = sessionStorage.getItem(ck);
        if (hit) return hit;
      } catch {}
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target: targetLang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo traducir");
      if (!data.translation) throw new Error("La traducción llegó vacía. Intenta otra vez.");
      try { sessionStorage.setItem(ck, data.translation); } catch {}
      return data.translation;
    } finally {
      setBusy(false);
    }
  }

  function talk(text, langId) {
    const preset = TONES.find((t) => t.id === tone) || TONES[1];
    return speakText(text, langId, {
      rate: preset.rate,
      pitch: preset.pitch,
      kind: voiceKind,
      voiceURI: langId.startsWith("es") ? voiceURI : "",
    });
  }

  function setTheme(value) {
    const next = normalizeTheme(value);
    setThemeState(next);
    storeAppearance({ theme: next });
  }

  function setTint(value) {
    const next = normalizeTint(value);
    setTintState(next);
    storeAppearance({ tint: next });
  }

  function swapLangsNow() {
    const x = listenRef.current;
    const y = targetRef.current;
    listenRef.current = y;
    targetRef.current = x;
    setListenLang(y);
    setTargetLang(x);
  }

  function stopConvo() {
    convoRef.current = false;
    setConvo(false);
    recRef.current?.stop();
    setListening(false);
    window.speechSynthesis?.cancel();
  }

  function startListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Usa Chrome o Edge para el micrófono.");
      return;
    }
    recRef.current?.stop();
    setError("");
    setHeard("");
    setStatus("Escuchando… acerca el celular");
    const from = listenRef.current;
    const to = targetRef.current;
    const rec = new SR();
    rec.lang = from;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = async (ev) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      setHeard(text);
      if (ev.results[ev.results.length - 1].isFinal) {
        setStatus("Traduciendo…");
        try {
          const out = await translateText(text, from);
          setTranslation(out);
          setStatus("Oyendo traducción…");
          buzz();
          await talk(out, to);
          if (autoRef.current && convoRef.current) {
            swapLangsNow();
            setStatus("Pasa el celular. La otra persona habla.");
            setTimeout(() => { if (convoRef.current) startListen(); }, 500);
          } else setStatus("");
        } catch (e) {
          setError(e.message);
          setStatus("");
        }
      }
    };
    rec.onerror = () => {
      setListening(false);
      if (convoRef.current) {
        setStatus("No se oyó. Toca de nuevo o espera.");
        setTimeout(() => { if (convoRef.current) startListen(); }, 700);
      } else {
        setError("No se oyó. Acerca el micrófono.");
        setStatus("");
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function toggleConvo() {
    if (convoRef.current) {
      stopConvo();
      setStatus("");
      return;
    }
    convoRef.current = true;
    setConvo(true);
    startListen();
  }

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Abre la app en HTTPS (o usa Galería) para usar la cámara.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError("No se abrió la cámara. Usa Galería o permite el permiso.");
      throw new Error("cam");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
    setTorchOn(false);
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setError("Este celular no deja encender la linterna desde el navegador.");
    }
  }

  async function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Espera a que se vea la imagen y vuelve a tocar.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    await sendPhoto(canvas.toDataURL("image/jpeg", 0.8));
  }

  async function sendPhoto(dataUrl) {
    setError("");
    setBusy(true);
    setStatus("Leyendo menú…");
    try {
      const image = await shrinkDataUrl(dataUrl);
      setPhoto(image);
      const res = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, target: targetLang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se leyó la foto");
      const translated = data.translation || "";
      setTranslation(translated);
      setStatus("");
      talk(spokenPart(translated), targetLang);
      buzz();
    } catch (e) {
      setError(e.message);
      setStatus("");
      throw e; // let the button show its error state
    } finally {
      setBusy(false);
    }
  }

  async function onGallery(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      setError("No se pudo abrir esa imagen. Prueba con otra foto.");
      setStatus("");
    };
    img.onload = async () => {
      URL.revokeObjectURL(blobUrl);
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      await sendPhoto(c.toDataURL("image/jpeg", 0.8));
    };
    img.src = blobUrl;
  }

  async function installApp() {
    const ev = installRef.current;
    if (!ev) return;
    ev.prompt();
    await ev.userChoice;
    setCanInstall(false);
  }

  function goTab(id) {
    setTab(id);
    setError("");
    setStatus("");
    buzz();
  }

  return {
    tab, listenLang, setListenLang, targetLang, setTargetLang,
    theme, setTheme, tint, setTint,
    listening, busy, heard, translation, setTranslation, photo, status, error, setError,
    url, autoTalk, setAutoTalk, convo, camOn, torchOn, waiter, setWaiter,
    voiceKind, setVoiceKind, tone, setTone, voiceURI, setVoiceURI,
    esVoices, canInstall, videoRef, galRef,
    talk, swapLangsNow, toggleConvo, startCamera, stopCamera, toggleTorch,
    snap, onGallery, installApp, goTab,
  };
}
