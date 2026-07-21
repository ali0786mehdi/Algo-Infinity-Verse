document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initOCamlEditor(); } catch(e) { console.error("OCamlEditor:", e); }
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

/* ─── OCaml Examples ─── */
const OCAML_EXAMPLES = {
  hello: [
    {
      name: "main.ml",
      content: `(* Hello World in OCaml *)
let () =
  print_endline "Hello, World!";
  print_endline "Welcome to the OCaml Editor!"`
    }
  ],

  variables: [
    {
      name: "main.ml",
      content: `(* Variables and Functions in OCaml *)
(* In OCaml, let bindings are immutable by default *)

let greet name =
  "Hello, " ^ name ^ "!"

let square x = x * x

let circle_area r = Float.pi *. r *. r

let () =
  let name = "Algo" in
  let age = 21 in
  let score = 98.5 in
  let is_ready = true in

  print_endline (greet name);
  Printf.printf "Age: %d\\n" age;
  Printf.printf "Score: %.1f\\n" score;
  Printf.printf "Ready: %b\\n" is_ready;
  Printf.printf "Square of 7: %d\\n" (square 7);
  Printf.printf "Area of circle r=5: %.2f\\n" (circle_area 5.0)`
    }
  ],

  recursion: [
    {
      name: "main.ml",
      content: `(* Recursion and List Operations in OCaml *)

let rec factorial n =
  if n <= 1 then 1
  else n * factorial (n - 1)

let rec fibonacci n =
  match n with
  | 0 -> 0
  | 1 -> 1
  | n -> fibonacci (n - 1) + fibonacci (n - 2)

let rec length lst =
  match lst with
  | [] -> 0
  | _ :: rest -> 1 + length rest

let rec sum lst =
  match lst with
  | [] -> 0
  | x :: rest -> x + sum rest

let () =
  Printf.printf "factorial 5  = %d\\n" (factorial 5);
  Printf.printf "factorial 10 = %d\\n" (factorial 10);

  print_endline "\\nFirst 10 Fibonacci numbers:";
  let fibs = List.init 10 fibonacci in
  List.iter (fun n -> Printf.printf "%d " n) fibs;
  print_newline ();

  let nums = [1; 2; 3; 4; 5] in
  Printf.printf "\\nLength of [1;2;3;4;5]: %d\\n" (length nums);
  Printf.printf "Sum of [1;2;3;4;5]: %d\\n" (sum nums)`
    }
  ],

  pattern: [
    {
      name: "main.ml",
      content: `(* Pattern Matching — OCaml's most powerful feature *)

type shape =
  | Circle of float
  | Rectangle of float * float
  | Triangle of float * float

let area = function
  | Circle r -> Float.pi *. r *. r
  | Rectangle (w, h) -> w *. h
  | Triangle (b, h) -> 0.5 *. b *. h

let describe = function
  | Circle r -> Printf.sprintf "Circle with radius %.1f" r
  | Rectangle (w, h) -> Printf.sprintf "Rectangle %gx%g" w h
  | Triangle (b, h) -> Printf.sprintf "Triangle base=%g height=%g" b h

type 'a option_result =
  | Some of 'a
  | None

let safe_div a b =
  if b = 0 then None
  else Some (a / b)

let () =
  let shapes = [Circle 5.0; Rectangle (4.0, 6.0); Triangle (3.0, 8.0)] in
  List.iter (fun s ->
    Printf.printf "%s -> area = %.2f\\n" (describe s) (area s)
  ) shapes;

  print_endline "\\nSafe division:";
  (match safe_div 10 3 with
   | Some v -> Printf.printf "10 / 3 = %d\\n" v
   | None -> print_endline "Division by zero!");
  (match safe_div 10 0 with
   | Some v -> Printf.printf "10 / 0 = %d\\n" v
   | None -> print_endline "Division by zero!")`
    }
  ],

  modules: [
    {
      name: "main.ml",
      content: `(* Modules and Functors in OCaml *)

module type STACK = sig
  type 'a t
  val empty : 'a t
  val push : 'a -> 'a t -> 'a t
  val pop : 'a t -> ('a * 'a t) option
  val peek : 'a t -> 'a option
  val is_empty : 'a t -> bool
  val to_list : 'a t -> 'a list
end

module ListStack : STACK = struct
  type 'a t = 'a list
  let empty = []
  let push x s = x :: s
  let pop = function
    | [] -> None
    | x :: rest -> Some (x, rest)
  let peek = function
    | [] -> None
    | x :: _ -> Some x
  let is_empty = function
    | [] -> true
    | _ -> false
  let to_list s = s
end

let () =
  let open ListStack in
  let s = empty
    |> push 10
    |> push 20
    |> push 30 in

  Printf.printf "Stack: ";
  List.iter (Printf.printf "%d ") (to_list s);
  print_newline ();

  (match peek s with
   | Some v -> Printf.printf "Top: %d\\n" v
   | None -> print_endline "Empty stack");

  (match pop s with
   | Some (v, rest) ->
     Printf.printf "Popped: %d\\n" v;
     Printf.printf "Remaining: ";
     List.iter (Printf.printf "%d ") (to_list rest);
     print_newline ()
   | None -> print_endline "Empty stack")`
    }
  ],

  higherorder: [
    {
      name: "main.ml",
      content: `(* Higher-Order Functions in OCaml *)

(* The pipe operator makes function composition readable *)
let (|>) x f = f x

let double x = x * 2
let add1 x = x + 1
let is_even x = x mod 2 = 0

let () =
  let nums = [1; 2; 3; 4; 5; 6; 7; 8; 9; 10] in

  (* Map: transform every element *)
  let doubled = List.map double nums in
  Printf.printf "Doubled: ";
  List.iter (Printf.printf "%d ") doubled;
  print_newline ();

  (* Filter: keep elements matching a predicate *)
  let evens = List.filter is_even nums in
  Printf.printf "Evens:   ";
  List.iter (Printf.printf "%d ") evens;
  print_newline ();

  (* Fold: reduce a list to a single value *)
  let sum = List.fold_left ( + ) 0 nums in
  let product = List.fold_left ( * ) 1 nums in
  Printf.printf "Sum:     %d\\n" sum;
  Printf.printf "Product: %d\\n" product;

  (* Compose map, filter, and fold *)
  let result =
    nums
    |> List.filter is_even
    |> List.map double
    |> List.fold_left ( + ) 0 in
  Printf.printf "\\nSum of doubled evens: %d\\n" result;

  (* Anonymous functions (closures) *)
  let pairs = List.map (fun x -> (x, x * x)) nums in
  print_endline "\\n(n, n^2) pairs:";
  List.iter (fun (a, b) -> Printf.printf "  (%d, %d)\\n" a b) pairs`
    }
  ]
};

