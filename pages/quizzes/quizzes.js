/* ============================================
   ALL QUIZZES — Data, Search & Filter
   ============================================ */

const quizzes = [
  // ── Data Structures ──
  {
    name: 'Arrays',
    path: '/pages/topic-quiz/topic-quiz.html?topic=arrays',
    category: 'Data Structures',
    icon: 'fa-layer-group',
    desc: 'Contiguous memory, indexing, traversal, two-pointer techniques, and Kadane\'s algorithm.',
    difficulty: 'easy',
    questions: 15,
  },
  {
    name: 'Linked Lists',
    path: '/pages/topic-quiz/topic-quiz.html?topic=linkedlist',
    category: 'Data Structures',
    icon: 'fa-link',
    desc: 'Singly, doubly, and circular linked lists — pointer manipulation, reversal, and cycle detection.',
    difficulty: 'easy',
    questions: 12,
  },
  {
    name: 'Stacks',
    path: '/pages/topic-quiz/topic-quiz.html?topic=stack',
    category: 'Data Structures',
    icon: 'fa-layer-group',
    desc: 'LIFO data structure — expression evaluation, monotonic stacks, balanced parentheses, and DFS.',
    difficulty: 'easy',
    questions: 10,
  },
  {
    name: 'Queues',
    path: '/pages/topic-quiz/topic-quiz.html?topic=queue',
    category: 'Data Structures',
    icon: 'fa-arrow-right-arrow-left',
    desc: 'FIFO data structure — BFS traversal, circular buffers, deques, and task scheduling.',
    difficulty: 'easy',
    questions: 10,
  },
  {
    name: 'Trees',
    path: '/pages/topic-quiz/topic-quiz.html?topic=trees',
    category: 'Data Structures',
    icon: 'fa-tree',
    desc: 'Binary trees, BSTs, traversals, LCA, and tree-based problem solving patterns.',
    difficulty: 'medium',
    questions: 18,
  },
  {
    name: 'Graphs',
    path: '/pages/topic-quiz/topic-quiz.html?topic=graphs',
    category: 'Data Structures',
    icon: 'fa-project-diagram',
    desc: 'Adjacency lists, BFS/DFS traversals, connectivity, and shortest path fundamentals.',
    difficulty: 'medium',
    questions: 16,
  },
  {
    name: 'Heaps',
    path: '/pages/topic-quiz/topic-quiz.html?topic=heaps',
    category: 'Data Structures',
    icon: 'fa-chart-simple',
    desc: 'Heap property, heapify, priority queues, and heap-related problem patterns.',
    difficulty: 'medium',
    questions: 12,
  },
  {
    name: 'Hash Tables',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Data Structures',
    icon: 'fa-hashtag',
    desc: 'Hash functions, collision resolution, O(1) lookups, and frequency counting techniques.',
    difficulty: 'easy',
    questions: 14,
  },
  {
    name: 'Tries',
    path: '/pages/topic-quiz/topic-quiz.html?topic=trie',
    category: 'Data Structures',
    icon: 'fa-language',
    desc: 'Prefix trees for autocomplete, spell check, pattern matching, and word search.',
    difficulty: 'medium',
    questions: 12,
  },

  // ── Core Algorithms ──
  {
    name: 'Sorting',
    path: '/pages/topic-quiz/topic-quiz.html?topic=sorting',
    category: 'Core Algorithms',
    icon: 'fa-arrow-down-wide-short',
    desc: 'Quick sort, merge sort, heap sort, counting sort, and comparison-based sorting analysis.',
    difficulty: 'easy',
    questions: 16,
  },
  {
    name: 'Searching',
    path: '/pages/topic-quiz/topic-quiz.html?topic=binarysearch',
    category: 'Core Algorithms',
    icon: 'fa-crosshairs',
    desc: 'Binary search, ternary search, exponential search, and search in rotated arrays.',
    difficulty: 'easy',
    questions: 14,
  },
  {
    name: 'Recursion',
    path: '/pages/topic-quiz/topic-quiz.html?topic=recursion',
    category: 'Core Algorithms',
    icon: 'fa-rotate',
    desc: 'Base cases, call stacks, tail recursion, and recursive problem-solving patterns.',
    difficulty: 'medium',
    questions: 10,
  },
  {
    name: 'Two Pointers',
    path: '/pages/topic-quiz/topic-quiz.html?topic=twopointers',
    category: 'Core Algorithms',
    icon: 'fa-arrows-left-right',
    desc: 'Linear scanning with two pointers for pair sums, partitioning, and palindrome checking.',
    difficulty: 'easy',
    questions: 14,
  },
  {
    name: 'Sliding Window',
    path: '/pages/topic-quiz/topic-quiz.html?topic=slidingwindow',
    category: 'Core Algorithms',
    icon: 'fa-window-maximize',
    desc: 'Efficient subarray and substring processing with dynamically sized windows.',
    difficulty: 'medium',
    questions: 14,
  },
  {
    name: 'Greedy',
    path: '/pages/topic-quiz/topic-quiz.html?topic=greedy',
    category: 'Core Algorithms',
    icon: 'fa-bolt',
    desc: 'Locally optimal choices for interval scheduling, coin change, and Huffman coding.',
    difficulty: 'medium',
    questions: 16,
  },

  // ── Advanced ──
  {
    name: 'Dynamic Programming',
    path: '/pages/topic-quiz/topic-quiz.html?topic=dp',
    category: 'Advanced',
    icon: 'fa-bullseye',
    desc: 'Memoization, tabulation, optimal substructure, and classic DP patterns like knapsack and LCS.',
    difficulty: 'hard',
    questions: 20,
  },
  {
    name: 'Graph Algorithms',
    path: '/pages/topic-quiz/topic-quiz.html?topic=graphs',
    category: 'Advanced',
    icon: 'fa-route',
    desc: 'Dijkstra, Bellman-Ford, Floyd-Warshall, topological sort, and strongly connected components.',
    difficulty: 'hard',
    questions: 18,
  },
  {
    name: 'String Algorithms',
    path: '/pages/topic-quiz/topic-quiz.html?topic=strings',
    category: 'Advanced',
    icon: 'fa-font',
    desc: 'KMP, Rabin-Karp, Z-algorithm, Manacher\'s, and string hashing techniques.',
    difficulty: 'hard',
    questions: 14,
  },
  {
    name: 'Number Theory',
    path: '/pages/topic-quiz/topic-quiz.html?topic=numbertheory',
    category: 'Advanced',
    icon: 'fa-square-root-variable',
    desc: 'GCD, modular arithmetic, prime sieves, combinatorics, and Euler\'s theorem.',
    difficulty: 'medium',
    questions: 16,
  },
  {
    name: 'Bit Manipulation',
    path: '/pages/topic-quiz/topic-quiz.html?topic=bitmanipulation',
    category: 'Advanced',
    icon: 'fa-microchip',
    desc: 'Bitwise operators, masks, XOR tricks, subset generation, and space-efficient techniques.',
    difficulty: 'medium',
    questions: 14,
  },

  // ── Special ──
  {
    name: 'DSA Quick Fire',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-stopwatch',
    desc: 'Rapid-fire mixed questions across all DSA topics — test your speed and accuracy.',
    difficulty: 'medium',
    questions: 25,
  },
  {
    name: 'CP Patterns Quiz',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-trophy',
    desc: 'Competitive programming patterns: sieve, combinatorics, two-pointer, and more.',
    difficulty: 'hard',
    questions: 20,
  },
  {
    name: 'Algorithm Identification',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-eye',
    desc: 'Identify the correct algorithm or data structure from problem descriptions and pseudocode.',
    difficulty: 'medium',
    questions: 18,
  },
  {
    name: 'Time Complexity',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-chart-line',
    desc: 'Master Big O analysis — identify time and space complexity of algorithms and code snippets.',
    difficulty: 'easy',
    questions: 20,
  },
  {
    name: 'Mixed Bag Challenge',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-shuffle',
    desc: 'A random assortment of questions from every category — the ultimate test of your DSA knowledge.',
    difficulty: 'hard',
    questions: 30,
  },
  {
    name: 'Interview Prep',
    path: '/pages/tools/quiz-system/quiz-system.html',
    category: 'Special',
    icon: 'fa-briefcase',
    desc: 'Curated questions commonly asked in top tech company interviews — FAANG and beyond.',
    difficulty: 'hard',
    questions: 25,
  },
];

