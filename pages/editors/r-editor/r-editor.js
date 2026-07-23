document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initREditor();
  } catch (e) {
    console.error('REditor:', e);
  }
});

/* ---------------------------------------------------------------------- */
/* Page boilerplate — copied to match python-editor.js exactly            */
/* ---------------------------------------------------------------------- */
function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById('loading-screen');
    if (s) s.classList.add('hidden');
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initNavbar() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    overlay.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const icon = menuToggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !isOpen);
      icon.classList.toggle('fa-times', isOpen);
    }
  };
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  overlay.addEventListener('click', () => toggleMenu(false));
  navLinks
    .querySelectorAll('a')
    .forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;
  document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
    const parent = toggle.closest('.has-dropdown');
    const menu = parent?.querySelector('.dropdown-menu');
    if (!parent || !menu) return;
    let t;
    parent.addEventListener('mouseenter', () => {
      if (!isMobile()) {
        clearTimeout(t);
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    parent.addEventListener('mouseleave', () => {
      if (!isMobile()) {
        t = setTimeout(() => {
          parent.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 250);
      }
    });
    toggle.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault();
        e.stopPropagation();
        const o = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', o);
      }
    });
  });
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav)
      nav.style.background = window.scrollY > 100 ? 'rgba(10,10,26,0.95)' : 'rgba(10,10,26,0.85)';
  });
}

/* ---------------------------------------------------------------------- */
/* Example snippets & built-in datasets                                   */
/* ---------------------------------------------------------------------- */
const R_EXAMPLES = {
  basics: `x <- 5\ny <- 3\nz <- x * y + 2\nprint(z)\ncat("x + y =", x + y)`,
  vectors: `scores <- c(88, 72, 95, 61, 79)\nprint(scores)\ncat("mean:", mean(scores))\ncat("sum:", sum(scores))`,
  dataframe: `df <- data.frame(\n  name = c("Amara", "Ravi", "Lin"),\n  score = c(88, 72, 95)\n)\ndf\ncat("average score:", mean(df$score))`,
  dataset: `students\ncat("average hours studied:", mean(students$hours_studied))`,
  plot: `x <- 1:10\ny <- c(2, 4, 3, 6, 8, 7, 9, 12, 11, 15)\nplot(x, y)`,
  hist: `values <- c(4, 8, 15, 16, 23, 42, 4, 8, 15, 16, 23, 8, 15)\nhist(values)`,
  barplot: `barplot(sales$revenue)`,
};

const DATASETS = {
  students: {
    __type: 'dataframe',
    colNames: ['name', 'score', 'hours_studied'],
    cols: {
      name: ['Amara', 'Ravi', 'Lin', 'Sofia', 'Jamal', 'Priya'],
      score: [88, 72, 95, 61, 79, 84],
      hours_studied: [6, 3, 8, 2, 5, 7],
    },
    nrow: 6,
  },
  sales: {
    __type: 'dataframe',
    colNames: ['month', 'revenue'],
    cols: {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      revenue: [1200, 1450, 1100, 1800, 2100, 1950],
    },
    nrow: 6,
  },
};

/* ---------------------------------------------------------------------- */
/* R interpreter — a defined subset, genuinely evaluated (not scripted).  */
/*                                                                        */
/* NOTE ON EXECUTION ENGINE: this runs entirely client-side. It does NOT  */
/* call an external execution API, unlike python-editor.js's call to     */
/* Piston (emkc.org). That call appears to now require an API key this   */
/* project doesn't have (Piston restricted public access Feb 2026) — see */
/* PR discussion. If that gets resolved, swap the body of runRCode()     */
/* below for a fetch() to Piston with language "rscript" (alias "r"),    */
/* version "4.1.1" — confirmed via GET /api/v2/piston/runtimes. Plot     */
/* rendering would still need this local interpreter, since Piston only  */
/* returns stdout/stderr text, not images.                               */
/* ---------------------------------------------------------------------- */
class RError extends Error {}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let str = '';
      while (j < n && src[j] !== quote) {
        str += src[j];
        j++;
      }
      tokens.push({ type: 'STRING', value: str });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i,
        num = '';
      while (j < n && /[0-9.]/.test(src[j])) {
        num += src[j];
        j++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      i = j;
      continue;
    }
    if (/[A-Za-z_.]/.test(ch)) {
      let j = i,
        ident = '';
      while (j < n && /[A-Za-z0-9_.]/.test(src[j])) {
        ident += src[j];
        j++;
      }
      tokens.push({ type: 'IDENT', value: ident });
      i = j;
      continue;
    }
    if (ch === '<' && src[i + 1] === '-') {
      tokens.push({ type: 'ASSIGN' });
      i += 2;
      continue;
    }
    if (ch === '=') {
      tokens.push({ type: 'EQ' });
      i++;
      continue;
    }
    if (ch === '$') {
      tokens.push({ type: 'DOLLAR' });
      i++;
      continue;
    }
    if ('+-*/'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA' });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'COLON' });
      i++;
      continue;
    }
    i++; // unknown char — skip rather than crash the whole line
  }
  return tokens;
}

