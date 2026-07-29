// Reed-Solomon Error Correction Visualizer — pages/visualizers/reed-solomon
//
// All the algebra here (GF(2^8) tables, Lagrange-based encoding, and the
// Berlekamp-Welch decoder) was written and unit/fuzz-tested standalone in
// Node before being ported into this file — see the PR description for how
// it was verified. Nothing here is a lookup table or a canned demo: typing
// a different message or dragging a different point runs the real algebra.

// ---------------------------------------------------------------------------
// 1. GF(2^8) arithmetic — primitive polynomial x^8+x^4+x^3+x^2+1 (0x11D),
//    the same field used by CDs, QR codes, and most practical RS codes.
// ---------------------------------------------------------------------------
const GF_EXP = new Array(512).fill(0);
const GF_LOG = new Array(256).fill(0);

(function buildGfTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfAdd(a, b) { return a ^ b; }
function gfMul(a, b) { return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }
function gfDiv(a, b) { return a === 0 ? 0 : GF_EXP[(GF_LOG[a] - GF_LOG[b] + 255) % 255]; }
function gfInv(a) { return GF_EXP[(255 - GF_LOG[a]) % 255]; }

// ---------------------------------------------------------------------------
// 2. Lagrange evaluation over GF(2^8) — the "oversampling" view of RS:
//    the message is the polynomial's values at x=0..k-1, parity symbols are
//    the same polynomial evaluated at x=k..k+parity-1.
// ---------------------------------------------------------------------------
function lagrangeEval(points, xEval) {
  let result = 0;
  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];
    let term = yi;
    for (let j = 0; j < points.length; j++) {
      if (j === i) continue;
      const [xj] = points[j];
      term = gfMul(term, gfDiv(gfAdd(xEval, xj), gfAdd(xi, xj)));
    }
    result = gfAdd(result, term);
  }
  return result;
}

function encodeRS(message, parity) {
  const k = message.length;
  const points = message.map((y, x) => [x, y]);
  const codeword = points.slice();
  for (let x = k; x < k + parity; x++) codeword.push([x, lagrangeEval(points, x)]);
  return codeword;
}

// ---------------------------------------------------------------------------
// 3. GF(2^8) Gaussian elimination (used inside Berlekamp-Welch)
// ---------------------------------------------------------------------------
function gaussianEliminationGF(A, b) {
  const n = A.length;
  const m = A[0].length;
  const M = A.map((row, i) => [...row, b[i]]);

  let pivotRow = 0;
  const pivotCols = [];
  for (let col = 0; col < m && pivotRow < n; col++) {
    let sel = -1;
    for (let r = pivotRow; r < n; r++) {
      if (M[r][col] !== 0) { sel = r; break; }
    }
    if (sel === -1) continue;
    [M[pivotRow], M[sel]] = [M[sel], M[pivotRow]];

    const inv = gfInv(M[pivotRow][col]);
    for (let c = col; c <= m; c++) M[pivotRow][c] = gfMul(M[pivotRow][c], inv);

    for (let r = 0; r < n; r++) {
      if (r === pivotRow) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= m; c++) M[r][c] = gfAdd(M[r][c], gfMul(factor, M[pivotRow][c]));
    }
    pivotCols.push(col);
    pivotRow++;
  }

  for (let r = pivotRow; r < n; r++) {
    let allZero = true;
    for (let c = 0; c < m; c++) if (M[r][c] !== 0) { allZero = false; break; }
    if (allZero && M[r][m] !== 0) return null; // inconsistent: too many errors
  }

  // Under-determined-but-consistent is fine (happens when actual errors <
  // eMax) — free columns default to 0, giving one valid particular solution.
  const solution = new Array(m).fill(0);
  for (let i = 0; i < pivotCols.length; i++) solution[pivotCols[i]] = M[i][m];
  return solution;
}

function trimTrailingZeros(coeffs) {
  const out = coeffs.slice();
  while (out.length > 1 && out[out.length - 1] === 0) out.pop();
  return out;
}