/* ─── Categories ─── */
const categories = ['All', 'Data Structures', 'Core Algorithms', 'Advanced', 'Special'];

/* ─── Category pastel icon colors (no purple, cyan, or lime) ─── */
const categoryColors = {
  'data-structures': '#c8d8e8',
  'core-algorithms': '#f5d8b8',
  'advanced': '#e8c8d0',
  'special': '#c8e0d0',
};

/* ─── Category display names for cards ─── */
const categoryDisplayNames = {
  'data-structures': 'Data Structures',
  'core-algorithms': 'Core Algorithms',
  'advanced': 'Advanced',
  'special': 'Special',
};

/* ─── Difficulty display mapping ─── */
const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

/* ─── Difficulty filter options ─── */
const difficultyOrder = ['All', 'Easy', 'Medium', 'Hard'];

/* ─── Safe localStorage helpers ─── */
function lsGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch (_) { /* noop */ }
}
function lsRemove(key) {
  try { localStorage.removeItem(key); } catch (_) { /* noop */ }
}

/* ─── DOM refs ─── */
const grid = document.getElementById('qzGrid');
const searchInput = document.getElementById('qzSearchInput');
const clearBtn = document.getElementById('qzClearBtn');
const filterContainer = document.getElementById('qzCategoryChips');
const diffFilterContainer = document.getElementById('qzDifficultyChips');
const emptyState = document.getElementById('qzEmpty');
const countDisplay = document.getElementById('qzCountDisplay');
const totalCountSpan = document.getElementById('qzTotalCount');

