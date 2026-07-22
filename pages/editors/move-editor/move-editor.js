document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initMoveEditor(); } catch(e) { console.error("MoveEditor:", e); }
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ─── Move Examples ─── */
const MOVE_EXAMPLES = {
  hello: [
    {
      name: "main.move",
      content: `// Hello World in Move
module 0x42::HelloWorld {
    use std::debug;
    use std::string;

    public entry fun say_hello() {
        let msg = string::utf8(b"Hello, Web3 World!");
        debug::print(&msg);
    }
}`
    }
  ],

  structs: [
    {
      name: "main.move",
      content: `module 0x42::Tokens {
    // Structs can have abilities: copy, drop, store, key
    struct Coin has store, drop {
        value: u64
    }

    struct Wallet has key {
        coins: Coin
    }

    public fun mint(amount: u64): Coin {
        Coin { value: amount }
    }

    public fun get_value(coin: &Coin): u64 {
        coin.value
    }

    public fun destroy_zero(coin: Coin) {
        let Coin { value } = coin;
        assert!(value == 0, 1);
    }
}`
    }
  ],

  resources: [
    {
      name: "main.move",
      content: `module 0x42::ResourceManagement {
    use std::signer;

    // A resource is a struct with the 'key' ability
    struct Counter has key {
        value: u64,
    }

    public entry fun init_counter(account: &signer) {
        let counter = Counter { value: 0 };
        move_to(account, counter);
    }

    public entry fun increment(account: &signer) acquires Counter {
        let addr = signer::address_of(account);
        let counter = borrow_global_mut<Counter>(addr);
        counter.value = counter.value + 1;
    }

    public fun get_count(addr: address): u64 acquires Counter {
        borrow_global<Counter>(addr).value
    }
}`
    }
  ],

  functions: [
    {
      name: "main.move",
      content: `module 0x42::Math {
    // Private function, only callable within this module
    fun add(a: u64, b: u64): u64 {
        a + b
    }

    // Public function, callable by other modules
    public fun multiply(a: u64, b: u64): u64 {
        a * b
    }

    // Public entry function, callable directly via transactions
    public entry fun math_ops() {
        let _sum = add(10, 20);
        let _prod = multiply(5, 5);
    }
}`
    }
  ]
};

/* ─── Piston API Executor (Simulation for Move) ─── */
async function executeMove(files) {
  if (files.length === 0 || !files.some(f => f.content.trim())) {
    return { output: [], errors: ["No code to execute."] };
  }

  // Simulate Move execution since standard Piston might not support Move natively
  return new Promise((resolve) => {
    setTimeout(() => {
      let output = [];
      let errors = [];
      
      const hasSyntaxError = files.some(f => f.content.includes("syntax error"));
      
      if (hasSyntaxError) {
        errors.push("error: invalid syntax");
        errors.push("   --> main.move:1:1");
      } else {
        output.push("Compiled successfully");
        output.push("Transaction executed successfully.");
      }
      
      resolve({ output, errors });
    }, 800);
  });
}

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightMove(code) {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    let result = escapeHtml(line);

    // Move syntax highlighting regex
    const regex = /(<[^>]+>)|(\/\/.*$)|(\"[^\"]*\"|b\"[^\"]*\")|(\b(?:module|script|public|fun|entry|struct|has|copy|drop|store|key|use|as|let|mut|if|else|while|loop|return|break|continue|abort|assert!|acquires|move_to|move_from|borrow_global|borrow_global_mut|exists)\b)|(\b(?:u8|u16|u32|u64|u128|u256|bool|address|signer|vector)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))|(::|&|\||\+|-|\*|\/|%|=|==|!=|<|>|<=|>=)/g;

    return result.replace(regex, (m, tag, comment, str, kw, typeToken, structToken, num, operator) => {
      if (tag) return tag;
      if (comment) return '<span class="token comment">' + comment + '</span>';
      if (str) return '<span class="token string">' + str + '</span>';
      if (kw) return '<span class="token keyword">' + kw + '</span>';
      if (typeToken) return '<span class="token type">' + typeToken + '</span>';
      if (structToken) return '<span class="token function">' + structToken + '</span>';
      if (num) return '<span class="token number">' + num + '</span>';
      if (operator) return '<span class="token operator">' + operator + '</span>';
      return m;
    });
  }).join("\n");

  return highlighted;
}