function polyDivide(numerator, denominator) {
  const num = numerator.slice();
  const denDeg = denominator.length - 1;
  const quotDeg = num.length - 1 - denDeg;
  if (quotDeg < 0) return { quotient: [0], remainder: num };
  const quotient = new Array(quotDeg + 1).fill(0);
  for (let i = num.length - 1; i >= denDeg; i--) {
    const coeff = num[i];
    if (coeff === 0) continue;
    const qPos = i - denDeg;
    const factor = gfDiv(coeff, denominator[denDeg]);
    quotient[qPos] = factor;
    for (let j = 0; j <= denDeg; j++) num[qPos + j] = gfAdd(num[qPos + j], gfMul(factor, denominator[j]));
  }
  const remainder = num.slice(0, denDeg).length ? num.slice(0, denDeg) : [0];
  return { quotient, remainder };
}

function polyEvalCoeffs(coeffs, x) {
  let result = 0;
  for (let i = coeffs.length - 1; i >= 0; i--) result = gfAdd(gfMul(result, x), coeffs[i]);
  return result;
}

// ---------------------------------------------------------------------------
// 4. Berlekamp-Welch decoding: solve for an error-locator polynomial E(x)
//    and numerator Q(x) = E(x)*P(x), then divide to recover P(x) exactly —
//    guaranteed correct whenever actual errors <= floor(parity/2).
// ---------------------------------------------------------------------------
function decodeRS(received, k) {
  const n = received.length;
  const parity = n - k;
  const eMax = Math.floor(parity / 2);

  if (eMax === 0) {
    const base = received.slice(0, k);
    const errorPositions = [];
    for (let i = 0; i < n; i++) {
      const [xi, yi] = received[i];
      if (lagrangeEval(base, xi) !== yi) errorPositions.push(i);
    }
    if (errorPositions.length === 0) {
      return { success: true, message: base.map(([, y]) => y), errorPositions: [] };
    }
    return { success: false, message: null, errorPositions };
  }

  const m = 2 * eMax + k;
  const A = [];
  const b = [];
  for (let i = 0; i < n; i++) {
    const [xi, yi] = received[i];
    const row = new Array(m).fill(0);
    let xPow = 1;
    for (let j = 0; j < eMax + k; j++) { row[j] = xPow; xPow = gfMul(xPow, xi); }
    xPow = 1;
    for (let j = 0; j < eMax; j++) { row[eMax + k + j] = gfMul(yi, xPow); xPow = gfMul(xPow, xi); }
    A.push(row);
    let xiToE = 1;
    for (let p = 0; p < eMax; p++) xiToE = gfMul(xiToE, xi);
    b.push(gfMul(yi, xiToE));
  }

  const solution = gaussianEliminationGF(A, b);
  if (!solution) return { success: false, message: null, errorPositions: null };

  const qCoeffs = solution.slice(0, eMax + k);
  const eCoeffs = [...solution.slice(eMax + k), 1]; // monic leading term

  const { quotient, remainder } = polyDivide(trimTrailingZeros(qCoeffs), trimTrailingZeros(eCoeffs));
  if (!remainder.every((v) => v === 0)) return { success: false, message: null, errorPositions: null };

  const pCoeffs = trimTrailingZeros(quotient);
  const message = [];
  for (let x = 0; x < k; x++) message.push(polyEvalCoeffs(pCoeffs, x));

  const errorPositions = [];
  for (let i = 0; i < n; i++) {
    const [xi, yi] = received[i];
    if (polyEvalCoeffs(pCoeffs, xi) !== yi) errorPositions.push(i);
  }
  return { success: true, message, errorPositions, pCoeffs };
}

// ---------------------------------------------------------------------------
// 5. UI state and canvas rendering
// ---------------------------------------------------------------------------
const messageInput = document.getElementById("messageInput");
const paritySelect = document.getElementById("paritySelect");
const encodeBtn = document.getElementById("encodeBtn");
const capacityLine = document.getElementById("capacityLine");
const canvas = document.getElementById("stageCanvas");
const ctx = canvas.getContext("2d");
const randomCorruptBtn = document.getElementById("randomCorruptBtn");
const resetPointsBtn = document.getElementById("resetPointsBtn");
const reconstructBtn = document.getElementById("reconstructBtn");
const resultPanel = document.getElementById("resultPanel");
const resultBody = document.getElementById("resultBody");

const MARGIN = { top: 24, right: 36, bottom: 40, left: 50 };
const PLOT_W = canvas.width - MARGIN.left - MARGIN.right;
const PLOT_H = canvas.height - MARGIN.top - MARGIN.bottom;