let activeCategory =
  new URLSearchParams(window.location.search).get('category') || lsGet('qzFilterCategory') || 'all';
let activeDifficulty =
  new URLSearchParams(window.location.search).get('difficulty') || lsGet('qzFilterDifficulty') || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Sync hero total count ─── */
if (totalCountSpan) totalCountSpan.textContent = quizzes.length;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qz-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent =
      cat + (cat !== 'All' ? ` (${quizzes.filter((v) => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.qz-filter-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      lsSet('qzFilterCategory', activeCategory);
      const url = new URL(window.location);
      if (activeCategory === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', activeCategory);
      }
      history.pushState({}, '', url);
      render();
    });
    filterContainer.appendChild(btn);
  });
}

/* ─── Build difficulty filter chips ─── */
function buildDifficultyFilters() {
  if (!diffFilterContainer) return;
  difficultyOrder.forEach((diff) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qz-difficulty-chip' + (diff === 'All' ? ' active' : '');
    btn.dataset.difficulty = diff === 'All' ? 'all' : diff.toLowerCase();
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', diff === 'All' ? 'true' : 'false');
    btn.textContent = diff;
    btn.addEventListener('click', () => {
      diffFilterContainer.querySelectorAll('.qz-difficulty-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeDifficulty = btn.dataset.difficulty;
      lsSet('qzFilterDifficulty', activeDifficulty);
      const url = new URL(window.location);
      if (activeDifficulty === 'all') {
        url.searchParams.delete('difficulty');
      } else {
        url.searchParams.set('difficulty', activeDifficulty);
      }
      history.pushState({}, '', url);
      render();
    });
    diffFilterContainer.appendChild(btn);
  });
}

/* ─── Render cards ─── */
function render() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filtered = quizzes.filter((v) => {
    const matchCategory =
      activeCategory === 'all' ||
      v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
    const matchDifficulty =
      activeDifficulty === 'all' ||
      v.difficulty.toLowerCase() === activeDifficulty;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q) ||
      v.difficulty.toLowerCase().includes(q);
    return matchCategory && matchDifficulty && matchSearch;
  });

  countDisplay.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = filtered
    .map((v, i) => {
      const catKey = v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const displayCat = categoryDisplayNames[catKey] || v.category;
      const diffClass = v.difficulty;
      const diffLabel = difficultyLabels[v.difficulty] || v.difficulty;
      return `
    <a href="${v.path}" class="qz-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.03, 0.8)}s">
      <div class="qz-card-header">
        <span class="qz-card-icon" style="color:${categoryColors[catKey] || 'var(--qz-primary)'}"><i class="fas ${v.icon}"></i></span>
        <span class="qz-card-difficulty ${diffClass}">${diffLabel}</span>
      </div>
      <span class="qz-card-title">${escHtml(v.name)}</span>
      <span class="qz-card-desc">${escHtml(v.desc)}</span>
      <div class="qz-card-footer">
        <span class="qz-card-category">${escHtml(displayCat)}</span>
        <span class="qz-card-question-count"><i class="fas fa-question-circle"></i> ${v.questions}</span>
        <span class="qz-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    </a>`;
    })
    .join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  clearBtn.classList.toggle('visible', searchQuery.length > 0);
  render();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearBtn.classList.remove('visible');
  render();
  searchInput.focus();
});

