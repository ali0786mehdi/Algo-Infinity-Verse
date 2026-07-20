document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initFSharpEditor();
  } catch (e) {
    console.error('FSharpEditor Error:', e);
  }
});

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
}

/* ─── F# Functional Programming Examples ─── */
const FSHARP_EXAMPLES = {
  hello: [
    {
      name: 'main.fs',
      content: `// Hello World & Basic Functions in F#
open System

let greet name =
    sprintf "Hello, %s! Welcome to F#." name

let add x y = x + y

[<EntryPoint>]
let main argv =
    let message = greet "Functional Learner"
    printfn "%s" message
    
    let sum = add 10 25
    printfn "10 + 25 = %d" sum
    0
`,
    },
  ],

  pipelines: [
    {
      name: 'main.fs',
      content: `// Pipelines & Higher-Order Functions in F#
open System

let numbers = [ 1 .. 10 ]

// Using the Forward Pipeline Operator (|>)
let result =
    numbers
    |> List.filter (fun x -> x % 2 = 0)
    |> List.map (fun x -> x * x)
    |> List.fold (fun acc x -> acc + x) 0

[<EntryPoint>]
let main argv =
    printfn "Original numbers: %A" numbers
    printfn "Sum of squares of even numbers: %d" result
    0
`,
    },
  ],

  matching: [
    {
      name: 'main.fs',
      content: `// Pattern Matching & Discriminated Unions in F#
open System

type Shape =
    | Square of side: float
    | Rectangle of width: float * height: float
    | Circle of radius: float

let calculateArea shape =
    match shape with
    | Square s -> s * s
    | Rectangle (w, h) -> w * h
    | Circle r -> Math.PI * r * r

let printOptional (opt: string option) =
    match opt with
    | Some msg -> printfn "Found: %s" msg
    | None -> printfn "No value present."

[<EntryPoint>]
let main argv =
    let mySquare = Square 4.0
    let myCircle = Circle 3.0
    
    printfn "Square Area: %.2f" (calculateArea mySquare)
    printfn "Circle Area: %.2f" (calculateArea myCircle)
    
    printOptional (Some "Functional Programming")
    printOptional None
    0
`,
    },
  ],

  recursion: [
    {
      name: 'main.fs',
      content: `// Recursion & Math Functions in F#
open System

// Recursive Factorial
let rec factorial n =
    if n <= 1 then 1
    else n * factorial (n - 1)

// Recursive Fibonacci
let rec fibonacci n =
    match n with
    | 0 -> 0
    | 1 -> 1
    | n -> fibonacci (n - 1) + fibonacci (n - 2)

[<EntryPoint>]
let main argv =
    printfn "Factorial of 5 = %d" (factorial 5)
    printfn "Factorial of 7 = %d" (factorial 7)
    
    printfn "First 8 Fibonacci numbers:"
    for i in 0 .. 7 do
        printf "%d " (fibonacci i)
    printfn ""
    0
`,
    },
  ],

  async: [
    {
      name: 'main.fs',
      content: `// Async Workflows & Sequences in F#
open System

// Sequence Expressions
let squares = seq {
    for i in 1 .. 5 do
        yield i * i
}

// Async Workflow
let computeTask name delay = async {
    printfn "Task '%s' starting..." name
    do! Async.Sleep delay
    printfn "Task '%s' completed after %d ms." name delay
    return delay
}

[<EntryPoint>]
let main argv =
    printfn "Sequences: %A" (Seq.toList squares)
    
    let task1 = computeTask "Alpha" 100
    let task2 = computeTask "Beta" 200
    
    Async.RunSynchronously (Async.Parallel [ task1; task2 ]) |> ignore
    0
`,
    },
  ],
};

