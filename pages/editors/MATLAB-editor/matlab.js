// MATLAB Editor — pages/editors/matlab
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// example insertion, .m open/save, and a simulated run (no real MATLAB engine).

const STARTER_PROGRAM = `% hello_world.m
disp('Hello, MATLAB!');
`;

const KEYWORDS = [
  "FUNCTION","END","ENDFUNCTION","IF","ELSEIF","ELSE","ENDIF","FOR","ENDFOR",
  "WHILE","ENDWHILE","SWITCH","CASE","OTHERWISE","ENDSWITCH","BREAK","CONTINUE",
  "RETURN","TRY","CATCH","ENDTRY","GLOBAL","PERSISTENT","CLASSDEF","PROPERTIES",
  "METHODS","ENDCLASSDEF","ENDPROPERTIES","ENDMETHODS","DO","UNTIL"
];

const BUILTINS = [
  "DISP","FPRINTF","SPRINTF","PRINTF","ZEROS","ONES","EYE","RAND","RANDN",
  "SIZE","LENGTH","NUMEL","SUM","MEAN","STD","VAR","MAX","MIN","SORT",
  "SQRT","ABS","SIN","COS","TAN","EXP","LOG","LOG10","MOD","REM","ROUND",
  "FLOOR","CEIL","LINSPACE","LOGSPACE","INV","DET","TRANSPOSE","RESHAPE",
  "PLOT","FIGURE","XLABEL","YLABEL","TITLE","LEGEND","GRID","HOLD","SUBPLOT",
  "EIG","RANK","NORM","CROSS","DOT","LINSOLVE","POLYFIT","POLYVAL","ISEMPTY",
  "STRCMP","NUM2STR","STR2NUM","CLASS","ISA","CELL","STRUCT","FIELDNAMES"
];

const EXAMPLES = [
  {
    title: "RC circuit step response",
    desc: "First-order transient voltage",
    code: `% RC circuit charging response
R = 1000;         % ohms
C = 0.000100;      % farads
V0 = 5;            % supply voltage
tau = R * C;       % time constant

t = 0:0.0005:0.005;
Vc = V0 * (1 - exp(-t / tau));

disp('Time (s)   Vc (V)');
for i = 1:length(t)
    fprintf('%0.4f     %0.4f\\n', t(i), Vc(i));
end
`
  },
  {
    title: "Projectile motion",
    desc: "Range and max height",
    code: `% Projectile motion under gravity
v0 = 40;           % initial speed, m/s
theta = 45;        % launch angle, degrees
g = 9.81;          % gravity, m/s^2

theta_rad = theta * pi / 180;
t_flight = 2 * v0 * sin(theta_rad) / g;
range = v0^2 * sin(2 * theta_rad) / g;
max_height = (v0^2) * (sin(theta_rad)^2) / (2 * g);

fprintf('Time of flight: %0.2f s\\n', t_flight);
fprintf('Range: %0.2f m\\n', range);
fprintf('Max height: %0.2f m\\n', max_height);
`
  },
  {
    title: "Ohm's law sweep",
    desc: "Current across a resistor range",
    code: `% Ohm's law: I = V / R across several resistors
V = 12;                       % volts
R = [100, 220, 470, 1000];    % ohms

I = V ./ R;

disp('R (ohms)   I (A)');
for i = 1:length(R)
    fprintf('%-10d %0.5f\\n', R(i), I(i));
end
`
  },
  {
    title: "Euler ODE solver",
    desc: "Numerical integration of dy/dt = -2y",
    code: `% Euler's method for dy/dt = -2y, y(0) = 1
h = 0.1;
t = 0:h:1;
y = zeros(1, length(t));
y(1) = 1;

for i = 1:length(t)-1
    y(i+1) = y(i) + h * (-2 * y(i));
end

disp('t        y');
for i = 1:length(t)
    fprintf('%0.2f     %0.4f\\n', t(i), y(i));
end
`
  }
];

