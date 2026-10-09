/**
 * Verificación del generador de QR contra una implementación de referencia.
 *
 * Uso:  node tools/qr-check.mjs [--json] [textos...]
 *
 * Sin argumentos imprime las matrices en texto; con --json serializa cada
 * combinación de texto × nivel de corrección × máscara, que es lo que consume
 * `tools/qr-check.py` para compararlas módulo por módulo con la librería
 * `qrcode` de Python. Fijar la máscara en los dos lados es lo que hace la
 * comparación estricta: la elección de máscara es libre, el resto no.
 */
import { encodeQr } from "../lib/qr.js";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const texts = args.filter((a) => a !== "--json");

const SAMPLES = texts.length
  ? texts
  : [
      "https://traduceya.vercel.app",
      "http://localhost:3000",
      "A",
      "Hola, ¿dónde está el baño?",
      "https://example.com/?tab=foto&oye=es-MX&idioma=ja-JP&tema=dia&tinte=idioma",
      "1234567890",
      "El niño comía ñoños en el cañón — 0123456789",
      "こんにちは世界",
    ];

const LEVELS = ["L", "M", "Q", "H"];

if (asJson) {
  const all = [];
  for (const text of SAMPLES) {
    for (const ec of LEVELS) {
      for (let mask = 0; mask < 8; mask++) {
        try {
          const qr = encodeQr(text, { ec, mask });
          all.push({
            text,
            ec,
            mask,
            version: qr.version,
            size: qr.size,
            modules: qr.modules.map((row) => row.join("")),
          });
        } catch {
          /* no cabe: la referencia tampoco lo generaría */
        }
      }
      try {
        const auto = encodeQr(text, { ec });
        all.push({ text, ec, mask: "auto", chosen: auto.mask, version: auto.version });
      } catch {
        /* idem */
      }
    }
  }
  console.log(JSON.stringify(all));
} else {
  for (const text of SAMPLES) {
    for (const ec of LEVELS) {
      try {
        const qr = encodeQr(text, { ec });
        console.log(
          `--- ${JSON.stringify(text)} ec=${ec} v${qr.version} mask=${qr.mask} (${qr.size}x${qr.size})`
        );
        for (const row of qr.modules) console.log(row.map((v) => (v ? "#" : ".")).join(""));
      } catch (e) {
        console.log(`--- ${JSON.stringify(text)} ec=${ec} -> ${e.message}`);
      }
    }
  }
}