function parseStatement(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr() {
    let node = parseTerm();
    while (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
      const op = next().value;
      node = { type: 'binop', op, left: node, right: parseTerm() };
    }
    return node;
  }
  function parseTerm() {
    let node = parseRange();
    while (peek() && peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
      const op = next().value;
      node = { type: 'binop', op, left: node, right: parseRange() };
    }
    return node;
  }
  function parseRange() {
    let node = parseFactor();
    if (peek() && peek().type === 'COLON') {
      next();
      node = { type: 'range', from: node, to: parseFactor() };
    }
    return node;
  }
  function parseFactor() {
    const tok = peek();
    if (!tok) throw new RError('unexpected end of statement');
    if (tok.type === 'OP' && tok.value === '-') {
      next();
      return { type: 'neg', expr: parseFactor() };
    }
    if (tok.type === 'NUMBER') {
      next();
      return { type: 'num', value: tok.value };
    }
    if (tok.type === 'STRING') {
      next();
      return { type: 'str', value: tok.value };
    }
    if (tok.type === 'LPAREN') {
      next();
      const inner = parseExpr();
      if (peek() && peek().type === 'RPAREN') next();
      return inner;
    }
    if (tok.type === 'IDENT') {
      const name = next().value;
      if (name === 'TRUE' || name === 'T') return { type: 'bool', value: true };
      if (name === 'FALSE' || name === 'F') return { type: 'bool', value: false };
      let node;
      if (peek() && peek().type === 'LPAREN') {
        next();
        const args = [];
        while (peek() && peek().type !== 'RPAREN') {
          let argName = null;
          if (peek().type === 'IDENT' && tokens[pos + 1] && tokens[pos + 1].type === 'EQ') {
            argName = next().value;
            next();
          }
          args.push({ name: argName, value: parseExpr() });
          if (peek() && peek().type === 'COMMA') next();
        }
        if (peek() && peek().type === 'RPAREN') next();
        node = { type: 'call', name, args };
      } else {
        node = { type: 'ident', name };
      }
      while (peek() && peek().type === 'DOLLAR') {
        next();
        if (peek() && peek().type === 'IDENT')
          node = { type: 'dollar', object: node, prop: next().value };
        else break;
      }
      return node;
    }
    throw new RError(`unexpected token near "${tok.value ?? tok.type}"`);
  }

  if (tokens[0]?.type === 'IDENT' && tokens[1]?.type === 'ASSIGN') {
    pos = 2;
    return { type: 'assign', name: tokens[0].value, expr: parseExpr() };
  }
  if (tokens[0]?.type === 'IDENT' && tokens[1]?.type === 'EQ') {
    pos = 2;
    return { type: 'assign', name: tokens[0].value, expr: parseExpr() };
  }
  pos = 0;
  return { type: 'expr', expr: parseExpr() };
}

function evalNode(node, env) {
  switch (node.type) {
    case 'num':
    case 'str':
    case 'bool':
      return node.value;
    case 'neg': {
      const v = evalNode(node.expr, env);
      return Array.isArray(v) ? v.map((x) => -Number(x)) : -Number(v);
    }
    case 'range':
      return buildRange(Number(evalNode(node.from, env)), Number(evalNode(node.to, env)));
    case 'binop':
      return applyBinOp(node.op, evalNode(node.left, env), evalNode(node.right, env));
    case 'ident':
      if (Object.prototype.hasOwnProperty.call(env, node.name)) return env[node.name];
      throw new RError(`object '${node.name}' not found`);
    case 'dollar': {
      const obj = evalNode(node.object, env);
      if (obj && obj.__type === 'dataframe') {
        if (Object.prototype.hasOwnProperty.call(obj.cols, node.prop)) return obj.cols[node.prop];
        throw new RError(`column '${node.prop}' not found`);
      }
      throw new RError('$ operator is only supported on data frames');
    }
    case 'call':
      return evalCall(node.name, node.args, env);
    default:
      throw new RError('could not evaluate statement');
  }
}