/* ─── Piston API Executor ─── */
async function executeOCaml(files) {
  if (files.length === 0 || !files.some(f => f.content.trim())) {
    return { output: [], errors: ["No code to execute."] };
  }

  const pistonFiles = files.map(f => ({
    name: f.name,
    content: f.content
  }));

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "ocaml",
        version: "*",
        files: pistonFiles,
        stdin: "",
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });

    if (!response.ok) {
      throw new Error("Piston API request failed: " + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split("\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split("\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split("\n"));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push("Process finished with no output.");
    }

    return { output, errors };

  } catch (error) {
    return { output: [], errors: ["Execution Error: " + error.message] };
  }
}

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightOCaml(code) {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    let result = escapeHtml(line);

    // OCaml syntax highlighting regex
    const regex = /(<[^>]+>)|(\(\*[\s\S]*?\*\))|(\"[^\"]*\"|'[^'\\]'|'\\.'|'\\[0-9]{3}')|(#[a-z_]+)|(\b(?:and|as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|false|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|match|method|mod|module|mutable|new|nonrec|object|of|open|or|private|rec|sig|struct|then|to|true|try|type|val|virtual|when|while|with|land|lor|lxor|lsl|lsr|asr|ref)\b)|(\b[A-Z][a-zA-Z0-9_]*\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))|(->|<-|\|>|@@|;;|::|~-|~-\.)|(:[a-z_][a-z_0-9]*)/g;

    return result.replace(regex, (m, tag, comment, str, directive, kw, _kwInner, typeToken, num, operator, label) => {
      if (tag) return tag;
      if (comment) return '<span class="token comment">' + comment + '</span>';
      if (str) return '<span class="token string">' + str + '</span>';
      if (directive) return '<span class="token directive">' + directive + '</span>';
      if (kw) return '<span class="token keyword">' + kw + '</span>';
      if (typeToken) return '<span class="token function">' + typeToken + '</span>';
      if (num) return '<span class="token number">' + num + '</span>';
      if (operator) return '<span class="token operator">' + operator + '</span>';
      if (label) return '<span class="token label">' + label + '</span>';
      return m;
    });
  }).join("\n");

  return highlighted;
}

/* ─── Init Editor ─── */
function initOCamlEditor() {
  const editor = document.getElementById("mlEditor");
  const highlight = document.getElementById("mlHighlight");
  if (!editor || !highlight) return;

  const outputBody    = document.getElementById("mlOutputBody");
  const consoleBody   = document.getElementById("mlConsoleBody");
  const runBtn        = document.getElementById("mlRunBtn");
  const resetBtn      = document.getElementById("mlResetBtn");
  const copyBtn       = document.getElementById("mlCopyBtn");
  const saveBtn       = document.getElementById("mlSaveBtn");
  const exampleSelect = document.getElementById("mlExampleSelect");
  const lineNumbers   = document.getElementById("mlLineNumbers");
  const statusBadge   = document.getElementById("mlStatusBadge");
  const consoleClear  = document.getElementById("mlConsoleClear");
  const fileList      = document.getElementById("mlFileList");
  const newFileBtn    = document.getElementById("mlNewFileBtn");
  const activeFileNameEl = document.getElementById("mlActiveFileName");

  const SAVE_KEY = "ocaml-editor-project";
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || OCAML_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(OCAML_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(OCAML_EXAMPLES.hello));
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
      editor.value = editor.value.substring(0, s) + "  " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
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
    if (OCAML_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(OCAML_EXAMPLES[val]));
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
    highlight.innerHTML = highlightOCaml(editor.value) + "\n";
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
      nameContainer.innerHTML = `<i class="fas fa-cube"></i> <span>${escapeHtml(file.name)}</span>`;
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
    // Check if new file input is already showing
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
    input.placeholder = "filename.ml";

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
      if (!name.endsWith(".ml") && !name.endsWith(".mli")) {
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
        content: `(* OCaml module: ${name.replace(/\.mli?$/, '')} *)\n\n`
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

      if (!newName.endsWith(".ml") && !newName.endsWith(".mli")) {
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
      files = JSON.parse(JSON.stringify(OCAML_EXAMPLES[val] || OCAML_EXAMPLES.hello));
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
    consoleBody.innerHTML = '<span class="ml-console-placeholder">No compilation errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="ml-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="ml-console-placeholder">No compilation errors.</span>';

    const { output, errors } = await executeOCaml(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = "";
      output.forEach((line) => {
        const el = document.createElement("span");
        el.className = "ml-output-line";
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="ml-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector(".ml-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "ml-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "ml-status-ready"],
      running: ["Running", "ml-status-running"],
      error:   ["Error",   "ml-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `ml-status-badge ${cls}`;
  }
}


window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