const MATRIX_EXAMPLES = [
  {
    title: "Matrix inverse & determinant",
    desc: "inv() and det() on a 3x3",
    code: `A = [4 3 2; 1 5 6; 7 8 9];

detA = det(A);
invA = inv(A);

fprintf('Determinant: %0.4f\\n', detA);
disp('Inverse:');
disp(invA);
`
  },
  {
    title: "Solve Ax = b",
    desc: "Linear system via backslash operator",
    code: `A = [2 1 -1; -3 -1 2; -2 1 2];
b = [8; -11; -3];

x = A \\ b;

disp('Solution vector x:');
disp(x);
`
  },
  {
    title: "Eigenvalues",
    desc: "eig() on a symmetric matrix",
    code: `A = [2 1; 1 2];

lambda = eig(A);

disp('Eigenvalues:');
disp(lambda);
`
  },
  {
    title: "Matrix multiplication",
    desc: "2x3 times 3x2",
    code: `A = [1 2 3; 4 5 6];
B = [7 8; 9 10; 11 12];

C = A * B;

disp('Product matrix C:');
disp(C);
`
  }
];

const SNIPPETS = [
  {
    title: "FOR loop",
    desc: "Iterate over a range",
    code: `for i = 1:10
    disp(i);
end`
  },
  {
    title: "IF / ELSEIF / ELSE",
    desc: "Conditional branch",
    code: `if x > 0
    disp('Positive');
elseif x < 0
    disp('Negative');
else
    disp('Zero');
end`
  },
  {
    title: "FUNCTION definition",
    desc: "Reusable local function",
    code: `function y = square(x)
    y = x^2;
end`
  },
  {
    title: "fprintf",
    desc: "Formatted output",
    code: `fprintf('Value: %0.2f\\n', x);`
  },
  {
    title: "Matrix declaration",
    desc: "Row/column literal",
    code: `M = [1 2 3; 4 5 6; 7 8 9];`
  },
  {
    title: "WHILE loop",
    desc: "Condition-checked loop",
    code: `while x > 0
    x = x - 1;
end`
  }
];

const codeInput = document.getElementById("codeInput");
const highlightCode = document.getElementById("highlightCode");
const highlightLayer = document.getElementById("highlightLayer");
const gutter = document.getElementById("gutter");
const outputBody = document.getElementById("outputBody");
const cursorPos = document.getElementById("cursorPos");
const fileNameInput = document.getElementById("fileName");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tokenize a single line of MATLAB for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith("%")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted '%')
  let code = rest;
  let comment = "";
  let inString = false;
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "'" && !inString) inString = true;
    else if (ch === "'" && inString) inString = false;
    else if (ch === "%" && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  let html = "";
  const stringRe = /'(?:[^'\\]|\\.)*'/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = stringRe.exec(code)) !== null) {
    parts.push({ text: code.slice(lastIndex, match.index), isString: false });
    parts.push({ text: match[0], isString: true });
    lastIndex = stringRe.lastIndex;
  }
  parts.push({ text: code.slice(lastIndex), isString: false });

  for (const part of parts) {
    if (part.isString) {
      html += `<span class="tok-string">${escapeHtml(part.text)}</span>`;
      continue;
    }
    const tokenRe = /([A-Za-z][A-Za-z0-9_]*)|(\d+(\.\d+)?([eE][+-]?\d+)?)|(')|(\s+)|([^\sA-Za-z0-9']+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else if (BUILTINS.includes(upper)) {
          html += `<span class="tok-func">${escapeHtml(word)}</span>`;
        } else {
          html += escapeHtml(word);
        }
      } else if (m[2]) {
        html += `<span class="tok-number">${escapeHtml(word)}</span>`;
      } else if (m[5]) {
        html += `<span class="tok-transpose">${escapeHtml(word)}</span>`;
      } else {
        html += escapeHtml(word);
      }
    }
  }

  if (comment) {
    html += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
  }

  return escapeHtml(leading) + html;
}

function renderHighlight() {
  const lines = codeInput.value.split("\n");
  highlightCode.innerHTML = lines.map(highlightLine).join("\n") + "\n";
  renderGutter(lines.length);
}

function renderGutter(lineCount) {
  let html = "";
  for (let i = 1; i <= lineCount; i++) {
    html += `<div>${i}</div>`;
  }
  gutter.innerHTML = html;
}

