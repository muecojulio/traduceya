/**
 * Generador de códigos QR propio (modo byte, versiones 1-10, corrección L/M/Q/H).
 *
 * Existe por privacidad y por CSP: antes el QR de "abrir la app en otro celular"
 * se pedía a un servicio de terceros (api.qrserver.com), que veía la URL de la
 * app de cada visitante y obligaba a abrir `img-src` a un dominio externo.
 * Ahora el código se dibuja en el dispositivo, sin red y sin dependencias.
 *
 * Implementa la norma ISO/IEC 18004: codificación, Reed-Solomon, interleaving,
 * patrones de función, las 8 máscaras y la elección por penalización mínima.
 * Verificado contra una implementación de referencia (ver tools/qr-check.mjs).
 */

/** Bits de nivel de corrección tal como van en la información de formato. */
const EC_BITS = { L: 1, M: 0, Q: 3, H: 2 };

/**
 * Estructura de bloques Reed-Solomon por versión y nivel.
 * [codewords de corrección por bloque, [bloques grupo 1, data por bloque],
 *  [bloques grupo 2, data por bloque]?]
 */
const RS_BLOCKS = {
  1: { L: [7, [1, 19]], M: [10, [1, 16]], Q: [13, [1, 13]], H: [17, [1, 9]] },
  2: { L: [10, [1, 34]], M: [16, [1, 28]], Q: [22, [1, 22]], H: [28, [1, 16]] },
  3: { L: [15, [1, 55]], M: [26, [1, 44]], Q: [18, [2, 17]], H: [22, [2, 13]] },
  4: { L: [20, [1, 80]], M: [18, [2, 32]], Q: [26, [2, 24]], H: [16, [4, 9]] },
  5: { L: [26, [1, 108]], M: [24, [2, 43]], Q: [18, [2, 15], [2, 16]], H: [22, [2, 11], [2, 12]] },
  6: { L: [18, [2, 68]], M: [16, [4, 27]], Q: [24, [4, 19]], H: [28, [4, 15]] },
  7: { L: [20, [2, 78]], M: [18, [4, 31]], Q: [18, [2, 14], [4, 15]], H: [26, [4, 13], [1, 14]] },
  8: { L: [24, [2, 97]], M: [22, [2, 38], [2, 39]], Q: [22, [4, 18], [2, 19]], H: [26, [4, 14], [2, 15]] },
  9: { L: [30, [2, 116]], M: [22, [3, 36], [2, 37]], Q: [20, [4, 16], [4, 17]], H: [24, [4, 12], [4, 13]] },
  10: { L: [18, [2, 68], [2, 69]], M: [26, [4, 43], [1, 44]], Q: [24, [6, 19], [2, 20]], H: [28, [6, 15], [2, 16]] },
};

/** Centros de los patrones de alineación (sin los que caen sobre los finders). */
const ALIGN_CENTERS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

/* ===== Aritmética en GF(256) con el polinomio primitivo 0x11d ===== */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Polinomio generador de Reed-Solomon de grado `n`. */
function rsGenerator(n) {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** Resto de dividir `data` entre el generador: los codewords de corrección. */
function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const rest = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ rest[0];
    rest.shift();
    rest.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecLen; i++) rest[i] ^= mul(gen[i + 1], factor);
    }
  }
  return rest;
}

/* ===== Tablas auxiliares ===== */

/** Total de codewords de datos que caben en esa versión/nivel. */
function dataCapacity(version, ec) {
  const entry = RS_BLOCKS[version][ec];
  let total = 0;
  for (let g = 1; g < entry.length; g++) total += entry[g][0] * entry[g][1];
  return total;
}

/** Bytes de texto que caben en modo byte (indicador de modo + de longitud). */
export function byteCapacity(version, ec) {
  const bits = dataCapacity(version, ec) * 8 - 4 - (version < 10 ? 8 : 16);
  return Math.floor(bits / 8);
}

const utf8 = (text) => Array.from(new TextEncoder().encode(text));

/* ===== Construcción del flujo de datos ===== */

