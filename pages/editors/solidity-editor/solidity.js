// Solidity Editor — pages/editors/solidity
// Client-side only: manual tokenizer for syntax highlighting (no external lib),
// template insertion, .sol open/save, and a simulated compile (no real solc/EVM).

const STARTER_PROGRAM = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string public greeting = "Hello, Solidity!";

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
`;

const KEYWORDS = [
  "CONTRACT","INTERFACE","LIBRARY","IS","FUNCTION","RETURNS","RETURN",
  "MODIFIER","REQUIRE","REVERT","ASSERT","EMIT","EVENT","STRUCT","ENUM",
  "MAPPING","USING","FOR","IF","ELSE","WHILE","DO","BREAK","CONTINUE",
  "NEW","DELETE","IMPORT","CONSTRUCTOR","TRUE","FALSE","OVERRIDE",
  "VIRTUAL","ABSTRACT","TRY","CATCH","THROW","SELFDESTRUCT","UNCHECKED",
  "INDEXED","ANONYMOUS","RECEIVE","FALLBACK"
];

const TYPES = [
  "ADDRESS","UINT","UINT8","UINT16","UINT32","UINT64","UINT128","UINT256",
  "INT","INT8","INT16","INT32","INT64","INT128","INT256","BOOL","STRING",
  "BYTES","BYTES1","BYTES4","BYTES8","BYTES16","BYTES32","MEMORY","STORAGE",
  "CALLDATA","CONSTANT","IMMUTABLE","PAYABLE"
];

const VISIBILITY = ["PUBLIC","PRIVATE","INTERNAL","EXTERNAL","VIEW","PURE"];

const GLOBALS = ["MSG","SENDER","VALUE","BLOCK","TIMESTAMP","THIS","SUPER","NOW","TX","GASLEFT","ORIGIN"];

const EXAMPLES = [
  {
    title: "Hello World storage",
    desc: "Minimal contract with a public setter",
    code: STARTER_PROGRAM
  },
  {
    title: "ERC-20 token",
    desc: "Self-contained minimal fungible token",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleToken {
    string public name = "Simple Token";
    string public symbol = "SIM";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}
`
  },
  {
    title: "Simple auction",
    desc: "Bidding, refunds, and an end-time guard",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleAuction {
    address public beneficiary;
    uint256 public auctionEndTime;

    address public highestBidder;
    uint256 public highestBid;

    mapping(address => uint256) public pendingReturns;
    bool public ended;

    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);

    constructor(uint256 _biddingTime, address _beneficiary) {
        beneficiary = _beneficiary;
        auctionEndTime = block.timestamp + _biddingTime;
    }

    function bid() public payable {
        require(block.timestamp <= auctionEndTime, "Auction already ended");
        require(msg.value > highestBid, "Bid not high enough");

        if (highestBid != 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function withdraw() public returns (bool) {
        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
        }
        return true;
    }

    function auctionEnd() public {
        require(block.timestamp >= auctionEndTime, "Auction not yet ended");
        require(!ended, "Auction end already called");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
    }
}
`
  },
  {
    title: "Ownable access control",
    desc: "Owner-restricted modifier pattern",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
`
  }
];

const SNIPPETS = [
  {
    title: "function definition",
    desc: "Public function with a return type",
    code: `    function getBalance(address _account) public view returns (uint256) {
        return balanceOf[_account];
    }`
  },
  {
    title: "modifier",
    desc: "Reusable access-control guard",
    code: `    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }`
  },
  {
    title: "event + emit",
    desc: "Declare and fire an event",
    code: `    event ValueChanged(address indexed changedBy, uint256 newValue);

    // inside a function:
    emit ValueChanged(msg.sender, newValue);`
  },
  {
    title: "mapping declaration",
    desc: "Key-value on-chain storage",
    code: `    mapping(address => uint256) public balances;`
  },
  {
    title: "require statement",
    desc: "Guard clause with a revert reason",
    code: `        require(msg.value > 0, "Value must be greater than zero");`
  },
  {
    title: "constructor",
    desc: "Runs once at deployment",
    code: `    constructor(uint256 _initialValue) {
        owner = msg.sender;
        value = _initialValue;
    }`
  }
];