function buildRange(from, to) {
  const out = [];
  if (from <= to) for (let v = from; v <= to; v++) out.push(v);
  else for (let v = from; v >= to; v--) out.push(v);
  return out;
}

function applyBinOp(op, l, r) {
  const lArr = Array.isArray(l),
    rArr = Array.isArray(r);
  if (!lArr && !rArr) return arith(op, Number(l), Number(r));
  const len = Math.max(lArr ? l.length : 1, rArr ? r.length : 1);
  const out = [];
  for (let i = 0; i < len; i++)
    out.push(arith(op, Number(lArr ? l[i % l.length] : l), Number(rArr ? r[i % r.length] : r)));
  return out;
}

function arith(op, a, b) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
    default:
      throw new RError(`unsupported operator '${op}'`);
  }
}

function evalCall(name, argNodes, env) {
  const evalArgs = () => argNodes.map((a) => ({ name: a.name, value: evalNode(a.value, env) }));
  switch (name) {
    case 'c': {
      const out = [];
      for (const a of evalArgs()) Array.isArray(a.value) ? out.push(...a.value) : out.push(a.value);
      return out;
    }
    case 'length': {
      const [a] = evalArgs();
      return Array.isArray(a.value) ? a.value.length : 1;
    }
    case 'sum':
      return flattenNumeric(evalArgs()).reduce((s, v) => s + v, 0);
    case 'mean': {
      const nums = flattenNumeric(evalArgs());
      return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : NaN;
    }
    case 'round': {
      const args = evalArgs();
      const val = args[0] ? args[0].value : 0;
      const named = namedArgMap(args);
      const digits =
        named.digits !== undefined ? Number(named.digits) : args[1] ? Number(args[1].value) : 0;
      const factor = Math.pow(10, digits);
      const roundOne = (v) => Math.round(Number(v) * factor) / factor;
      return Array.isArray(val) ? val.map(roundOne) : roundOne(val);
    }
    case 'seq': {
      const args = evalArgs();
      const named = namedArgMap(args);
      const from = Number(named.from !== undefined ? named.from : args[0] ? args[0].value : 1);
      const to = Number(named.to !== undefined ? named.to : args[1] ? args[1].value : from);
      const by = Number(named.by !== undefined ? named.by : args[2] ? args[2].value : 1);
      const out = [];
      if (by > 0) for (let v = from; v <= to + 1e-9; v += by) out.push(round6(v));
      else if (by < 0) for (let v = from; v >= to - 1e-9; v += by) out.push(round6(v));
      return out;
    }
    case 'paste': {
      const args = evalArgs();
      const named = namedArgMap(args);
      const sep = named.sep !== undefined ? String(named.sep) : ' ';
      return args
        .filter((a) => a.name !== 'sep')
        .map((a) => formatForPaste(a.value))
        .join(sep);
    }
    case 'nrow': {
      const [a] = evalArgs();
      if (a.value?.__type === 'dataframe') return a.value.nrow;
      throw new RError("argument to 'nrow' is not a data.frame");
    }
    case 'ncol': {
      const [a] = evalArgs();
      if (a.value?.__type === 'dataframe') return a.value.colNames.length;
      throw new RError("argument to 'ncol' is not a data.frame");
    }
    case 'data.frame': {
      const args = evalArgs();
      const colNames = [],
        cols = {};
      let nrow = 0;
      for (const a of args) {
        if (!a.name) throw new RError('data.frame() columns must be named, e.g. col = c(...)');
        const colVal = Array.isArray(a.value) ? a.value : [a.value];
        colNames.push(a.name);
        cols[a.name] = colVal;
        nrow = Math.max(nrow, colVal.length);
      }
      return { __type: 'dataframe', colNames, cols, nrow };
    }
    case 'print':
    case 'cat':
    case 'plot':
    case 'hist':
    case 'barplot':
    case 'View':
      throw new RError(`'${name}()' must be a standalone statement, not nested in an expression`);
    default:
      throw new RError(`could not find function "${name}"`);
  }
}