function buildCodewords(bytes, version, ec) {
  const countBits = version < 10 ? 8 : 16;
  const capacity = dataCapacity(version, ec);
  const bits = [];
  const push = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4); // modo byte
  push(bytes.length, countBits);
  for (const b of bytes) push(b, 8);

  const capacityBits = capacity * 8;
  // Terminador (hasta 4 ceros) + relleno a byte + bytes de relleno alternos.
  push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8) bits.push(0);
  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    words.push(b);
  }
  for (let pad = 0xec; words.length < capacity; pad ^= 0xec ^ 0x11) words.push(pad);
  return words;
}

/** Reparte los datos en bloques, calcula la corrección y lo interleava. */
function interleave(words, version, ec) {
  const [ecLen, ...groups] = RS_BLOCKS[version][ec];
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i++) {
      const block = words.slice(offset, offset + size);
      offset += size;
      dataBlocks.push(block);
      ecBlocks.push(rsEncode(block, ecLen));
    }
  }
  const out = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

/* ===== Matriz ===== */

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/** Información de formato (nivel + máscara) con BCH(15,5) y la máscara 0x5412. */
function formatBits(ec, mask) {
  let data = (EC_BITS[ec] << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
  return ((data << 10) | rem) ^ 0x5412;
}

/** Información de versión (v >= 7) con BCH(18,6). */
function versionBits(version) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) if ((rem >> i) & 1) rem ^= 0x1f25 << (i - 12);
  return (version << 12) | rem;
}

function createMatrix(version) {
  const size = version * 4 + 17;
  const dark = Array.from({ length: size }, () => new Int8Array(size).fill(-1));
  const fixed = Array.from({ length: size }, () => new Uint8Array(size));

  const set = (r, c, v, isFixed = true) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    dark[r][c] = v ? 1 : 0;
    if (isFixed) fixed[r][c] = 1;
  };

  // Finders + separadores
  for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        // El anillo exterior (r o c fuera de 0..6) es el separador: siempre claro.
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        set(rr, cc, inside && (edge || core) ? 1 : 0);
      }
    }
  }

  // Patrones de alineación (se omiten los que pisan un finder)
  const centers = ALIGN_CENTERS[version];
  for (const r of centers) {
    for (const c of centers) {
      const onFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (onFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0);
        }
      }
    }
  }

  // Timing
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0 ? 1 : 0);
    set(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Reserva de la información de formato (se escribe al final, con la máscara)
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      set(8, i, 0);
      set(i, 8, 0);
    }
  }
  for (let i = 0; i < 8; i++) {
    set(8, size - 1 - i, 0);
    set(size - 1 - i, 8, 0);
  }

  // Módulo oscuro fijo (va después de la reserva: la reserva lo pisaba)
  set(size - 8, 8, 1);

  // Reserva de la información de versión (v >= 7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        set(i, size - 11 + j, 0);
        set(size - 11 + j, i, 0);
      }
    }
  }

  return { size, dark, fixed };
}

/** Coloca el flujo de bits en zigzag de dos columnas, de abajo a la derecha. */
function placeData(matrix, codewords) {
  const { size, dark, fixed } = matrix;
  const bits = [];
  for (const byte of codewords) for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  let idx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5; // la columna del timing se salta
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (const c of [col, col - 1]) {
        if (fixed[row][c]) continue;
        dark[row][c] = idx < bits.length ? bits[idx++] : 0;
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix, mask) {
  const { size, dark, fixed } = matrix;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!fixed[r][c] && MASKS[mask](r, c)) dark[r][c] ^= 1;
    }
  }
}

function writeFormat(matrix, ec, mask) {
  const { size, dark } = matrix;
  const bits = formatBits(ec, mask);
  for (let i = 0; i < 15; i++) {
    const bit = (bits >> i) & 1;
    // copia vertical (columna 8) y horizontal (fila 8), saltando el timing
    const r1 = i < 6 ? i : i < 8 ? i + 1 : size - 15 + i;
    dark[r1][8] = bit;
    const c2 = i < 8 ? size - 1 - i : i < 9 ? 7 : 14 - i;
    dark[8][c2] = bit;
  }
  dark[size - 8][8] = 1; // módulo oscuro
}

