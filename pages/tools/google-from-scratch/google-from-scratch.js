"use strict";

/* =====================================================================
   1. MOCK DATASET — "The Mini Web"
   ===================================================================== */
const MINI_WEB = [
  {
    id: 1,
    title: "Inverted Index: The Heart of Every Search Engine",
    url: "minastodocs.dev/inverted-index",
    category: "Search Engines",
    content: "An inverted index is the core data structure behind every modern search engine. Instead of scanning every document for a query term, the index maps each term to the list of documents that contain it, giving constant time term lookup. Search engines like Google build this index by tokenizing billions of web pages, normalizing each token, and recording the term frequency and position within every document. When a user submits a search query, the engine intersects the posting lists for each query term and ranks the results using term frequency and inverse document frequency."
  },
  {
    id: 2,
    title: "PageRank: How Google Ranks the Web",
    url: "minastodocs.dev/pagerank",
    category: "Search Engines",
    content: "PageRank was the original ranking algorithm behind Google search. It models the web as a graph of pages connected by links and treats every link as a vote of confidence. A page that receives links from many important pages inherits some of that importance. PageRank is computed iteratively until the rank values converge, and it was later combined with text relevance signals like term frequency and inverse document frequency to rank search results."
  },
  {
    id: 3,
    title: "An Introduction to Artificial Intelligence",
    url: "minastodocs.dev/intro-ai",
    category: "Artificial Intelligence",
    content: "Artificial intelligence is the field of building systems that can perform tasks normally requiring human intelligence, such as understanding language, recognizing images, and making decisions. Modern artificial intelligence relies heavily on machine learning, where a model learns patterns from data instead of following hand written rules. Search engines increasingly use artificial intelligence to understand query intent and rank documents beyond simple keyword matching."
  },
  {
    id: 4,
    title: "Quantum Computing Basics",
    url: "minastodocs.dev/quantum-computing",
    category: "Quantum Computing",
    content: "Quantum computing uses quantum bits, or qubits, which can exist in a superposition of zero and one at the same time. This allows a quantum computer to explore many possible solutions in parallel. Algorithms like Grover's search algorithm can search an unsorted database faster than any classical algorithm, and Shor's algorithm can factor large numbers efficiently, which has major implications for cryptography."
  },
  {
    id: 5,
    title: "Distributed Systems and Consensus",
    url: "minastodocs.dev/distributed-systems",
    category: "Distributed Systems",
    content: "A distributed system is a collection of independent computers that appear to users as a single coherent system. Building a distributed search engine requires partitioning the inverted index across many machines, replicating data for fault tolerance, and reaching consensus on the state of the cluster. Algorithms like Paxos and Raft allow a distributed system to agree on a single value even when some nodes fail."
  },
  {
    id: 6,
    title: "Web Performance Optimization for Search Results",
    url: "minastodocs.dev/web-performance",
    category: "Web Performance",
    content: "Web performance directly affects how users experience a search engine results page. Techniques like lazy loading images, caching frequent search queries, compressing network responses, and minimizing the critical rendering path all reduce the time it takes for a results page to become interactive. A fast search engine feels more trustworthy, and even a small delay in response time can measurably reduce how often users click a result."
  },
  {
    id: 7,
    title: "Neural Networks and Deep Learning for Ranking",
    url: "minastodocs.dev/neural-ranking",
    category: "Artificial Intelligence",
    content: "Neural networks are layered mathematical models that learn to approximate complex functions from examples. In modern search engines, neural ranking models take a query and a document and learn a relevance score directly from user click data, going beyond the classic term frequency and inverse document frequency approach. Deep learning based ranking can capture synonyms and query intent that a purely lexical index would miss."
  },
  {
    id: 8,
    title: "Database Indexing Strategies",
    url: "minastodocs.dev/db-indexing",
    category: "Databases",
    content: "Databases use index structures like B-trees and hash indexes to avoid scanning every row for a query. An inverted index is a specialized structure optimized for text search, mapping each term to the rows or documents that contain it. Choosing the right index structure depends on whether the query pattern favors exact lookup, range queries, or full text search."
  },
  {
    id: 9,
    title: "Anatomy of a Search Query",
    url: "minastodocs.dev/anatomy-of-a-query",
    category: "Search Engines",
    content: "When a user types a search query, the text is first tokenized and normalized the same way the documents were during indexing. The search engine then looks up each query term in the inverted index, retrieves the matching posting lists, and computes a relevance score for every candidate document using term frequency and inverse document frequency. Finally the engine sorts documents by score and returns the top results within milliseconds."
  },
  {
    id: 10,
    title: "Caching Strategies for Web Scale Systems",
    url: "minastodocs.dev/caching-strategies",
    category: "Distributed Systems",
    content: "Caching stores the result of an expensive computation so a future request can be served instantly. A large scale search engine caches popular search queries, cached snippets of ranked results, and even entire index segments in memory. Cache invalidation is one of the hardest problems in distributed systems, since a cached search result must eventually reflect newly indexed documents."
  }
];

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","of","to","in","on","at",
  "for","and","or","but","with","as","by","this","that","it","its","from","into",
  "than","then","so","such","not","no","can","could","will","would","should","may",
  "might","must","if","when","while","which","who","whom","these","those","there",
  "their","they","them","he","she","his","her","i","you","your","we","our","us",
  "also","even","how","what","up","out","over","some","any","all","each","every"
]);