function syncScroll() {
  highlightLayer.scrollTop = codeInput.scrollTop;
  highlightLayer.scrollLeft = codeInput.scrollLeft;
  gutter.scrollTop = codeInput.scrollTop;
}

function updateCursorPos() {
  const value = codeInput.value;
  const pos = codeInput.selectionStart;
  const upToCursor = value.slice(0, pos);
  const line = upToCursor.split("\n").length;
  const col = pos - upToCursor.lastIndexOf("\n");
  cursorPos.textContent = `Ln ${line}, Col ${col}`;
}

function loadIntoEditor(code, filename) {
  codeInput.value = code;
  if (filename) fileNameInput.value = filename;
  renderHighlight();
  updateCursorPos();
}

function insertAtCursor(text) {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
  const insertion = (needsLeadingNewline ? "\n" : "") + text + "\n";
  codeInput.value = value.slice(0, start) + insertion + value.slice(end);
  const newPos = start + insertion.length;
  codeInput.selectionStart = codeInput.selectionEnd = newPos;
  codeInput.focus();
  renderHighlight();
  updateCursorPos();
}

function buildList(containerId, items, extClass) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "example-item";
    btn.innerHTML = `<span class="example-title">${item.title}</span><span class="example-desc">${item.desc}</span>`;
    btn.addEventListener("click", () => {
      const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
      loadIntoEditor(item.code, `${slug}.m`);
    });
    container.appendChild(btn);
  });
}

function buildPanels() {
  buildList("exampleList", EXAMPLES);
  buildList("matrixList", MATRIX_EXAMPLES);

  const snippetList = document.getElementById("snippetList");
  snippetList.innerHTML = "";
  SNIPPETS.forEach((snippet) => {
    const btn = document.createElement("button");
    btn.className = "snippet-item";
    btn.innerHTML = `<span class="snippet-title">${snippet.title}</span><span class="snippet-desc">${snippet.desc}</span>`;
    btn.addEventListener("click", () => insertAtCursor(snippet.code));
    snippetList.appendChild(btn);
  });
}

// ---- Simulated run ----
// There is no real MATLAB engine in the browser. We do a light static
// scan and simulate the console output of disp(...) and fprintf(...)
// calls in source order.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasOutput = /\bdisp\s*\(/i.test(code) || /\b(fprintf|printf)\s*\(/i.test(code);
  if (!hasOutput) {
    lines.push({ text: "warning: no disp()/fprintf() calls found — nothing will print.", err: true });
  }

  lines.push({ text: "running script...", err: false });

  const callRe = /\b(disp|fprintf|printf)\s*\(\s*('(?:[^'\\]|\\.)*')/gi;
  let match;
  let found = false;
  while ((match = callRe.exec(code)) !== null) {
    found = true;
    const fn = match[1].toLowerCase();
    let text = match[2].slice(1, -1).replace(/\\n/g, "");
    if (fn !== "disp") {
      // Very rough simulation: replace format specifiers with a placeholder.
      text = text.replace(/%[-0-9.]*[a-zA-Z]/g, "<value>");
    }
    lines.push({ text, err: false });
  }
  if (!found && hasOutput) {
    lines.push({ text: "(output depends on runtime values — showing static text calls only)", err: false });
  }

  lines.push({ text: "script finished", err: false });

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadM() {
  const name = fileNameInput.value.trim() || "script.m";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".m") ? name : `${name}.m`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function handleFileUpload(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    loadIntoEditor(e.target.result, file.name);
  };
  reader.readAsText(file);
  evt.target.value = "";
}

// ---- Wiring ----
codeInput.addEventListener("input", renderHighlight);
codeInput.addEventListener("scroll", syncScroll);
codeInput.addEventListener("keyup", updateCursorPos);
codeInput.addEventListener("click", updateCursorPos);
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    insertPlainTab();
  }
});

function insertPlainTab() {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;
  codeInput.value = value.slice(0, start) + "    " + value.slice(end);
  codeInput.selectionStart = codeInput.selectionEnd = start + 4;
  renderHighlight();
}

document.getElementById("loadStarterBtn").addEventListener("click", () => {
  loadIntoEditor(STARTER_PROGRAM, "hello_world.m");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadM);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "hello_world.m");