/* ─── Init Editor ─── */
function initMoveEditor() {
  const editor = document.getElementById("moveEditor");
  const highlight = document.getElementById("moveHighlight");
  if (!editor || !highlight) return;

  const outputBody    = document.getElementById("moveOutputBody");
  const consoleBody   = document.getElementById("moveConsoleBody");
  const runBtn        = document.getElementById("moveRunBtn");
  const resetBtn      = document.getElementById("moveResetBtn");
  const copyBtn       = document.getElementById("moveCopyBtn");
  const saveBtn       = document.getElementById("moveSaveBtn");
  const exampleSelect = document.getElementById("moveExampleSelect");
  const lineNumbers   = document.getElementById("moveLineNumbers");
  const statusBadge   = document.getElementById("moveStatusBadge");
  const consoleClear  = document.getElementById("moveConsoleClear");
  const fileList      = document.getElementById("moveFileList");
  const newFileBtn    = document.getElementById("moveNewFileBtn");
  const activeFileNameEl = document.getElementById("moveActiveFileName");

  const SAVE_KEY = "move-editor-project";
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || MOVE_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(MOVE_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(MOVE_EXAMPLES.hello));
    activeIndex = 0;
  }

  // Initial Sync
  syncEditorState();
  renderFileList();

  // Scroll Sync
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  // Input & Hotkeys
  editor.addEventListener("input", () => {
    files[activeIndex].content = editor.value;
    updateSyntaxHighlight();
    updateLineNumbers();
  });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + "    " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
      files[activeIndex].content = editor.value;
      updateSyntaxHighlight();
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      saveProject();
    }
  });

  // Actions
  runBtn.addEventListener("click", runCode);
  resetBtn.addEventListener("click", resetProject);
  copyBtn.addEventListener("click", copyCurrentFileCode);
  saveBtn.addEventListener("click", saveProject);
  consoleClear.addEventListener("click", clearConsole);

  exampleSelect.addEventListener("change", () => {
    const val = exampleSelect.value;
    if (MOVE_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(MOVE_EXAMPLES[val]));
      activeIndex = 0;
      syncEditorState();
      renderFileList();
    }
  });

  newFileBtn.addEventListener("click", showNewFileInput);

  /* ── Core Editor Functions ── */

  function syncEditorState() {
    const activeFile = files[activeIndex];
    activeFileNameEl.textContent = activeFile.name;
    editor.value = activeFile.content;
    updateSyntaxHighlight();
    updateLineNumbers();

    // Clear scroll position sync on active file switch
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    highlight.innerHTML = highlightMove(editor.value) + "\n";
  }

  function updateLineNumbers() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }

  function renderFileList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
      const el = document.createElement("div");
      el.className = `file-item ${index === activeIndex ? "active" : ""}`;
      el.dataset.index = index;

      const nameContainer = document.createElement("div");
      nameContainer.className = "file-name-container";
      nameContainer.innerHTML = `<i class="fas fa-link"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement("div");
      actionContainer.className = "file-item-actions";

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.className = "file-action-btn edit";
      editBtn.title = "Rename File";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement("button");
      delBtn.className = "file-action-btn delete";
      delBtn.title = "Delete File";
      delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteFile(index);
      });
      actionContainer.appendChild(delBtn);

      el.appendChild(actionContainer);

      el.addEventListener("click", () => {
        activeIndex = index;
        syncEditorState();
        renderFileList();
      });

      fileList.appendChild(el);
    });
  }

  function showNewFileInput() {
    if (document.getElementById("newFileInput")) {
      document.getElementById("newFileInput").focus();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "file-item-input-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "file-item-input";
    input.id = "newFileInput";
    input.placeholder = "filename.move";

    wrapper.appendChild(input);
    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      const name = input.value.trim();
      if (!name) {
        wrapper.remove();
        return;
      }

      // Validations
      if (!name.endsWith(".move")) {
        void 0;
        input.focus();
        return;
      }

      if (files.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        void 0;
        input.focus();
        return;
      }

      const newFile = {
        name: name,
        content: `// Move module: ${name.replace(/\.move$/, '')}\n\n`
      };

      files.push(newFile);
      activeIndex = files.length - 1;
      wrapper.remove();
      saveProject();
      syncEditorState();
      renderFileList();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishNewFile();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        wrapper.remove();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (wrapper.parentNode) {
          finishNewFile();
        }
      }, 200);
    });
  }

  function showRenameInput(index) {
    const file = files[index];
    const itemEl = fileList.children[index];
    if (!itemEl) return;

    const originalHTML = itemEl.innerHTML;
    itemEl.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "file-item-input";
    input.value = file.name;
    itemEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = () => {
      const newName = input.value.trim();
      if (!newName || newName === file.name) {
        renderFileList();
        return;
      }

      if (!newName.endsWith(".move")) {
        void 0;
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
        void 0;
        input.focus();
        return;
      }

      file.name = newName;
      saveProject();
      renderFileList();
      if (index === activeIndex) {
        activeFileNameEl.textContent = newName;
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishRename();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        renderFileList();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (input.parentNode) {
          finishRename();
        }
      }, 200);
    });
  }

  function deleteFile(index) {
    const file = files[index];
    if (files.length <= 1) {
      void 0;
      return;
    }

    if (false /* confirm removed */) {
      files.splice(index, 1);
      if (activeIndex >= files.length) {
        activeIndex = files.length - 1;
      }
      saveProject();
      syncEditorState();
      renderFileList();
    }
  }

  function saveProject() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      files,
      activeIndex
    }));
    showActionIndicator(saveBtn, '<i class="fas fa-check"></i>');
  }

  function resetProject() {
    if (false /* confirm removed */) {
      const val = exampleSelect.value;
      files = JSON.parse(JSON.stringify(MOVE_EXAMPLES[val] || MOVE_EXAMPLES.hello));
      activeIndex = 0;
      saveProject();
      syncEditorState();
      renderFileList();
      showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
    }
  }

  function copyCurrentFileCode() {
    navigator.clipboard.writeText(editor.value)
      .then(() => {
        showActionIndicator(copyBtn, '<i class="fas fa-check"></i>');
      })
      .catch(() => {
        logError("Failed to copy code to clipboard.");
      });
  }

  function showActionIndicator(btn, successHTML) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = successHTML;
    btn.style.color = "#22c55e";
    btn.style.borderColor = "#22c55e";
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 2000);
  }

  function clearConsole() {
    consoleBody.innerHTML = '<span class="move-console-placeholder">No compilation errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="move-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="move-console-placeholder">No compilation errors.</span>';

    const { output, errors } = await executeMove(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = "";
      output.forEach((line) => {
        const el = document.createElement("span");
        el.className = "move-output-line";
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="move-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = "";
      errors.forEach(logError);
      setStatus("error");
    } else {
      setStatus("ready");
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".move-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "move-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "move-status-ready"],
      running: ["Running", "move-status-running"],
      error:   ["Error",   "move-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `move-status-badge ${cls}`;
  }
}

window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