/* =====================================================================
   2. InvertedIndexEngine — data structure + TF-IDF ranking

   Posting shape stored per term:
     { docId, tf, count, positions }
   ===================================================================== */
class InvertedIndexEngine {
  constructor(stopWords = STOP_WORDS) {
    this.documents = new Map();   // docId -> { ...doc, totalTerms }
    this.index = new Map();       // term  -> [ { docId, tf, count, positions } ]
    this.stopWords = stopWords;
    this.totalDocs = 0;
  }

  /** Lowercase, strip punctuation, split on whitespace, drop empties. */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  /** Tokenize + remove stop words — used for indexing and querying alike. */
  normalizedTokens(text) {
    return this.tokenize(text).filter((t) => !this.stopWords.has(t));
  }

  addDocument(doc) {
    const tokens = this.normalizedTokens(`${doc.title} ${doc.content}`);
    this.documents.set(doc.id, { ...doc, totalTerms: tokens.length });
    this.totalDocs = this.documents.size;

    const perTerm = new Map(); // term -> { count, positions[] }
    tokens.forEach((term, position) => {
      if (!perTerm.has(term)) perTerm.set(term, { count: 0, positions: [] });
      const entry = perTerm.get(term);
      entry.count += 1;
      entry.positions.push(position);
    });

    perTerm.forEach((entry, term) => {
      const tf = tokens.length === 0 ? 0 : entry.count / tokens.length;
      if (!this.index.has(term)) this.index.set(term, []);
      this.index.get(term).push({
        docId: doc.id,
        tf,
        count: entry.count,
        positions: entry.positions
      });
    });
  }

  buildIndex(docs) {
    docs.forEach((doc) => this.addDocument(doc));
  }

  /** IDF(t, D) = log( |D| / (df(t) + 1) ) + 1 */
  idf(term) {
    const postings = this.index.get(term);
    const df = postings ? postings.length : 0;
    return Math.log(this.totalDocs / (df + 1)) + 1;
  }

  /** Ranked search: Score(d,Q) = Σ TF(t,d) × IDF(t,D) */
  search(query) {
    const queryTerms = this.normalizedTokens(query);
    if (queryTerms.length === 0) return [];

    const scores = new Map(); // docId -> cumulative score
    queryTerms.forEach((term) => {
      const postings = this.index.get(term);
      if (!postings) return;
      const idf = this.idf(term);
      postings.forEach((p) => {
        scores.set(p.docId, (scores.get(p.docId) || 0) + p.tf * idf);
      });
    });

    return Array.from(scores.entries())
      .map(([docId, score]) => ({ doc: this.documents.get(docId), score }))
      .sort((a, b) => b.score - a.score);
  }

  /** Prefix match against index keys, ranked by document frequency then alpha. */
  getAutocompleteSuggestions(prefix, limit = 8) {
    const p = prefix.toLowerCase().trim();
    if (!p) return [];
    const matches = [];
    for (const term of this.index.keys()) {
      if (term.startsWith(p)) matches.push(term);
    }
    matches.sort((a, b) => {
      const dfDiff = this.index.get(b).length - this.index.get(a).length;
      return dfDiff !== 0 ? dfDiff : a.localeCompare(b);
    });
    return matches.slice(0, limit);
  }