/* ─── Piston API Executor ─── */
async function executeFSharp(files) {
  if (files.length === 0 || !files.some((f) => f.content.trim())) {
    return { output: [], errors: ['No F# code to execute.'] };
  }

  const pistonFiles = files.map((f) => ({
    name: f.name,
    content: f.content,
  }));

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'fsharp',
        version: '*',
        files: pistonFiles,
        stdin: '',
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error('Piston API request failed: ' + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split('\n').filter((l) => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split('\n'));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push('Process finished with no output.');
    }

    return { output, errors };
  } catch (error) {
    return { output: [], errors: ['Execution Error: ' + error.message] };
  }
}

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightFSharp(code) {
  const lines = code.split('\n');
  const highlighted = lines
    .map((line) => {
      let result = escapeHtml(line);

      // F# regex token patterns
      const regex =
        /(<[^>]+>)|(\/\/.*$)|(\(\*[\s\S]*?\*\))|("[^"]*"|@"[^"]*")|(\b(let|rec|match|with|type|module|open|member|if|then|else|fun|seq|async|mutable|val|use|yield|return|and|or|not|do|in|for|to|do!|yield!|return!|try|finally|raise|exception|interface|abstract|override|default|inherit|namespace|struct|enum|class|end|entryPoint)\b)|(\|>|->|>>|<<|<=|>=|<>|=|:|\+|-|\*|\/|%|\^|&&|\|\|)|(\b(int|float|string|bool|unit|option|list|array|seq|decimal|double|byte|char)\b)|(\b(?:\d+\/\d+|\d+(?:\.\d*)?|\.\d+)\b)/gi;

      return result.replace(regex, (m, tag, comment, blockComment, str, kw, op, typeToken, num) => {
        if (tag) return tag;
        if (comment) return '<span class="token comment">' + comment + '</span>';
        if (blockComment) return '<span class="token comment">' + blockComment + '</span>';
        if (str) return '<span class="token string">' + str + '</span>';
        if (kw) return '<span class="token keyword">' + kw + '</span>';
        if (op) return '<span class="token operator">' + op + '</span>';
        if (typeToken) return '<span class="token type">' + typeToken + '</span>';
        if (num) return '<span class="token number">' + num + '</span>';
        return m;
      });
    })
    .join('\n');

  return highlighted;
}

