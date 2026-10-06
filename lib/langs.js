export const NAMES = {
  "ja-JP": "japonés",
  "en-US": "inglés",
  "zh-CN": "chino",
  "ko-KR": "coreano",
  "fr-FR": "francés",
  "pt-BR": "portugués",
  "it-IT": "italiano",
  "de-DE": "alemán",
  "es-MX": "español",
};

export const SHORT = {
  "ja-JP": "ja",
  "en-US": "en",
  "zh-CN": "zh",
  "ko-KR": "ko",
  "fr-FR": "fr",
  "pt-BR": "pt",
  "it-IT": "it",
  "de-DE": "de",
  "es-MX": "es",
};

export const OCR_LANG = {
  "ja-JP": "jpn",
  "en-US": "eng",
  "zh-CN": "chs",
  "ko-KR": "kor",
  "fr-FR": "fre",
  "pt-BR": "por",
  "it-IT": "ita",
  "de-DE": "ger",
  "es-MX": "spa",
};

/**
 * Saludos en cada idioma destino. Alimentan el ticker de la barra superior,
 * así la app “habla” el idioma al que estás traduciendo sin gastar una llamada.
 * Van del más útil al más cortés; 3 máx. para que el ciclo sea corto.
 */
export const HELLO = {
  "es-MX": ["Hola", "Buenas tardes", "Mucho gusto"],
  "ja-JP": ["こんにちは", "はじめまして", "ありがとうございます"],
  "en-US": ["Hello", "Nice to meet you", "Thank you"],
  "zh-CN": ["你好", "很高兴认识你", "谢谢"],
  "ko-KR": ["안녕하세요", "만나서 반갑습니다", "감사합니다"],
  "fr-FR": ["Bonjour", "Enchanté", "Merci beaucoup"],
  "pt-BR": ["Olá", "Prazer em conhecer", "Muito obrigado"],
  "it-IT": ["Ciao", "Piacere di conoscerti", "Grazie mille"],
  "de-DE": ["Hallo", "Freut mich", "Vielen Dank"],
};

export function helloFor(id) {
  const key = Object.keys(HELLO).find((k) => k.slice(0, 2) === String(id || "").slice(0, 2));
  return HELLO[key || "en-US"];
}