function namedArgMap(args) {
  const m = {};
  for (const a of args) if (a.name) m[a.name] = a.value;
  return m;
}
function flattenNumeric(args) {
  const out = [];
  for (const a of args)
    Array.isArray(a.value) ? out.push(...a.value.map(Number)) : out.push(Number(a.value));
  return out;
}
function formatForPaste(v) {
  return Array.isArray(v) ? v.join(' ') : String(v);
}
function round6(v) {
  return Math.round(v * 1e6) / 1e6;
}
function toNumArray(v) {
  return Array.isArray(v) ? v.map(Number) : [Number(v)];
}

const ACTION_FNS = ['print', 'cat', 'plot', 'hist', 'barplot', 'View'];

function executeLine(line, env, outputEntries) {
  const tokens = tokenize(line);
  if (tokens.length === 0) return;
  const stmt = parseStatement(tokens);
  if (stmt.type === 'assign') {
    env[stmt.name] = evalNode(stmt.expr, env);
    return;
  }
  if (stmt.expr.type === 'call' && ACTION_FNS.includes(stmt.expr.name)) {
    runAction(stmt.expr, env, outputEntries);
    return;
  }
  outputEntries.push(formatAutoPrint(evalNode(stmt.expr, env)));
}

function runAction(node, env, outputEntries) {
  const args = node.args.map((a) => ({ name: a.name, value: evalNode(a.value, env) }));
  switch (node.name) {
    case 'print':
    case 'View':
      outputEntries.push(formatAutoPrint(args[0] ? args[0].value : undefined));
      return;
    case 'cat': {
      const named = namedArgMap(args);
      const sep = named.sep !== undefined ? String(named.sep) : ' ';
      outputEntries.push({
        kind: 'text',
        text: args
          .filter((a) => a.name !== 'sep')
          .map((a) => formatForPaste(a.value))
          .join(sep),
      });
      return;
    }
    case 'plot': {
      const yArg = args.find((a, i) => a.name === 'y' || i === 1);
      let x, y;
      if (yArg) {
        x = toNumArray(args[0] ? args[0].value : []);
        y = toNumArray(yArg.value);
      } else {
        y = toNumArray(args[0] ? args[0].value : []);
        x = y.map((_, i) => i + 1);
      }
      outputEntries.push({ kind: 'plot', plotType: 'scatter', x, y });
      return;
    }
    case 'hist':
      outputEntries.push({
        kind: 'plot',
        plotType: 'hist',
        data: toNumArray(args[0] ? args[0].value : []),
      });
      return;
    case 'barplot':
      outputEntries.push({
        kind: 'plot',
        plotType: 'bar',
        data: toNumArray(args[0] ? args[0].value : []),
      });
      return;
  }
}

function formatAutoPrint(value) {
  if (value && value.__type === 'dataframe') return { kind: 'table', df: value };
  if (Array.isArray(value))
    return { kind: 'text', text: `[1] ${value.map(formatScalar).join(' ')}` };
  return { kind: 'text', text: `[1] ${formatScalar(value)}` };
}

function formatScalar(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return Number.isNaN(v) ? 'NA' : String(round6(v));
  return String(v);
}

function stripComment(line) {
  let inQuote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === '#') return line.slice(0, i);
  }
  return line;
}

function parenDelta(line) {
  let delta = 0,
    inQuote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === '(') delta++;
    else if (ch === ')') delta--;
  }
  return delta;
}

function freshEnv() {
  const env = {};
  for (const key in DATASETS) env[key] = JSON.parse(JSON.stringify(DATASETS[key]));
  return env;
}

/** Execution seam — see NOTE above the interpreter section. */
async function runRCode(source) {
  const env = freshEnv();
  const outputEntries = [];
  let buffer = '',
    balance = 0,
    bufferHasContent = false;

  const flush = () => {
    const stmt = buffer.trim();
    buffer = '';
    balance = 0;
    bufferHasContent = false;
    if (!stmt) return;
    try {
      executeLine(stmt, env, outputEntries);
    } catch (e) {
      outputEntries.push({
        kind: 'error',
        text: `Error: ${e instanceof RError ? e.message : e.message || 'unknown error'}`,
      });
    }
  };

  for (const rawLine of source.split('\n')) {
    const line = stripComment(rawLine);
    if (!line.trim() && !bufferHasContent) continue;
    buffer += (buffer ? '\n' : '') + line;
    balance += parenDelta(line);
    if (line.trim()) bufferHasContent = true;
    if (bufferHasContent && balance <= 0) flush();
  }
  if (bufferHasContent)
    outputEntries.push({
      kind: 'error',
      text: 'Error: unexpected end of input (unmatched parenthesis)',
    });

  return { entries: outputEntries, hasError: outputEntries.some((e) => e.kind === 'error') };
}