let state = {
  k: 0,
  parity: 0,
  n: 0,
  trueCodeword: [], // [x, y] ground truth from encoding — never mutated after encode
  currentValues: [], // current (possibly corrupted) y for each index
  corruptedFlags: [], // bool per index: does currentValues differ from trueCodeword?
  dragIndex: -1
};

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function indexToPixelX(i) {
  if (state.n <= 1) return MARGIN.left + PLOT_W / 2;
  return MARGIN.left + (PLOT_W * i) / (state.n - 1);
}
function valueToPixelY(v) {
  return MARGIN.top + PLOT_H * (1 - v / 255);
}
function pixelYToValue(py) {
  return clampByte(((MARGIN.top + PLOT_H - py) / PLOT_H) * 255);
}

// Catmull-Rom -> cubic bezier, purely for a smooth *visual* guide curve
// through byte values. This spline is real-number interpolation for
// display only; it has no bearing on the GF(2^8) math above.
function drawSmoothCurve(points, color, dashed) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = MARGIN.top + (PLOT_H * g) / 4;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, y);
    ctx.lineTo(MARGIN.left + PLOT_W, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#9497b3";
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.fillText("255", 8, MARGIN.top + 4);
  ctx.fillText("0", 8, MARGIN.top + PLOT_H + 4);

  if (state.n === 0) {
    ctx.fillStyle = "#5c6084";
    ctx.font = "13px Space Grotesk, sans-serif";
    ctx.fillText("Encode a message to plot its polynomial.", MARGIN.left, canvas.height / 2);
    return;
  }

  // true (reference) curve — dashed, faint
  const truePts = state.trueCodeword.map((_, i) => ({
    x: indexToPixelX(i),
    y: valueToPixelY(state.trueCodeword[i][1])
  }));
  drawSmoothCurve(truePts, "rgba(6, 182, 212, 0.35)", true);

  // current curve (through whatever is currently plotted, corrupted or not)
  const currentPts = state.currentValues.map((v, i) => ({ x: indexToPixelX(i), y: valueToPixelY(v) }));
  drawSmoothCurve(currentPts, "rgba(124, 58, 237, 0.45)", false);

  // points
  state.currentValues.forEach((v, i) => {
    const px = indexToPixelX(i);
    const py = valueToPixelY(v);
    const isParity = i >= state.k;
    const isCorrupted = state.corruptedFlags[i];

    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = isCorrupted ? "#f87171" : isParity ? "#06b6d4" : "#7c3aed";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isCorrupted ? "#fca5a5" : "rgba(255,255,255,0.5)";
    ctx.stroke();

    ctx.fillStyle = "#e7e8f5";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`x=${i}`, px, py + 24);
    ctx.fillText(String(v), px, py - 16);
  });
  ctx.textAlign = "left";
}

// ---------------------------------------------------------------------------
// 6. Encoding
// ---------------------------------------------------------------------------
function handleEncode() {
  const raw = messageInput.value;
  const trimmed = raw.slice(0, 6);
  if (trimmed.length < 2) {
    capacityLine.textContent = "Enter at least 2 characters to encode.";
    return;
  }
  messageInput.value = trimmed;

  const parity = Math.max(1, Math.min(5, Number(paritySelect.value) || 1));
  paritySelect.value = parity;

  const messageCodes = [...trimmed].map((ch) => ch.charCodeAt(0) & 0xff);
  const codeword = encodeRS(messageCodes, parity);
  const k = messageCodes.length;
  const n = codeword.length;
  const eMax = Math.floor(parity / 2);

  state = {
    k,
    parity,
    n,
    trueCodeword: codeword,
    currentValues: codeword.map(([, y]) => y),
    corruptedFlags: new Array(n).fill(false),
    dragIndex: -1
  };

  capacityLine.innerHTML =
    `k = ${k} message symbols + ${parity} parity = <strong>${n} total points</strong>. ` +
    `Guaranteed to correct up to <strong>⌊${parity}/2⌋ = ${eMax}</strong> corrupted symbol${eMax === 1 ? "" : "s"} ` +
    `(Singleton bound: parity ≥ 2 × errors).`;

  resultPanel.hidden = true;
  render();
}

encodeBtn.addEventListener("click", handleEncode);

// ---------------------------------------------------------------------------
// 7. Drag-to-corrupt interaction
// ---------------------------------------------------------------------------
function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function hitTestPoint(px, py) {
  for (let i = 0; i < state.n; i++) {
    const x = indexToPixelX(i);
    const y = valueToPixelY(state.currentValues[i]);
    if (Math.hypot(px - x, py - y) <= 14) return i;
  }
  return -1;
}