  /** Full TF / IDF / weight breakdown per matching document for a query. */
  getScoreDetails(query) {
    const queryTerms = [...new Set(this.normalizedTokens(query))];
    if (queryTerms.length === 0) return [];

    const docIds = new Set();
    queryTerms.forEach((term) => {
      const postings = this.index.get(term);
      if (postings) postings.forEach((p) => docIds.add(p.docId));
    });

    const details = [];
    docIds.forEach((docId) => {
      const doc = this.documents.get(docId);
      let total = 0;
      const terms = queryTerms.map((term) => {
        const postings = this.index.get(term) || [];
        const posting = postings.find((p) => p.docId === docId);
        const idf = this.idf(term);
        const tf = posting ? posting.tf : 0;
        const weight = tf * idf;
        total += weight;
        return { term, tf, idf, weight, count: posting ? posting.count : 0 };
      });
      details.push({ docId, title: doc.title, terms, total });
    });

    return details.sort((a, b) => b.total - a.total);
  }

  getStats() {
    let postingCount = 0;
    this.index.forEach((postings) => { postingCount += postings.length; });
    return {
      docCount: this.totalDocs,
      termCount: this.index.size,
      postingCount
    };
  }
}

/* =====================================================================
   3. UIController — DOM binding, debounced search, rendering

   Responsibilities:
     - View router (Welcome Screen <-> Workspace Screen)
     - Left-pane tab navigation (Context / Index Visualizer / Score Breakdown)
     - Debounced (150ms) search execution + autocomplete
     - Result rendering with snippet highlighting and timing metrics
     - Modal open/close for full document view
     - All DOM event wiring
   ===================================================================== */