/* ─── Card click: set skip-loading flag before navigating ─── */
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.qz-card');
  if (card && card.href) {
    sessionStorage.setItem('_qzSkipLoading', '1');
  }
});

/* ─── Keyboard shortcut: ⌘K / Ctrl+K ─── */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.blur();
  }
});

/* ─── Back button ─── */
document.getElementById('qzBackBtn')?.addEventListener('click', () => {
  lsRemove('qzFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Title letter staggered reveal + hover tilt animation ─── */
function initTitleLetterAnimation() {
  const title = document.querySelector('.qz-hero-title');
  if (!title) return;

  const text = title.textContent.trim();
  title.innerHTML = text
    .split('')
    .map((char, i) => {
      if (char === ' ') return `<span class="qz-title-space"> </span>`;
      return `<span class="qz-title-letter" style="--i: ${i}">${char}</span>`;
    })
    .join('');

  const letters = [...title.querySelectorAll('.qz-title-letter')];
  if (letters.length === 0) return;

  let rafId = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resetLetters() {
    letters.forEach((letter) => {
      letter.style.setProperty('transition', 'transform 0.12s ease-out');
    });
    requestAnimationFrame(() => {
      letters.forEach((letter) => {
        letter.style.removeProperty('transform');
      });
    });
  }

  function onMove(e) {
    if (rafId || reducedMotion) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;

      const rect = title.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const influenceRadius = Math.max(rect.width, rect.height) * 0.45;

      letters.forEach((letter) => {
        const lRect = letter.getBoundingClientRect();
        const letterX = lRect.left - rect.left + lRect.width / 2;
        const letterY = lRect.top - rect.top + lRect.height / 2;

        const dx = mouseX - letterX;
        const dy = mouseY - letterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const rawProx = Math.max(0, 1 - dist / influenceRadius);
        const proximity = rawProx * rawProx * (3 - 2 * rawProx);

        const tiltY = Math.max(-25, Math.min(25, dx * 0.18));
        const tiltX = Math.max(-15, Math.min(15, -dy * 0.12));
        const scale = 0.92 + proximity * 0.3;

        letter.style.setProperty('transition', 'transform 0.06s ease-out');
        letter.style.setProperty('transform', `rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) scale(${scale.toFixed(3)})`);
      });
    });
  }

  function onLeave() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resetLetters();
  }

  title.addEventListener('mousemove', onMove);
  title.addEventListener('mouseleave', onLeave);
}

/* ─── Init ─── */
buildFilters();
buildDifficultyFilters();
render();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.qz-filter-chip').forEach((c) => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();

/* Restore active difficulty chip from URL */
function syncDiffChipFromURL() {
  if (!diffFilterContainer) return;
  diffFilterContainer.querySelectorAll('.qz-difficulty-chip').forEach((c) => {
    const isActive = c.dataset.difficulty === activeDifficulty;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncDiffChipFromURL();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory =
    new URLSearchParams(window.location.search).get('category') || lsGet('qzFilterCategory') || 'all';
  activeDifficulty =
    new URLSearchParams(window.location.search).get('difficulty') || lsGet('qzFilterDifficulty') || 'all';
  syncChipFromURL();
  syncDiffChipFromURL();
  render();
});

/* ─── Init title letter animation ─── */
initTitleLetterAnimation();