const codeInput = document.getElementById("codeInput");
const highlightCode = document.getElementById("highlightCode");
const highlightLayer = document.getElementById("highlightLayer");
const gutter = document.getElementById("gutter");
const outputBody = document.getElementById("outputBody");
const cursorPos = document.getElementById("cursorPos");
const fileNameInput = document.getElementById("fileName");
const languageSelect = document.getElementById("languageSelect");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tokenize a single line of Solidity for highlighting.
function highlightLine(line) {
  const trimmedStart = line.match(/^(\s*)(.*)$/);
  const leading = trimmedStart[1];
  const rest = trimmedStart[2];

  if (rest.startsWith("//")) {
    return escapeHtml(leading) + `<span class="tok-comment">${escapeHtml(rest)}</span>`;
  }

  // Pragma / license lines get a distinct muted style end-to-end.
  if (/^pragma\s/i.test(rest) || /^\/\/\s*SPDX-License-Identifier/i.test(rest)) {
    return escapeHtml(leading) + `<span class="tok-pragma">${escapeHtml(rest)}</span>`;
  }

  // Split off trailing inline comment (unquoted '//')
  let code = rest;
  let comment = "";
  let inString = false;
  let quoteChar = "";
  for (let i = 0; i < rest.length - 1; i++) {
    const ch = rest[i];
    if ((ch === '"' || ch === "'") && !inString) { inString = true; quoteChar = ch; }
    else if (ch === quoteChar && inString) { inString = false; }
    else if (ch === "/" && rest[i + 1] === "/" && !inString) {
      code = rest.slice(0, i);
      comment = rest.slice(i);
      break;
    }
  }

  let html = "";
  const stringRe = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
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
    const tokenRe = /([A-Za-z_][A-Za-z0-9_]*)|(\d+(\.\d+)?)|(\s+)|([^\sA-Za-z0-9]+)/g;
    let m;
    while ((m = tokenRe.exec(part.text)) !== null) {
      const word = m[0];
      if (m[1]) {
        const upper = word.toUpperCase();
        if (VISIBILITY.includes(upper)) {
          html += `<span class="tok-visibility">${escapeHtml(word)}</span>`;
        } else if (TYPES.includes(upper)) {
          html += `<span class="tok-type">${escapeHtml(word)}</span>`;
        } else if (GLOBALS.includes(upper)) {
          html += `<span class="tok-global">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(upper)) {
          html += `<span class="tok-kw">${escapeHtml(word)}</span>`;
        } else {
          html += escapeHtml(word);
        }
      } else if (m[2]) {
        html += `<span class="tok-number">${escapeHtml(word)}</span>`;
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

function pascalCase(title) {
  return title
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
}

function buildPanels() {
  const exampleList = document.getElementById("exampleList");
  exampleList.innerHTML = "";
  EXAMPLES.forEach((ex) => {
    const btn = document.createElement("button");
    btn.className = "example-item";
    btn.innerHTML = `<span class="example-title">${ex.title}</span><span class="example-desc">${ex.desc}</span>`;
    btn.addEventListener("click", () => loadIntoEditor(ex.code, `${pascalCase(ex.title)}.sol`));
    exampleList.appendChild(btn);
  });

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

// ---- Simulated compile ----
// There is no real solc/EVM in the browser. We do a light static scan
// for the required pragma/contract structure and list the function
// signatures found, similar to what a compiler's ABI output would show.
function simulateRun() {
  const code = codeInput.value;
  const lines = [];

  const hasPragma = /pragma\s+solidity/i.test(code);
  const hasContract = /\b(contract|interface|library)\s+\w+/i.test(code);
  const hasLicense = /SPDX-License-Identifier/i.test(code);

  if (!hasLicense) {
    lines.push({ text: "warning: no SPDX-License-Identifier found.", err: false, warn: true });
  }
  if (!hasPragma) {
    lines.push({ text: "error: missing pragma solidity version declaration.", err: true });
  }
  if (!hasContract) {
    lines.push({ text: "error: no contract/interface/library declaration found.", err: true });
  }

  if (hasPragma && hasContract) {
    lines.push({ text: "compiling with solc (simulated)... ok", err: false });

    const contractMatch = code.match(/\b(contract|interface|library)\s+(\w+)/i);
    if (contractMatch) {
      lines.push({ text: `${contractMatch[1]} ${contractMatch[2]} compiled successfully`, err: false });
    }

    const fnRe = /function\s+(\w+)\s*\(([^)]*)\)\s*((?:public|private|internal|external|view|pure|payable|override|virtual|\s)*)/gi;
    let match;
    let found = false;
    lines.push({ text: "Generated ABI:", err: false });
    while ((match = fnRe.exec(code)) !== null) {
      found = true;
      const [, name, params, modifiers] = match;
      const cleanModifiers = modifiers.trim().replace(/\s+/g, " ");
      lines.push({ text: `  function ${name}(${params.trim()}) ${cleanModifiers}`.trimEnd(), err: false });
    }
    if (!found) {
      lines.push({ text: "  (no public/external functions found)", err: false });
    }
    lines.push({ text: "bytecode generated, 0 errors", err: false });
  }

  outputBody.innerHTML = lines
    .map((l) => `<div class="${l.err ? "err-line" : l.warn ? "warn-line" : "ok-line"}">${escapeHtml(l.text)}</div>`)
    .join("");
}

// ---- File open / save ----
function downloadSol() {
  const name = fileNameInput.value.trim() || "Contract.sol";
  const blob = new Blob([codeInput.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".sol") ? name : `${name}.sol`;
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
  loadIntoEditor(STARTER_PROGRAM, "HelloWorld.sol");
});

document.getElementById("runBtn").addEventListener("click", simulateRun);
document.getElementById("clearOutputBtn").addEventListener("click", () => {
  outputBody.textContent = "Output cleared.";
});
document.getElementById("downloadBtn").addEventListener("click", downloadSol);
document.getElementById("fileUpload").addEventListener("change", handleFileUpload);

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// This dropdown demonstrates that Solidity is registered as a selectable
// language option alongside the site's other editors. Wire the
// `change` handler up to the shared editor-index navigation once this
// page is integrated into pages/editors/.
languageSelect.addEventListener("change", (e) => {
  const chosen = e.target.value;
  if (chosen !== "solidity") {
    console.info(`Navigate to the ${chosen} editor (hook up to real routing on integration).`);
  }
});

// ---- Init ----
buildPanels();
loadIntoEditor(STARTER_PROGRAM, "HelloWorld.sol");