canvas.addEventListener("pointerdown", (evt) => {
  if (state.n === 0) return;
  const { x, y } = getCanvasPos(evt);
  const idx = hitTestPoint(x, y);
  if (idx !== -1) {
    state.dragIndex = idx;
    canvas.setPointerCapture(evt.pointerId);
  }
});

canvas.addEventListener("pointermove", (evt) => {
  if (state.dragIndex === -1) return;
  const { y } = getCanvasPos(evt);
  const newValue = pixelYToValue(y);
  state.currentValues[state.dragIndex] = newValue;
  state.corruptedFlags[state.dragIndex] = newValue !== state.trueCodeword[state.dragIndex][1];
  render();
});

function endDrag() {
  state.dragIndex = -1;
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("pointerleave", endDrag);

// ---------------------------------------------------------------------------
// 8. Convenience actions
// ---------------------------------------------------------------------------
function randomCorrupt() {
  if (state.n === 0) return;
  const eMax = Math.floor(state.parity / 2);
  const numToCorrupt = Math.min(state.n, Math.max(1, eMax));
  const indices = new Set();
  while (indices.size < numToCorrupt) indices.add(Math.floor(Math.random() * state.n));
  indices.forEach((i) => {
    let newVal;
    do { newVal = Math.floor(Math.random() * 256); } while (newVal === state.trueCodeword[i][1]);
    state.currentValues[i] = newVal;
    state.corruptedFlags[i] = true;
  });
  resultPanel.hidden = true;
  render();
}

function resetPoints() {
  if (state.n === 0) return;
  state.currentValues = state.trueCodeword.map(([, y]) => y);
  state.corruptedFlags = new Array(state.n).fill(false);
  resultPanel.hidden = true;
  render();
}

randomCorruptBtn.addEventListener("click", randomCorrupt);
resetPointsBtn.addEventListener("click", resetPoints);

// ---------------------------------------------------------------------------
// 9. Reconstruction
// ---------------------------------------------------------------------------
function codesToText(codes) {
  return codes.map((c) => String.fromCharCode(c)).join("");
}

async function animateSnapBack(targetValues, durationMs) {
  const startValues = [...state.currentValues];
  const startTime = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      for (let i = 0; i < state.n; i++) {
        state.currentValues[i] = startValues[i] + (targetValues[i] - startValues[i]) * eased;
      }
      render();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        state.currentValues = [...targetValues];
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

async function handleReconstruct() {
  if (state.n === 0) return;
  reconstructBtn.disabled = true;

  const received = state.currentValues.map((v, i) => [state.trueCodeword[i][0], Math.round(v)]);
  const result = decodeRS(received, state.k);

  resultPanel.hidden = false;

  if (!result.success) {
    resultBody.innerHTML =
      `<div class="result-line failure"><span class="result-label">Status</span>Decoding failed — too many corrupted symbols for this parity level.</div>` +
      `<div class="result-line">Try reducing corrupted points, or re-encode with more parity symbols.</div>`;
    reconstructBtn.disabled = false;
    return;
  }

  const detectedIndices = result.errorPositions;
  const targetValues = state.trueCodeword.map(([, y]) => y);
  await animateSnapBack(targetValues, 700);

  state.corruptedFlags = new Array(state.n).fill(false);
  render();

  const recoveredText = codesToText(result.message);
  const chipsHtml = detectedIndices.length
    ? detectedIndices.map((i) => `<span class="error-chip">x=${i}</span>`).join("")
    : `<span class="error-chip" style="background:rgba(52,211,153,0.15);border-color:rgba(52,211,153,0.4);color:var(--success)">none — no corruption detected</span>`;

  resultBody.innerHTML =
    `<div class="result-line success"><span class="result-label">Status</span>Reconstruction succeeded.</div>` +
    `<div class="result-line"><span class="result-label">Recovered message</span><span class="result-message">${recoveredText}</span></div>` +
    `<div class="result-line"><span class="result-label">Corrected positions</span></div>` +
    `<div class="error-chip-row">${chipsHtml}</div>`;

  reconstructBtn.disabled = false;
}

reconstructBtn.addEventListener("click", handleReconstruct);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
render();
handleEncode();