/* ─── Init Editor ─── */
function initFSharpEditor() {
  const editor = document.getElementById('fsharpEditor');
  const highlight = document.getElementById('fsharpHighlight');
  if (!editor || !highlight) return;

  const outputBody = document.getElementById('fsharpOutputBody');
  const consoleBody = document.getElementById('fsharpConsoleBody');
  const runBtn = document.getElementById('fsharpRunBtn');
  const resetBtn = document.getElementById('fsharpResetBtn');
  const copyBtn = document.getElementById('fsharpCopyBtn');
  const saveBtn = document.getElementById('fsharpSaveBtn');
  const exampleSelect = document.getElementById('fsharpExampleSelect');
  const lineNumbers = document.getElementById('fsharpLineNumbers');
  const statusBadge = document.getElementById('fsharpStatusBadge');
  const consoleClear = document.getElementById('fsharpConsoleClear');
  const fileList = document.getElementById('fsharpFileList');
  const newFileBtn = document.getElementById('fsharpNewFileBtn');
  const activeFileNameEl = document.getElementById('fsharpActiveFileName');

  const SAVE_KEY = 'fsharp-editor-project';
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || FSHARP_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(FSHARP_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(FSHARP_EXAMPLES.hello));
    activeIndex = 0;
  }

  // Initial Sync
  syncEditorState();
  renderFileList();

  // Scroll Sync
  editor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  // Input & Hotkeys
  editor.addEventListener('input', () => {
    files[activeIndex].content = editor.value;
    updateSyntaxHighlight();
    updateLineNumbers();
  });

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value =
        editor.value.substring(0, s) + '  ' + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      files[activeIndex].content = editor.value;
      updateSyntaxHighlight();
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveProject();
    }
  });

  // Actions
  runBtn.addEventListener('click', runCode);
  resetBtn.addEventListener('click', resetProject);
  copyBtn.addEventListener('click', copyCurrentFileCode);
  saveBtn.addEventListener('click', saveProject);
  consoleClear.addEventListener('click', clearConsole);

  exampleSelect.addEventListener('change', () => {
    const val = exampleSelect.value;
    if (FSHARP_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(FSHARP_EXAMPLES[val]));
      activeIndex = 0;
      syncEditorState();
      renderFileList();
    }
  });

  newFileBtn.addEventListener('click', showNewFileInput);

  /* ── Core Editor Functions ── */

  function syncEditorState() {
    const activeFile = files[activeIndex];
    activeFileNameEl.textContent = activeFile.name;
    editor.value = activeFile.content;
    updateSyntaxHighlight();
    updateLineNumbers();

    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    highlight.innerHTML = highlightFSharp(editor.value) + '\n';
  }

  function updateLineNumbers() {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }

  function renderFileList() {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
      const el = document.createElement('div');
      el.className = `file-item ${index === activeIndex ? 'active' : ''}`;
      el.dataset.index = index;

      const nameContainer = document.createElement('div');
      nameContainer.className = 'file-name-container';
      nameContainer.innerHTML = `<i class="fas fa-code-branch"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement('div');
      actionContainer.className = 'file-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'file-action-btn edit';
      editBtn.title = 'Rename File';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'file-action-btn delete';
      delBtn.title = 'Delete File';
      delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFile(index);
      });
      actionContainer.appendChild(delBtn);

      el.appendChild(actionContainer);

      el.addEventListener('click', () => {
        activeIndex = index;
        syncEditorState();
        renderFileList();
      });

      fileList.appendChild(el);
    });
  }

  function showNewFileInput() {
    if (fileList.querySelector('.file-item-input-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'file-item-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
    input.placeholder = 'filename.fs';
    wrapper.appendChild(input);

    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      let fileName = input.value.trim();
      if (!fileName) {
        wrapper.remove();
        return;
      }
      if (!fileName.endsWith('.fs')) {
        fileName += '.fs';
      }

      if (files.some((f) => f.name.toLowerCase() === fileName.toLowerCase())) {
        alert('A file with this name already exists.');
        input.focus();
        return;
      }

      const newFile = {
        name: fileName,
        content: '// Write F# code here...\n',
      };

      files.push(newFile);
      activeIndex = files.length - 1;
      wrapper.remove();
      saveProject();
      syncEditorState();
      renderFileList();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishNewFile();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        wrapper.remove();
      }
    });

    input.addEventListener('blur', () => {
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

    itemEl.innerHTML = '';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'file-item-input';
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

      if (!newName.endsWith('.fs')) {
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
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

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishRename();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        renderFileList();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.parentNode) {
          finishRename();
        }
      }, 200);
    });
  }

  function deleteFile(index) {
    if (files.length <= 1) {
      alert('At least one file must remain in the project.');
      return;
    }

    if (confirm('Are you sure you want to delete this file?')) {
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
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        files,
        activeIndex,
      })
    );
    showActionIndicator(saveBtn, '<i class="fas fa-check"></i>');
  }

  function resetProject() {
    if (
      confirm(
        'Are you sure you want to reset the current editor contents to template defaults? All local edits will be lost.'
      )
    ) {
      const val = exampleSelect.value;
      files = JSON.parse(JSON.stringify(FSHARP_EXAMPLES[val] || FSHARP_EXAMPLES.hello));
      activeIndex = 0;
      saveProject();
      syncEditorState();
      renderFileList();
      showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
    }
  }

  function copyCurrentFileCode() {
    navigator.clipboard
      .writeText(editor.value)
      .then(() => {
        showActionIndicator(copyBtn, '<i class="fas fa-check"></i>');
      })
      .catch(() => {
        logError('Failed to copy code to clipboard.');
      });
  }

  function showActionIndicator(btn, successHTML) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = successHTML;
    btn.style.color = '#22c55e';
    btn.style.borderColor = '#22c55e';
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }

  function clearConsole() {
    consoleBody.innerHTML = '<span class="fsharp-console-placeholder">No errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus('running');
    outputBody.innerHTML = '<span class="fsharp-output-placeholder">Running F# code...</span>';
    consoleBody.innerHTML = '<span class="fsharp-console-placeholder">No errors.</span>';

    const { output, errors } = await executeFSharp(files);
    if (seq !== runSeq) return;

    if (output.length > 0) {
      outputBody.innerHTML = '';
      output.forEach((line) => {
        const el = document.createElement('span');
        el.className = 'fsharp-output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML =
        '<span class="fsharp-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = '';
      errors.forEach(logError);
      setStatus('error');
    } else {
      setStatus('ready');
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector('.fsharp-console-placeholder');
    if (placeholder) placeholder.remove();
    const el = document.createElement('span');
    el.className = 'fsharp-console-line';
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready: ['Ready', 'fsharp-status-ready'],
      running: ['Running', 'fsharp-status-running'],
      error: ['Error', 'fsharp-status-error'],
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `fsharp-status-badge ${cls}`;
  }
}

window.addEventListener('resize', () => {
  const lineNumbers = document.getElementById('fsharpLineNumbers');
  const editor = document.getElementById('fsharpEditor');
  if (lineNumbers && editor) {
    const count = editor.value.split('\n').length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join(
      '\n'
    );
  }
});
