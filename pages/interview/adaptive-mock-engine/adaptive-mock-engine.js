(function () {
  'use strict';

  const STORAGE_KEY = 'aiv_adaptive_mock_session';
  const PROGRESS_KEY = 'algoInfinityVerse';
  const RUBRIC_DIMS = [
    { key: 'correctness', label: 'Correctness' },
    { key: 'complexity', label: 'Complexity' },
    { key: 'communication', label: 'Communication (STAR)' },
    { key: 'edgeCases', label: 'Edge cases' },
  ];

  const QUESTION_BANK = [
    { id: 'arr-e1', topic: 'arrays', difficulty: 'Easy', type: 'DSA', prompt: 'Given an array of integers, return indices of two numbers that add up to a target.', hint: 'Hash map for O(n). Mention duplicates.' },
    { id: 'arr-m1', topic: 'arrays', difficulty: 'Medium', type: 'DSA', prompt: 'Find the maximum subarray sum (Kadane). Explain why the running sum reset works.', hint: 'Compare local vs global max.' },
    { id: 'arr-h1', topic: 'arrays', difficulty: 'Hard', type: 'DSA', prompt: 'Trapping Rain Water: compute trapped units between bars. Discuss O(n) vs O(n²).', hint: 'Two pointers or prefix max left/right.' },
    { id: 'str-e1', topic: 'strings', difficulty: 'Easy', type: 'DSA', prompt: 'Check if a string is a palindrome ignoring non-alphanumeric characters.', hint: 'Two pointers from ends.' },
    { id: 'str-m1', topic: 'strings', difficulty: 'Medium', type: 'DSA', prompt: 'Longest substring without repeating characters. Time and space complexity?', hint: 'Sliding window + map of last index.' },
    { id: 'll-e1', topic: 'linkedlist', difficulty: 'Easy', type: 'DSA', prompt: 'Reverse a singly linked list iteratively and recursively.', hint: 'Track prev/curr/next carefully.' },
    { id: 'll-m1', topic: 'linkedlist', difficulty: 'Medium', type: 'DSA', prompt: 'Detect a cycle and return the cycle start node.', hint: 'Floyd + math for entry point.' },
    { id: 'tree-e1', topic: 'trees', difficulty: 'Easy', type: 'DSA', prompt: 'Compute the maximum depth of a binary tree.', hint: 'DFS or BFS levels.' },
    { id: 'tree-m1', topic: 'trees', difficulty: 'Medium', type: 'DSA', prompt: 'Validate a Binary Search Tree. What invariants must hold?', hint: 'Pass min/max bounds down.' },
    { id: 'graph-m1', topic: 'graphs', difficulty: 'Medium', type: 'DSA', prompt: 'Number of islands in a grid. Compare DFS vs BFS.', hint: 'Mark visited in-place.' },
    { id: 'graph-h1', topic: 'graphs', difficulty: 'Hard', type: 'DSA', prompt: 'Word Ladder: shortest transformation sequence length.', hint: 'BFS over word graph.' },
    { id: 'dp-m1', topic: 'dp', difficulty: 'Medium', type: 'DSA', prompt: '0/1 Knapsack: define DP state, transition, and complexity.', hint: 'dp[i][w] or rolling array.' },
    { id: 'dp-h1', topic: 'dp', difficulty: 'Hard', type: 'DSA', prompt: 'Edit Distance between two strings. Walk through a small example.', hint: 'Levenshtein DP table.' },
    { id: 'beh-e1', topic: 'behavioral', difficulty: 'Easy', type: 'STAR', prompt: 'Tell me about a time you missed a deadline. How did you recover?', hint: 'Situation, Task, Action, Result — own the miss.' },
    { id: 'beh-m1', topic: 'behavioral', difficulty: 'Medium', type: 'STAR', prompt: 'Describe a conflict with a teammate on a technical decision.', hint: 'Focus on listening and data-driven resolution.' },
    { id: 'beh-h1', topic: 'behavioral', difficulty: 'Hard', type: 'STAR', prompt: 'A production outage hit during your on-call. Walk me through your STAR response.', hint: 'Incident command, communication, postmortem.' },
  ];

  const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

  const els = {};
  let state = null;
  let tickId = null;

  function $(id) {
    return document.getElementById(id);
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch {
      return null;
    }
  }

  function detectWeakTopics(progress) {
    const scores = (progress && progress.quizScores) || {};
    const topics = ['arrays', 'strings', 'linkedlist', 'trees', 'graphs', 'dp'];
    const weak = [];

    topics.forEach((t) => {
      const s = scores[t];
      let accuracy = null;
      if (typeof s === 'number') accuracy = s <= 1 ? s * 100 : s;
      else if (s && typeof s === 'object') {
        if (typeof s.accuracy === 'number') accuracy = s.accuracy <= 1 ? s.accuracy * 100 : s.accuracy;
        else if (typeof s.score === 'number' && typeof s.total === 'number' && s.total > 0) {
          accuracy = (s.score / s.total) * 100;
        } else if (typeof s.correct === 'number' && typeof s.total === 'number' && s.total > 0) {
          accuracy = (s.correct / s.total) * 100;
        }
      }
      if (accuracy !== null && accuracy < 70) weak.push({ topic: t, accuracy: Math.round(accuracy) });
    });

    if (progress && progress.mistakeDna) {
      const md = progress.mistakeDna;
      if ((md.offByOneCount || 0) >= 3 && !weak.find((w) => w.topic === 'arrays')) {
        weak.push({ topic: 'arrays', accuracy: 55 });
      }
    }

    weak.sort((a, b) => a.accuracy - b.accuracy);
    return weak;
  }

  function buildQueue(weakTopics, count) {
    const weakSet = new Set(weakTopics.map((w) => w.topic));
    const preferred = QUESTION_BANK.filter((q) => weakSet.has(q.topic) || q.topic === 'behavioral');
    const pool = preferred.length >= count ? preferred : QUESTION_BANK.slice();
    const byDiff = [[], [], []];
    pool.forEach((q) => byDiff[DIFF_ORDER[q.difficulty]].push(q));

    const picked = [];
    const used = new Set();
    const pattern = count <= 3 ? [0, 1, 2] : count <= 5 ? [0, 0, 1, 1, 2] : [0, 0, 1, 1, 1, 2, 2];

    for (let i = 0; i < count; i++) {
      const want = pattern[i] ?? Math.min(2, Math.floor((i / count) * 3));
      let q = byDiff[want].find((x) => !used.has(x.id));
      if (!q) {
        for (let d = 0; d < 3 && !q; d++) q = byDiff[d].find((x) => !used.has(x.id));
      }
      if (!q) q = QUESTION_BANK.find((x) => !used.has(x.id));
      if (q) {
        used.add(q.id);
        picked.push(q);
      }
    }
    return picked;
  }

  function saveSession() {
    if (!state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist mock session', e);
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function stopTick() {
    if (tickId) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function startTick() {
    stopTick();
    tickId = setInterval(() => {
      if (!state || state.paused || state.phase !== 'session') return;
      state.remainingSec -= 1;
      if (state.remainingSec <= 0) {
        state.remainingSec = 0;
        els.timer.textContent = '00:00';
        saveSession();
        finishSession();
        return;
      }
      els.timer.textContent = formatTime(state.remainingSec);
      if (state.remainingSec % 5 === 0) saveSession();
    }, 1000);
  }

  function renderRubric(scores) {
    els.rubricGrid.innerHTML = '';
    RUBRIC_DIMS.forEach((dim) => {
      const row = document.createElement('div');
      row.className = 'ame-rubric-row';
      row.innerHTML = `<span>${dim.label}</span>`;
      const stars = document.createElement('div');
      stars.className = 'ame-stars';
      stars.setAttribute('role', 'radiogroup');
      stars.setAttribute('aria-label', dim.label);
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', String((scores[dim.key] || 0) >= i));
        btn.textContent = String(i);
        btn.setAttribute('aria-label', `${dim.label} ${i}`);
        if ((scores[dim.key] || 0) >= i) btn.classList.add('active');
        btn.addEventListener('click', () => {
          scores[dim.key] = i;
          stars.querySelectorAll('button').forEach((b, idx) => {
            const on = idx < i;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', String(on));
          });
          saveAnswerDraft();
        });
        stars.appendChild(btn);
      }
      row.appendChild(stars);
      els.rubricGrid.appendChild(row);
    });
  }

  function currentScores() {
    if (!state) return {};
    const a = state.answers[state.index] || {};
    return a.scores || { correctness: 0, complexity: 0, communication: 0, edgeCases: 0 };
  }

  function saveAnswerDraft() {
    if (!state || state.phase !== 'session') return;
    const scores = currentScores();
    state.answers[state.index] = {
      questionId: state.queue[state.index].id,
      text: els.answer.value,
      scores: { ...scores },
    };
    saveSession();
  }

  function showQuestion() {
    const q = state.queue[state.index];
    els.qIndex.textContent = String(state.index + 1);
    els.topic.textContent = q.topic;
    els.difficulty.textContent = q.difficulty;
    els.difficulty.dataset.diff = q.difficulty;
    els.type.textContent = q.type;
    els.prompt.textContent = q.prompt;
    els.hint.textContent = q.hint;
    const prev = state.answers[state.index];
    els.answer.value = (prev && prev.text) || '';
    const scores = (prev && prev.scores) || {
      correctness: 0,
      complexity: 0,
      communication: 0,
      edgeCases: 0,
    };
    if (!state.answers[state.index]) {
      state.answers[state.index] = { questionId: q.id, text: '', scores };
    }
    renderRubric(state.answers[state.index].scores);
    els.next.textContent =
      state.index >= state.queue.length - 1
        ? 'Finish'
        : 'Next';
    els.next.innerHTML =
      state.index >= state.queue.length - 1
        ? '<i class="fas fa-flag-checkered" aria-hidden="true"></i> Finish'
        : '<i class="fas fa-arrow-right" aria-hidden="true"></i> Next';
  }

  function avgScores(answers) {
    const totals = { correctness: 0, complexity: 0, communication: 0, edgeCases: 0 };
    let n = 0;
    answers.forEach((a) => {
      if (!a || !a.scores) return;
      n += 1;
      Object.keys(totals).forEach((k) => {
        totals[k] += a.scores[k] || 0;
      });
    });
    if (!n) return totals;
    Object.keys(totals).forEach((k) => {
      totals[k] = Math.round((totals[k] / n) * 10) / 10;
    });
    return totals;
  }

  function finishSession() {
    stopTick();
    saveAnswerDraft();
    state.phase = 'scorecard';
    state.finishedAt = state.finishedAt || new Date().toISOString();
    saveSession();
    els.setup.classList.add('hidden');
    els.session.classList.add('hidden');
    els.scorecard.classList.remove('hidden');

    const avgs = avgScores(state.answers);
    const overall =
      Math.round(
        ((avgs.correctness + avgs.complexity + avgs.communication + avgs.edgeCases) / 4) * 10
      ) / 10;

    els.scoreSummary.innerHTML = `
      <div class="ame-stat"><strong>${overall}</strong>Overall / 5</div>
      <div class="ame-stat"><strong>${avgs.correctness}</strong>Correctness</div>
      <div class="ame-stat"><strong>${avgs.complexity}</strong>Complexity</div>
      <div class="ame-stat"><strong>${avgs.communication}</strong>STAR / Comm</div>
      <div class="ame-stat"><strong>${avgs.edgeCases}</strong>Edge cases</div>
      <div class="ame-stat"><strong>${state.panic ? 'ON' : 'OFF'}</strong>Panic mode</div>
    `;

    els.scoreDetails.innerHTML = state.queue
      .map((q, i) => {
        const a = state.answers[i] || { text: '', scores: {} };
        const s = a.scores || {};
        return `<article class="ame-detail">
          <h3>Q${i + 1}. [${q.difficulty}] ${q.topic} — ${q.type}</h3>
          <p>${q.prompt}</p>
          <p><strong>Answer:</strong> ${escapeHtml(a.text || '(empty)')}</p>
          <p>C ${s.correctness || 0} · X ${s.complexity || 0} · Comm ${s.communication || 0} · Edge ${s.edgeCases || 0}</p>
        </article>`;
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function toMarkdown() {
    const avgs = avgScores(state.answers);
    const overall =
      Math.round(
        ((avgs.correctness + avgs.complexity + avgs.communication + avgs.edgeCases) / 4) * 10
      ) / 10;
    let md = `# Adaptive Mock Scorecard\n\n`;
    md += `- Date: ${state.finishedAt || new Date().toISOString()}\n`;
    md += `- Panic mode: ${state.panic ? 'yes' : 'no'}\n`;
    md += `- Overall: **${overall}/5**\n`;
    md += `- Correctness: ${avgs.correctness} | Complexity: ${avgs.complexity} | Communication: ${avgs.communication} | Edge cases: ${avgs.edgeCases}\n\n`;
    state.queue.forEach((q, i) => {
      const a = state.answers[i] || { text: '', scores: {} };
      const s = a.scores || {};
      md += `## Q${i + 1}. ${q.topic} (${q.difficulty})\n\n`;
      md += `${q.prompt}\n\n`;
      md += `**Answer**\n\n${a.text || '_empty_'}\n\n`;
      md += `| Correctness | Complexity | Communication | Edge cases |\n|---|---|---|---|\n| ${s.correctness || 0} | ${s.complexity || 0} | ${s.communication || 0} | ${s.edgeCases || 0} |\n\n`;
    });
    return md;
  }

  function downloadMarkdown() {
    const blob = new Blob([toMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aiv-adaptive-mock-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startNew() {
    const progress = loadProgress();
    const weak = detectWeakTopics(progress);
    const count = Number(els.count.value) || 5;
    const minutes = Number(els.duration.value) || 30;
    const panic = els.panic.checked;
    const remainingSec = panic ? Math.max(5, Math.floor(minutes * 60 * 0.6)) : minutes * 60;

    state = {
      phase: 'session',
      panic,
      remainingSec,
      paused: false,
      index: 0,
      weakTopics: weak.map((w) => w.topic),
      queue: buildQueue(weak, count),
      answers: [],
      startedAt: new Date().toISOString(),
    };

    els.setup.classList.add('hidden');
    els.scorecard.classList.add('hidden');
    els.session.classList.remove('hidden');
    els.panicFlag.classList.toggle('hidden', !panic);
    els.timer.textContent = formatTime(state.remainingSec);
    els.pause.setAttribute('aria-pressed', 'false');
    els.pause.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> Pause';
    showQuestion();
    saveSession();
    startTick();
  }

  function resumeSession() {
    if (!state || state.phase !== 'session') return;
    els.setup.classList.add('hidden');
    els.scorecard.classList.add('hidden');
    els.session.classList.remove('hidden');
    els.panicFlag.classList.toggle('hidden', !state.panic);
    els.timer.textContent = formatTime(state.remainingSec);
    showQuestion();
    if (!state.paused) startTick();
    else {
      els.pause.setAttribute('aria-pressed', 'true');
      els.pause.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Resume';
    }
  }

  function initWeakPanel() {
    els.progressLoading.classList.add('hidden');
    const progress = loadProgress();
    const weak = detectWeakTopics(progress);

    const hasQuizData = !!(progress && progress.quizScores && Object.keys(progress.quizScores).length);
    if (!hasQuizData) {
      els.weakEmpty.classList.remove('hidden');
      els.weakList.classList.add('hidden');
      return;
    }

    if (weak.length === 0) {
      els.weakEmpty.classList.remove('hidden');
      els.weakEmpty.querySelector('p').textContent =
        'No weak topics detected (accuracy ≥ 70% or missing). Session will use a balanced escalation bank.';
      els.weakList.classList.add('hidden');
      return;
    }

    els.weakEmpty.classList.add('hidden');
    els.weakList.classList.remove('hidden');
    els.weakList.innerHTML = weak
      .map((w) => `<span class="ame-weak-chip">${w.topic} · ${w.accuracy}%</span>`)
      .join('');
  }

  function cacheEls() {
    els.setup = $('ame-setup');
    els.session = $('ame-session');
    els.scorecard = $('ame-scorecard');
    els.progressLoading = $('ame-progress-loading');
    els.weakEmpty = $('ame-weak-empty');
    els.weakList = $('ame-weak-list');
    els.duration = $('ame-duration');
    els.count = $('ame-count');
    els.panic = $('ame-panic');
    els.start = $('ame-start');
    els.resume = $('ame-resume');
    els.qIndex = $('ame-q-index');
    els.timer = $('ame-timer');
    els.pause = $('ame-pause');
    els.panicFlag = $('ame-panic-flag');
    els.topic = $('ame-topic');
    els.difficulty = $('ame-difficulty');
    els.type = $('ame-type');
    els.prompt = $('ame-prompt');
    els.hint = $('ame-hint');
    els.answer = $('ame-answer');
    els.rubricGrid = $('ame-rubric-grid');
    els.next = $('ame-next');
    els.end = $('ame-end');
    els.scoreSummary = $('ame-score-summary');
    els.scoreDetails = $('ame-score-details');
    els.exportMd = $('ame-export-md');
    els.exportPdf = $('ame-export-pdf');
    els.restart = $('ame-restart');
  }

  function bind() {
    els.start.addEventListener('click', startNew);
    els.resume.addEventListener('click', resumeSession);
    els.pause.addEventListener('click', () => {
      if (!state) return;
      state.paused = !state.paused;
      els.pause.setAttribute('aria-pressed', String(state.paused));
      els.pause.innerHTML = state.paused
        ? '<i class="fas fa-play" aria-hidden="true"></i> Resume'
        : '<i class="fas fa-pause" aria-hidden="true"></i> Pause';
      if (state.paused) stopTick();
      else startTick();
      saveSession();
    });
    els.answer.addEventListener('input', saveAnswerDraft);
    els.next.addEventListener('click', () => {
      saveAnswerDraft();
      if (state.index >= state.queue.length - 1) {
        finishSession();
        return;
      }
      state.index += 1;
      showQuestion();
      saveSession();
    });
    els.end.addEventListener('click', finishSession);
    els.exportMd.addEventListener('click', downloadMarkdown);
    els.exportPdf.addEventListener('click', () => window.print());
    els.restart.addEventListener('click', () => {
      clearSession();
      stopTick();
      state = null;
      els.scorecard.classList.add('hidden');
      els.session.classList.add('hidden');
      els.setup.classList.remove('hidden');
      els.resume.classList.add('hidden');
      initWeakPanel();
    });

    const scrollBtn = $('scrollTopBtn');
    if (scrollBtn) {
      window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
      });
      scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cacheEls();
    bind();
    initWeakPanel();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        if (state && state.phase === 'session') {
          els.resume.classList.remove('hidden');
        } else if (state && state.phase === 'scorecard') {
          finishSession();
        }
      }
    } catch {
      state = null;
    }
  });
})();
