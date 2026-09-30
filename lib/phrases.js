export const LANGS = [
  { id: "es-MX", name: "Español" },
  { id: "ja-JP", name: "Japonés" },
  { id: "en-US", name: "Inglés" },
  { id: "zh-CN", name: "Chino" },
  { id: "ko-KR", name: "Coreano" },
  { id: "fr-FR", name: "Francés" },
  { id: "pt-BR", name: "Portugués" },
  { id: "it-IT", name: "Italiano" },
  { id: "de-DE", name: "Alemán" },
];

export const PHRASES = [
  { es: "Hola", ja: "こんにちは", en: "Hello" },
  { es: "Por favor", ja: "お願いします", en: "Please" },
  { es: "Gracias", ja: "ありがとうございます", en: "Thank you" },
  { es: "¿Cuánto cuesta?", ja: "いくらですか？", en: "How much?" },
  { es: "La cuenta", ja: "お会計をお願いします", en: "The check" },
  { es: "¿Qué recomienda?", ja: "おすすめは何ですか？", en: "Recommend?" },
  { es: "No como carne", ja: "肉は食べません", en: "No meat" },
  { es: "Alergia a mariscos", ja: "貝アレルギーです", en: "Shellfish allergy" },
  { es: "Agua", ja: "お水をください", en: "Water" },
  { es: "¿Dónde está el baño?", ja: "トイレはどこですか？", en: "Restroom?" },
  { es: "No entiendo", ja: "わかりません", en: "I don't understand" },
  { es: "Más despacio", ja: "ゆっくり話してください", en: "Slower please" },
  { es: "Está rico", ja: "美味しいです", en: "Delicious" },
  { es: "Perdón", ja: "すみません", en: "Excuse me" },
  { es: "¿Aceptan tarjeta?", ja: "カードは使えますか？", en: "Card OK?" },
  { es: "WiFi", ja: "Wi-Fiはありますか？", en: "WiFi?" },
  { es: "Ayuda", ja: "助けてください", en: "Help" },
  { es: "Al hotel", ja: "ホテルまでお願いします", en: "To the hotel" },
];

export const TONES = [
  { id: "calma", name: "Calma", rate: 0.8, pitch: 0.92 },
  { id: "natural", name: "Natural", rate: 0.95, pitch: 1 },
  { id: "firme", name: "Firme", rate: 1.02, pitch: 0.82 },
  { id: "agil", name: "Ágil", rate: 1.14, pitch: 1.12 },
];

export function phraseFor(item, langId) {
  if (langId.startsWith("ja")) return item.ja;
  if (langId.startsWith("en")) return item.en;
  return item.es;
}

export function spokenPart(full) {
  return full.replace(/^TEXTO ORIGINAL:[\s\S]*?TRADUCCIÓN[^:]*:\s*/i, "");
}