/* ---------------------------------------------------------------------- */
/* Rendering                                                              */
/* ---------------------------------------------------------------------- */
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderOutput(outputBody, entries) {
  outputBody.innerHTML = '';
  if (entries.length === 0) {
    outputBody.innerHTML = '<span class="re-output-placeholder">Ran with no output.</span>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const entry of entries) frag.appendChild(renderEntry(entry));
  outputBody.appendChild(frag);
}

function renderEntry(entry) {
  if (entry.kind === 'text') {
    const div = document.createElement('div');
    div.className = 're-out-line';
    div.textContent = entry.text;
    return div;
  }
  if (entry.kind === 'error') {
    const div = document.createElement('div');
    div.className = 're-out-line error';
    div.textContent = entry.text.replace(/^Error:\s*/, '');
    return div;
  }
  if (entry.kind === 'table') return renderTable(entry.df);
  if (entry.kind === 'plot') return renderPlot(entry);
  return document.createElement('div');
}

function renderTable(df) {
  const wrap = document.createElement('div');
  wrap.className = 're-out-table-wrap';
  const table = document.createElement('table');
  table.className = 're-out-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th></th>' + df.colNames.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (let r = 0; r < df.nrow; r++) {
    const tr = document.createElement('tr');
    let rowHtml = `<td>${r + 1}</td>`;
    for (const col of df.colNames) {
      const val = df.cols[col][r];
      rowHtml += `<td>${escapeHtml(formatScalar(val === undefined ? NaN : val))}</td>`;
    }
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

const PLOT_COLORS = {
  primary: '#276dc3',
  accent: '#75aadb',
  axis: 'rgba(255,255,255,0.35)',
  text: '#9ca3af',
};

function renderPlot(entry) {
  const wrap = document.createElement('div');
  wrap.className = 're-out-plot';
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 260;
  wrap.appendChild(canvas);
  if (entry.plotType === 'scatter') drawScatter(canvas, entry.x, entry.y);
  else if (entry.plotType === 'hist') drawHist(canvas, entry.data);
  else if (entry.plotType === 'bar') drawBar(canvas, entry.data);
  const caption = document.createElement('div');
  caption.className = 're-out-plot-caption';
  caption.textContent = "Rendered locally from your code's data.";
  wrap.appendChild(caption);
  return wrap;
}

function plotFrame(ctx, w, h, pad) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = PLOT_COLORS.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
}

function drawScatter(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!x.length || !y.length) return;
  const xMin = Math.min(...x),
    xMax = Math.max(...x);
  const yMin = Math.min(...y),
    yMax = Math.max(...y);
  const xRange = xMax - xMin || 1,
    yRange = yMax - yMin || 1;
  const toPx = (vx, vy) => [
    pad + ((vx - xMin) / xRange) * (w - 2 * pad),
    h - pad - ((vy - yMin) / yRange) * (h - 2 * pad),
  ];
  ctx.strokeStyle = PLOT_COLORS.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  x.forEach((vx, i) => {
    const [px, py] = toPx(vx, y[i]);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.fillStyle = PLOT_COLORS.primary;
  x.forEach((vx, i) => {
    const [px, py] = toPx(vx, y[i]);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  drawMinMaxLabels(ctx, w, h, pad, xMin, xMax, yMin, yMax);
}

function drawHist(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!data.length) return;
  const min = Math.min(...data),
    max = Math.max(...data);
  const binCount = Math.max(4, Math.min(12, Math.round(Math.sqrt(data.length))));
  const binSize = (max - min || 1) / binCount;
  const bins = new Array(binCount).fill(0);
  data.forEach((v) => {
    let idx = Math.floor((v - min) / binSize);
    idx = Math.max(0, Math.min(binCount - 1, idx));
    bins[idx]++;
  });
  const maxCount = Math.max(...bins) || 1;
  const barW = (w - 2 * pad) / binCount;
  ctx.fillStyle = PLOT_COLORS.primary;
  bins.forEach((count, i) => {
    const barH = (count / maxCount) * (h - 2 * pad);
    ctx.fillRect(pad + i * barW + 2, h - pad - barH, barW - 4, barH);
  });
  ctx.fillStyle = PLOT_COLORS.text;
  ctx.font = '10px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatScalar(min), pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(formatScalar(max), w - pad, h - pad + 14);
}

function drawBar(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height,
    pad = 36;
  plotFrame(ctx, w, h, pad);
  if (!data.length) return;
  const maxVal = Math.max(...data, 0),
    minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const barW = (w - 2 * pad) / data.length;
  const zeroY = h - pad - ((0 - minVal) / range) * (h - 2 * pad);
  ctx.fillStyle = PLOT_COLORS.accent;
  data.forEach((v, i) => {
    const barY = h - pad - ((v - minVal) / range) * (h - 2 * pad);
    ctx.fillRect(pad + i * barW + 3, Math.min(barY, zeroY), barW - 6, Math.abs(zeroY - barY));
  });
}

function drawMinMaxLabels(ctx, w, h, pad, xMin, xMax, yMin, yMax) {
  ctx.fillStyle = PLOT_COLORS.text;
  ctx.font = '10px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(formatScalar(xMin), pad, h - pad + 14);
  ctx.textAlign = 'right';
  ctx.fillText(formatScalar(xMax), w - pad, h - pad + 14);
  ctx.save();
  ctx.translate(10, h - pad);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.fillText(formatScalar(yMin), 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(10, pad);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.fillText(formatScalar(yMax), 0, 0);
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* Editor init — mirrors initPythonEditor()'s structure                   */
/* ---------------------------------------------------------------------- */
function initREditor() {
  const editor = document.getElementById('reEditor');
  if (!editor) return;

  const outputBody = document.getElementById('reOutputBody');
  const runBtn = document.getElementById('reRunBtn');
  const resetBtn = document.getElementById('reResetBtn');
  const copyBtn = document.getElementById('reCopyBtn');
  const saveBtn = document.getElementById('reSaveBtn');
  const exampleSelect = document.getElementById('reExampleSelect');
  const datasetSelect = document.getElementById('reDatasetSelect');
  const lineNumbers = document.getElementById('reLineNumbers');
  const statusBadge = document.getElementById('reStatusBadge');
  const openSupportBtn = document.getElementById('reOpenSupportBtn');
  const closeSupportBtn = document.getElementById('reCloseSupportBtn');
  const supportModal = document.getElementById('re-support-modal');
  const modalBackdrop = document.getElementById('reModalBackdrop');

  const SAVE_KEY = 'r-editor-draft';
  let runSeq = 0;

  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = saved && saved.trim().length > 0 ? saved : R_EXAMPLES.basics;
  updateLines();

  exampleSelect.addEventListener('change', () => {
    editor.value = R_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  datasetSelect.addEventListener('change', () => {
    const key = datasetSelect.value;
    if (!key) return;
    const insertion = `${key}\n`;
    const start = editor.selectionStart ?? editor.value.length;
    const end = editor.selectionEnd ?? editor.value.length;
    editor.value = editor.value.slice(0, start) + insertion + editor.value.slice(end);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = start + insertion.length;
    datasetSelect.value = '';
    updateLines();
  });

  runBtn.addEventListener('click', runCode);

  resetBtn.addEventListener('click', () => {
    editor.value = R_EXAMPLES[exampleSelect.value] || R_EXAMPLES.basics;
    updateLines();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 2000);
    } catch {
      /* clipboard permission denied — non-fatal */
    }
  });

  saveBtn.addEventListener('click', () => {
    localStorage.setItem(SAVE_KEY, editor.value);
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i>';
    }, 2000);
  });

  editor.addEventListener('input', updateLines);
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      localStorage.setItem(SAVE_KEY, editor.value);
    }
  });

  openSupportBtn?.addEventListener('click', () => {
    supportModal.hidden = false;
  });
  closeSupportBtn?.addEventListener('click', () => {
    supportModal.hidden = true;
  });
  modalBackdrop?.addEventListener('click', () => {
    supportModal.hidden = true;
  });

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="re-output-placeholder">Running...</span>';

    const { entries, hasError } = await runRCode(editor.value);
    if (seq !== runSeq) return; // stale run — a newer one started first

    renderOutput(outputBody, entries);
    setStatus(hasError ? 'error' : 'ready');
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 're-status-ready'],
      running: ['Running', 're-status-running'],
      error: ['Error', 're-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `re-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
}