function writeVersion(matrix, version) {
  if (version < 7) return;
  const { size, dark } = matrix;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const bit = (bits >> i) & 1;
    const r = Math.floor(i / 3);
    const c = size - 11 + (i % 3);
    dark[r][c] = bit;
    dark[c][r] = bit;
  }
}

/** Penalización ISO/IEC 18004 (reglas 1-4) para elegir la mejor máscara. */
function penalty(matrix) {
  const { size, dark } = matrix;
  let score = 0;

  // Regla 1: corridas de 5 o más módulos del mismo color.
  for (let i = 0; i < size; i++) {
    let run = 1;
    for (let j = 1; j < size; j++) {
      const same = dark[i][j] === dark[i][j - 1];
      if (same) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);
    run = 1;
    for (let j = 1; j < size; j++) {
      const same = dark[j][i] === dark[j - 1][i];
      if (same) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);
  }

  // Regla 2: bloques 2×2 del mismo color.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = dark[r][c];
      if (v === dark[r][c + 1] && v === dark[r + 1][c] && v === dark[r + 1][c + 1]) score += 3;
    }
  }

  // Regla 3: patrón 1:1:3:1:1 con cuatro módulos claros a un lado.
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (get, i, j) => {
    for (let k = 0; k < 11; k++) {
      const v = get(i, j + k);
      if (v !== A[k] && v !== B[k]) return false;
    }
    return true;
  };
  for (let i = 0; i < size; i++) {
    for (let j = 0; j + 11 <= size; j++) {
      if (matches((r, c) => dark[i][c], i, j)) score += 40;
      if (matches((r, c) => dark[c][i], i, j)) score += 40;
    }
  }

  // Regla 4: desviación del 50 % de módulos oscuros.
  let darkCount = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (dark[r][c]) darkCount++;
  const percent = (darkCount * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

/**
 * Codifica `text` y devuelve `{ version, size, mask, modules }`, donde `modules`
 * es una matriz cuadrada de 0/1 (1 = módulo oscuro). Lanza si no cabe en la
 * versión 10. `mask` fija una de las 8 máscaras en vez de elegir la de menor
 * penalización (lo usa la verificación contra la implementación de referencia).
 */
export function encodeQr(text, { ec = "M", mask } = {}) {
  const value = String(text == null ? "" : text);
  if (!value) throw new Error("QR vacío");
  const level = EC_BITS[ec] === undefined ? "M" : ec;
  const bytes = utf8(value);
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    if (bytes.length <= byteCapacity(v, level)) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error("El texto no cabe en un QR (máx. versión 10)");

  const codewords = interleave(buildCodewords(bytes, version, level), version, level);
  const forced = Number.isInteger(mask) && mask >= 0 && mask < 8;
  const candidates = forced ? [mask] : [0, 1, 2, 3, 4, 5, 6, 7];
  // La penalización se mide sobre el símbolo final (con la información de
  // formato ya escrita), como pide la ISO. Otras librerías la miden con esos
  // 15 bits a cero, así que a veces eligen otra máscara: cualquiera de las ocho
  // es válida y legible, solo cambia el reparto de módulos.
  let best = null;
  for (const m of candidates) {
    const matrix = createMatrix(version);
    placeData(matrix, codewords);
    applyMask(matrix, m);
    writeFormat(matrix, level, m);
    writeVersion(matrix, version);
    const score = penalty(matrix);
    if (!best || score < best.score) best = { matrix, score, mask: m };
  }
  const { matrix } = best;
  return {
    version,
    mask: best.mask,
    ec: level,
    size: matrix.size,
    modules: matrix.dark.map((row) => Array.from(row, (v) => (v ? 1 : 0))),
  };
}

/**
 * Convierte la matriz en un `<path>` SVG con las filas de módulos oscuros
 * fusionadas: mucho más corto que un `<rect>` por módulo.
 */
export function qrPath(modules) {
  const parts = [];
  for (let r = 0; r < modules.length; r++) {
    let c = 0;
    while (c < modules[r].length) {
      if (!modules[r][c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < modules[r].length && modules[r][c]) c++;
      parts.push(`M${start} ${r}h${c - start}v1h-${c - start}z`);
    }
  }
  return parts.join("");
}
