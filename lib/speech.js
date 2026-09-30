export function buzz() {
  try {
    navigator.vibrate?.(40);
  } catch {
    /* ignore */
  }
}

function isFemaleName(name) {
  return /female|woman|mujer|samantha|monica|paulina|paloma|lucia|lucía|soledad|helena|dora|sabina|google español/i.test(
    name
  );
}

function isMaleName(name) {
  return /male|man|hombre|jorge|juan|diego|pablo|carlos|andres|andrés/i.test(name);
}

export function speakText(text, langId, opts = {}) {
  return new Promise((resolve) => {
    if (!text || !window.speechSynthesis) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langId;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1;
    const prefix = langId.slice(0, 2);
    const voices = window.speechSynthesis.getVoices();
    let match = null;
    if (opts.voiceURI) match = voices.find((v) => v.voiceURI === opts.voiceURI);
    if (!match && opts.kind === "mujer") {
      match = voices.find((v) => v.lang.startsWith(prefix) && isFemaleName(`${v.name} ${v.voiceURI}`));
    }
    if (!match && opts.kind === "hombre") {
      match = voices.find((v) => v.lang.startsWith(prefix) && isMaleName(`${v.name} ${v.voiceURI}`));
    }
    if (!match) match = voices.find((v) => v.lang.startsWith(prefix));
    if (match) u.voice = match;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.speak(u);
    setTimeout(finish, Math.min(18000, 900 + String(text).length * 90));
  });
}

export function shrinkDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = dataUrl;
  });
}