const UIController = (() => {
  const engine = new InvertedIndexEngine();
  engine.buildIndex(MINI_WEB);

  let activeTab = "context";
  let currentQuery = "";
  let autocompleteItems = [];
  let autocompleteHighlightIndex = -1;

  const el = {
    welcomeScreen: document.getElementById("welcome-screen"),
    workspaceScreen: document.getElementById("workspace-screen"),
    startModuleBtn: document.getElementById("start-module-btn"),
    devUnlockBtn: document.getElementById("dev-unlock-btn"),
    previousBtn: document.getElementById("previous-btn"),
    backBtn: document.getElementById("back-to-welcome-btn"),
    toast: document.getElementById("toast"),

    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanels: document.querySelectorAll(".tab-panel"),

    statDocCount: document.getElementById("stat-doc-count"),
    statTermCount: document.getElementById("stat-term-count"),
    statPostingCount: document.getElementById("stat-posting-count"),

    indexFilterInput: document.getElementById("index-filter-input"),
    indexTableWrap: document.getElementById("index-table-wrap"),
    scoreBreakdownWrap: document.getElementById("score-breakdown-wrap"),

    searchInput: document.getElementById("search-input"),
    clearBtn: document.getElementById("clear-search-btn"),
    searchSubmitBtn: document.getElementById("search-submit-btn"),
    autocompleteDropdown: document.getElementById("autocomplete-dropdown"),
    benchmarkBar: document.getElementById("benchmark-bar"),
    resultsZone: document.getElementById("results-zone"),
    initialEmptyState: document.getElementById("initial-empty-state"),

    modalOverlay: document.getElementById("modal-overlay"),
    modalBox: document.getElementById("modal-box"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalTitle: document.getElementById("modal-title"),
    modalUrl: document.getElementById("modal-url"),
    modalContent: document.getElementById("modal-content")
  };

  /** Escapes HTML-significant characters so untrusted/derived text is safe to inject. */
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Standard trailing-edge debounce: waits `delay` ms of silence, then fires once. */
  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  /* ---------------- Router ---------------- */
  function goToWorkspace() {
    el.welcomeScreen.classList.remove("active");
    el.workspaceScreen.classList.add("active");
    el.workspaceScreen.style.display = "flex";
    renderStats();
    renderIndexTable("");
    el.searchInput.focus();
  }

  function goToWelcome() {
    el.workspaceScreen.classList.remove("active");
    el.welcomeScreen.classList.add("active");
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.toast.classList.remove("visible"), 2200);
  }

  /* ---------------- Tabs ---------------- */
  function switchTab(name) {
    activeTab = name;
    el.tabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === name));
    el.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${name}`));
    if (name === "index") renderIndexTable(el.indexFilterInput.value);
    if (name === "scores") renderScoreBreakdown(currentQuery);
  }

  /* ---------------- Context tab stats ---------------- */
  function renderStats() {
    const stats = engine.getStats();
    el.statDocCount.textContent = stats.docCount;
    el.statTermCount.textContent = stats.termCount;
    el.statPostingCount.textContent = stats.postingCount;
  }

  /* ---------------- Index visualizer tab ---------------- */
  function renderIndexTable(filter) {
    const f = (filter || "").toLowerCase().trim();
    let terms = Array.from(engine.index.keys());
    if (f) terms = terms.filter((t) => t.includes(f));
    terms.sort((a, b) => engine.index.get(b).length - engine.index.get(a).length || a.localeCompare(b));
    terms = terms.slice(0, 60);

    if (terms.length === 0) {
      el.indexTableWrap.innerHTML = `<div class="index-empty">No indexed terms match "${escapeHtml(f)}".</div>`;
      return;
    }

    const rows = terms.map((term) => {
      const postings = engine.index.get(term);
      const postingsText = postings
        .slice(0, 4)
        .map((p) => `doc#${p.docId} tf=${p.tf.toFixed(3)} n=${p.count}`)
        .join("<br>");
      const more = postings.length > 4 ? `<br>+${postings.length - 4} more` : "";
      return `<tr>
        <td class="term-cell">${escapeHtml(term)}</td>
        <td>${postings.length}</td>
        <td class="postings-cell">${postingsText}${more}</td>
      </tr>`;
    }).join("");

    el.indexTableWrap.innerHTML = `
      <table class="index-table">
        <thead><tr><th>Term</th><th>DF</th><th>Postings (docId · tf · count)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${terms.length === 60 ? '<div style="color:var(--text-faint);font-size:11px;margin-top:10px;">Showing top 60 matching terms.</div>' : ""}
    `;
  }

  /* ---------------- Score breakdown tab ---------------- */
  function renderScoreBreakdown(query) {
    if (!query || !query.trim()) {
      el.scoreBreakdownWrap.innerHTML = `<div class="score-empty">Run a search on the right to see the exact TF, IDF, and weight for every matching document.</div>`;
      return;
    }
    const details = engine.getScoreDetails(query);
    if (details.length === 0) {
      el.scoreBreakdownWrap.innerHTML = `<div class="score-empty">No documents contain any term from "${escapeHtml(query)}".</div>`;
      return;
    }

    el.scoreBreakdownWrap.innerHTML = details.map((d) => `
      <div class="score-doc-block">
        <div class="score-doc-title">${escapeHtml(d.title)}</div>
        <div class="score-doc-total">Total score = ${d.total.toFixed(4)}</div>
        <div class="score-term-row header">
          <span>Term</span><span>TF</span><span>IDF</span><span>Weight</span>
        </div>
        ${d.terms.map((t) => `
          <div class="score-term-row">
            <span class="term-name">${escapeHtml(t.term)}</span>
            <span>${t.tf.toFixed(4)}</span>
            <span>${t.idf.toFixed(4)}</span>
            <span>${t.weight.toFixed(4)}</span>
          </div>
        `).join("")}
      </div>
    `).join("");
  }

  /* ---------------- Snippet highlighting ---------------- */

  /** Wraps every whole-word occurrence of any query term in <mark>, longest terms first
   *  so overlapping matches (e.g. "search" and "searches") don't get double-wrapped. */
  function highlightTerms(text, terms) {
    if (!terms.length) return escapeHtml(text);
    const escaped = terms
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);
    const re = new RegExp(`\\b(${escaped.join("|")})`, "gi");
    return escapeHtml(text).replace(re, (m) => `<mark>${m}</mark>`);
  }

  /** Centers a ~180-char snippet window on the first query-term occurrence in the doc. */
  function buildSnippet(doc, queryTerms) {
    const lowerContent = doc.content.toLowerCase();
    let anchor = 0;
    for (const term of queryTerms) {
      const idx = lowerContent.indexOf(term);
      if (idx !== -1) { anchor = idx; break; }
    }
    const radius = 90;
    const start = Math.max(0, anchor - radius);
    const end = Math.min(doc.content.length, anchor + radius);
    let snippet = doc.content.slice(start, end).trim();
    if (start > 0) snippet = "… " + snippet;
    if (end < doc.content.length) snippet = snippet + " …";
    return highlightTerms(snippet, queryTerms);
  }

  function faviconLetter(url) {
    return url.replace(/^https?:\/\//, "")[0].toUpperCase();
  }

  /* ---------------- Search execution ---------------- */
  function runSearch(query) {
    currentQuery = query;
    el.clearBtn.classList.toggle("visible", query.length > 0);

    if (!query.trim()) {
      el.benchmarkBar.textContent = "Type a query to search 10 indexed documents.";
      el.resultsZone.innerHTML = "";
      el.resultsZone.appendChild(el.initialEmptyState);
      if (activeTab === "scores") renderScoreBreakdown("");
      return;
    }

    const t0 = performance.now();
    const results = engine.search(query);
    const t1 = performance.now();
    const elapsedMs = (t1 - t0).toFixed(2);

    el.benchmarkBar.innerHTML = `Found <span class="bench-highlight">${results.length}</span> result${results.length === 1 ? "" : "s"} in <span class="bench-highlight">${elapsedMs} ms</span>`;

    const queryTerms = engine.normalizedTokens(query);

    if (results.length === 0) {
      el.resultsZone.innerHTML = `
        <div class="empty-state">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <div class="empty-title">No matches in the mini web</div>
          <div class="empty-sub">No indexed document contains any term from "${escapeHtml(query)}". Try a broader query like “search” or “systems”.</div>
        </div>`;
    } else {
      el.resultsZone.innerHTML = results.map(({ doc, score }) => `
        <article class="result-card">
          <div class="result-breadcrumb">
            <span class="favicon-dot">${escapeHtml(faviconLetter(doc.url))}</span>
            <span>${escapeHtml(doc.url)}</span>
          </div>
          <button class="result-title" data-doc-id="${doc.id}">${escapeHtml(doc.title)}</button>
          <div class="result-snippet">${buildSnippet(doc, queryTerms)}</div>
          <div class="result-footer">
            <span class="score-badge">Score: ${score.toFixed(3)}</span>
            <span class="category-badge">${escapeHtml(doc.category)}</span>
          </div>
        </article>
      `).join("");

      el.resultsZone.querySelectorAll(".result-title").forEach((btn) => {
        btn.addEventListener("click", () => openModal(Number(btn.dataset.docId), queryTerms));
      });
    }

    if (activeTab === "scores") renderScoreBreakdown(query);
  }

  const debouncedRunSearch = debounce(runSearch, 150);

  /* ---------------- Autocomplete ---------------- */

  /** Suggests completions for the last (partial) word being typed, not the whole query. */
  function renderAutocomplete(query) {
    const suggestions = engine.getAutocompleteSuggestions(query.trim().split(/\s+/).pop() || "");
    autocompleteItems = suggestions;
    autocompleteHighlightIndex = -1;

    if (!query.trim() || suggestions.length === 0) {
      el.autocompleteDropdown.classList.remove("visible");
      el.autocompleteDropdown.innerHTML = "";
      return;
    }

    el.autocompleteDropdown.innerHTML = suggestions.map((term, i) => `
      <div class="autocomplete-item" data-index="${i}" data-term="${escapeHtml(term)}">
        <span class="term-text">${escapeHtml(term)}</span>
        <span class="df-badge">${engine.index.get(term).length} docs</span>
      </div>
    `).join("");
    el.autocompleteDropdown.classList.add("visible");

    el.autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        applyAutocompleteTerm(item.dataset.term);
      });
    });
  }

  const debouncedAutocomplete = debounce(renderAutocomplete, 150);

  /** Replaces the last (partial) word in the search box with the chosen term, then searches. */
  function applyAutocompleteTerm(term) {
    const parts = el.searchInput.value.trim().split(/\s+/);
    parts[parts.length - 1] = term;
    const newValue = parts.join(" ") + " ";
    el.searchInput.value = newValue;
    el.autocompleteDropdown.classList.remove("visible");
    el.searchInput.focus();
    runSearch(newValue);
  }

  /** Moves the keyboard-highlighted autocomplete row up/down, wrapping at the ends. */
  function moveAutocompleteHighlight(delta) {
    const items = el.autocompleteDropdown.querySelectorAll(".autocomplete-item");
    if (!items.length) return;
    autocompleteHighlightIndex = (autocompleteHighlightIndex + delta + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle("highlighted", i === autocompleteHighlightIndex));
    items[autocompleteHighlightIndex].scrollIntoView({ block: "nearest" });
  }

  /* ---------------- Modal ---------------- */
  function openModal(docId, queryTerms) {
    const doc = engine.documents.get(docId);
    if (!doc) return;
    el.modalTitle.textContent = doc.title;
    el.modalUrl.textContent = doc.url;
    el.modalContent.innerHTML = highlightTerms(doc.content, queryTerms || []);
    el.modalOverlay.classList.add("visible");
  }

  function closeModal() {
    el.modalOverlay.classList.remove("visible");
  }

  /* ---------------- Event wiring ---------------- */
  function bindEvents() {
    // Routing
    el.startModuleBtn.addEventListener("click", goToWorkspace);
    el.devUnlockBtn.addEventListener("click", goToWorkspace);
    el.backBtn.addEventListener("click", goToWelcome);
    el.previousBtn.addEventListener("click", () => showToast("You're already at the beginning of the course."));

    // Tabs
    el.tabBtns.forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

    // Index Visualizer filter
    el.indexFilterInput.addEventListener("input", () => renderIndexTable(el.indexFilterInput.value));

    // Search input: debounced search + debounced autocomplete on every keystroke
    el.searchInput.addEventListener("input", () => {
      const value = el.searchInput.value;
      el.clearBtn.classList.toggle("visible", value.length > 0);
      debouncedRunSearch(value);
      debouncedAutocomplete(value);
    });

    // Keyboard navigation within the search box: arrows move autocomplete highlight,
    // Enter either accepts the highlighted suggestion or runs the search immediately,
    // Escape dismisses the dropdown.
    el.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && el.autocompleteDropdown.classList.contains("visible")) {
        e.preventDefault();
        moveAutocompleteHighlight(1);
      } else if (e.key === "ArrowUp" && el.autocompleteDropdown.classList.contains("visible")) {
        e.preventDefault();
        moveAutocompleteHighlight(-1);
      } else if (e.key === "Enter") {
        if (autocompleteHighlightIndex >= 0 && autocompleteItems[autocompleteHighlightIndex]) {
          applyAutocompleteTerm(autocompleteItems[autocompleteHighlightIndex]);
        } else {
          el.autocompleteDropdown.classList.remove("visible");
          runSearch(el.searchInput.value);
        }
      } else if (e.key === "Escape") {
        el.autocompleteDropdown.classList.remove("visible");
      }
    });

    // Explicit "Search" button — bypasses the debounce for an immediate result.
    el.searchSubmitBtn.addEventListener("click", () => {
      el.autocompleteDropdown.classList.remove("visible");
      runSearch(el.searchInput.value);
    });

    // Clear button resets the query, results, and autocomplete state.
    el.clearBtn.addEventListener("click", () => {
      el.searchInput.value = "";
      el.clearBtn.classList.remove("visible");
      el.autocompleteDropdown.classList.remove("visible");
      runSearch("");
      el.searchInput.focus();
    });

    // Click-outside-to-dismiss for the autocomplete dropdown.
    document.addEventListener("click", (e) => {
      if (!el.autocompleteDropdown.contains(e.target) && e.target !== el.searchInput) {
        el.autocompleteDropdown.classList.remove("visible");
      }
    });

    // Modal close: close button, click on the dimmed overlay, or Escape key.
    el.modalCloseBtn.addEventListener("click", closeModal);
    el.modalOverlay.addEventListener("click", (e) => {
      if (e.target === el.modalOverlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && el.modalOverlay.classList.contains("visible")) closeModal();
    });
  }

  function init() {
    bindEvents();
    renderStats();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => UIController.init());
