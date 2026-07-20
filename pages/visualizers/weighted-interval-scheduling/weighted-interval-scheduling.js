document.addEventListener('DOMContentLoaded', function () {
  wisInit();
});


var wisJobs        = [];   // raw input { start, end, profit }
var wisSorted      = [];   // sorted by end time, each has .origIdx
var wisPred        = [];   // p(j) for each sorted job (1-indexed, 0 = none)
var wisOpt         = [];   // DP table [0..n]
var wisDpDecisions = [];   // 'include' | 'exclude' per index j (1-indexed)
var wisSteps       = [];   // animation steps
var wisStepIdx     = 0;
var wisAutoTimer   = null;
var wisAutoPlaying = false;
var wisSpeed       = 800;
var wisJobColors   = ['#10b981','#06b6d4','#7c3aed','#f59e0b','#ef4444','#a855f7','#ec4899','#f97316','#22d3ee','#84cc16'];
var wisLogCount    = 0;
var wisSolved      = false;

var WIS_PRESET = [
  { start: 1, end: 4,  profit: 3  },
  { start: 3, end: 5,  profit: 1  },
  { start: 0, end: 6,  profit: 8  },
  { start: 4, end: 7,  profit: 2  },
  { start: 3, end: 8,  profit: 5  },
  { start: 5, end: 9,  profit: 4  },
  { start: 6, end: 10, profit: 6  },
  { start: 8, end: 11, profit: 7  }
];


function wisColor(idx) {
  return wisJobColors[idx % wisJobColors.length];
}



function wisSortJobs() {
  wisSorted = wisJobs.map(function (j, i) {
    return { start: j.start, end: j.end, profit: j.profit, origIdx: i };
  });
  wisSorted.sort(function (a, b) { return a.end !== b.end ? a.end - b.end : a.start - b.start; });
}

function wisComputePred(j) {
  var start = wisSorted[j - 1].start;
  var lo = 1, hi = j - 1, result = 0;
  while (lo <= hi) {
    var mid = Math.floor((lo + hi) / 2);
    if (wisSorted[mid - 1].end <= start) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}



function wisBuildSteps() {
  wisSteps = [];
  wisDpDecisions = [];
  var n = wisSorted.length;

  wisSteps.push({
    phase: 'sort',
    msg:   'Sorted ' + n + ' jobs by end time. Now computing p(j) for each job via binary search.',
    logType: 'sort',
    dpState: null,
    activeJob: -1,
    bsState: null,
    predState: wisPred.slice()
  });

  for (var j = 1; j <= n; j++) {
    var bsSteps = wisTraceBinarySearch(j);

    bsSteps.forEach(function (bs) {
      wisSteps.push({
        phase:    'bsearch',
        msg:      'p(' + j + '): Binary search in end-times for start=' + wisSorted[j-1].start + '. lo=' + bs.lo + ' hi=' + bs.hi + ' mid=' + bs.mid + (bs.found !== undefined ? ' → p=' + bs.found : ''),
        logType:  'bs',
        dpState:  null,
        activeJob: j,
        bsState:  { lo: bs.lo, hi: bs.hi, mid: bs.mid, found: bs.found, n: j - 1 },
        predState: null
      });
    });

    wisSteps.push({
      phase:    'bsearch_done',
      msg:      'p(' + j + ') = ' + wisPred[j] + '. Job ' + j + ' [' + wisSorted[j-1].start + ',' + wisSorted[j-1].end + '] compatible with last ' + wisPred[j] + ' job(s).',
      logType:  'bs',
      dpState:  null,
      activeJob: j,
      bsState:  { result: wisPred[j], n: j - 1 },
      predState: null
    });
  }

  wisOpt = new Array(n + 1).fill(0);

  wisSteps.push({
    phase: 'dp_init',
    msg:   'DP initialised. OPT(0) = 0 (base case — no jobs). Filling OPT(1) … OPT(' + n + ').',
    logType: 'dp',
    dpState: wisOpt.slice(),
    activeJob: 0,
    bsState: null,
    decisions: wisDpDecisions.slice()
  });

  for (var jj = 1; jj <= n; jj++) {
    var job      = wisSorted[jj - 1];
    var excl     = wisOpt[jj - 1];
    var inclProf = job.profit + wisOpt[wisPred[jj]];
    var choose   = inclProf > excl ? 'include' : 'exclude';
    wisOpt[jj]   = Math.max(excl, inclProf);
    wisDpDecisions[jj] = choose;

    wisSteps.push({
      phase:    'dp_cell',
      msg:      'OPT(' + jj + '): exclude=' + excl + ' (OPT(' + (jj-1) + ')), include=' + inclProf + ' (profit ' + job.profit + ' + OPT(' + wisPred[jj] + ')=' + wisOpt[wisPred[jj]] + '). → ' + choose.toUpperCase() + ' → OPT(' + jj + ')=' + wisOpt[jj],
      logType:  choose === 'include' ? 'inc' : 'exc',
      dpState:  wisOpt.slice(),
      activeJob: jj,
      bsState:  null,
      decision: choose,
      decisions: wisDpDecisions.slice(),
      excl:     excl,
      incl:     inclProf
    });
  }

  var selected  = wisTraceback(n);
  var selSet    = {};
  selected.forEach(function (s) { selSet[s] = true; });

  wisSteps.push({
    phase:    'traceback',
    msg:      'Traceback complete. Optimal profit = ' + wisOpt[n] + '. Selected jobs: ' + selected.map(function (s) { return 'J' + s; }).join(', '),
    logType:  'trace',
    dpState:  wisOpt.slice(),
    activeJob: -1,
    bsState:  null,
    selected: selected,
    selSet:   selSet,
    optProfit: wisOpt[n],
    decisions: wisDpDecisions.slice()
  });
}

function wisTraceBinarySearch(j) {
  var start = wisSorted[j - 1].start;
  var lo = 1, hi = j - 1;
  var trace = [];

  if (hi < 1) {
    trace.push({ lo: 1, hi: 0, mid: '-', found: 0 });
    return trace;
  }

  var result = 0;
  while (lo <= hi) {
    var mid = Math.floor((lo + hi) / 2);
    trace.push({ lo: lo, hi: hi, mid: mid });
    if (wisSorted[mid - 1].end <= start) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (trace.length > 0) trace[trace.length - 1].found = result;
  return trace;
}

function wisTraceback(n) {
  var j = n;
  var selected = [];
  while (j >= 1) {
    var job     = wisSorted[j - 1];
    var inclVal = job.profit + wisOpt[wisPred[j]];
    if (inclVal > wisOpt[j - 1]) {
      selected.push(j);
      j = wisPred[j];
    } else {
      j--;
    }
  }
  return selected.reverse();
}



function wisDrawTimeline(selectedSet, activeJob) {
  var canvas = document.getElementById('wisTimelineCanvas');
  if (!canvas) return;

  var parent = canvas.parentElement;
  var W = parent ? parent.clientWidth - 4 : 500;
  canvas.width  = Math.max(W, 320);
  canvas.height = 220;

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!wisSorted.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Poppins,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add jobs to see the timeline.', canvas.width / 2, canvas.height / 2);
    return;
  }

  var maxEnd   = Math.max.apply(null, wisSorted.map(function (j) { return j.end; }));
  var minStart = Math.min.apply(null, wisSorted.map(function (j) { return j.start; }));
  var padX = 40;
  var usableW = canvas.width - padX * 2;
  var range = maxEnd - minStart || 1;

  function toX(v) { return padX + ((v - minStart) / range) * usableW; }

  var maxProfit = Math.max.apply(null, wisSorted.map(function (j) { return j.profit; }));
  var barMaxH = 60;
  var axisY   = 170;
  var barBase = axisY;
  var n       = wisSorted.length;
  var rowH    = Math.max(10, Math.floor((axisY - 20) / n));

  /* Axis */
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(padX, axisY);
  ctx.lineTo(canvas.width - padX, axisY);
  ctx.stroke();

  /* Tick marks */
  for (var t = minStart; t <= maxEnd; t++) {
    var tx = toX(t);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(tx, axisY, 1, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t, tx, axisY + 15);
  }

  /* Job bars — stacked by sort order */
  wisSorted.forEach(function (job, i) {
    var x1 = toX(job.start);
    var x2 = toX(job.end);
    var bw = Math.max(x2 - x1, 2);
    var y  = 20 + i * rowH;
    var h  = Math.max(6, Math.min(rowH - 2, Math.round((job.profit / maxProfit) * barMaxH)));

    var col = wisColor(job.origIdx);
    var isActive   = activeJob === (i + 1);
    var isSelected = selectedSet && selectedSet[i + 1];

    ctx.globalAlpha = isSelected ? 1 : (selectedSet ? 0.35 : 0.75);
    ctx.fillStyle   = isSelected ? col : (isActive ? col : col);

    if (isActive) {
      ctx.shadowColor = col;
      ctx.shadowBlur  = 10;
    }

    var rad = 3;
    ctx.beginPath();
    ctx.moveTo(x1 + rad, y);
    ctx.lineTo(x2 - rad, y);
    ctx.quadraticCurveTo(x2, y, x2, y + rad);
    ctx.lineTo(x2, y + h - rad);
    ctx.quadraticCurveTo(x2, y + h, x2 - rad, y + h);
    ctx.lineTo(x1 + rad, y + h);
    ctx.quadraticCurveTo(x1, y + h, x1, y + h - rad);
    ctx.lineTo(x1, y + rad);
    ctx.quadraticCurveTo(x1, y, x1 + rad, y);
    ctx.closePath();
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    /* Label */
    ctx.fillStyle = '#fff';
    ctx.font = '9px Fira Code,monospace';
    ctx.textAlign = 'left';
    var lbl = 'J' + (i + 1) + ' $' + job.profit;
    if (x2 - x1 > 20) ctx.fillText(lbl, x1 + 4, y + h - 2);
  });
}

/* ════════════════════════════════════════════
   DP TABLE RENDER
════════════════════════════════════════════ */

function wisRenderDpTable(dpState, activeJob, decisions, selSet) {
  var card = document.getElementById('wisDpCard');
  var wrap = document.getElementById('wisDpWrap');
  if (!card || !wrap || !dpState) return;

  card.style.display = 'block';
  var n = wisSorted.length;

  var html = '<table class="wis-dp-table"><thead><tr><th class="wis-dp-th"></th>';
  for (var j = 0; j <= n; j++) html += '<th class="wis-dp-th">OPT(' + j + ')</th>';
  html += '</tr></thead><tbody><tr><td class="wis-dp-label">Value</td>';

  for (var jj = 0; jj <= n; jj++) {
    var cls = 'wis-dp-cell';
    if (jj === activeJob) {
      cls += ' dp-current';
    } else if (selSet && jj > 0 && selSet[jj]) {
      cls += ' dp-optimal';
    } else if (decisions && jj > 0 && decisions[jj] !== undefined) {
      cls += decisions[jj] === 'include' ? ' dp-included' : ' dp-excluded';
    }
    var val = dpState[jj] !== undefined ? dpState[jj] : '?';
    html += '<td class="' + cls + '">' + val + '</td>';
  }

  html += '</tr>';

  /* p(j) row */
  html += '<tr><td class="wis-dp-label">p(j)</td>';
  for (var jp = 0; jp <= n; jp++) {
    var pv = jp === 0 ? '—' : (wisPred[jp] !== undefined ? wisPred[jp] : '?');
    html += '<td class="wis-dp-cell" style="font-size:.62rem;color:#7c3aed">' + pv + '</td>';
  }
  html += '</tr></tbody></table>';

  wrap.innerHTML = html;
}

/* ════════════════════════════════════════════
   JOB LIST RENDER
════════════════════════════════════════════ */

function wisRenderJobList(activeJob, selSet) {
  var el = document.getElementById('wisJobList');
  if (!el) return;

  if (!wisSorted.length) {
    el.innerHTML = '<span class="wis-empty-text">No jobs added yet.</span>';
    return;
  }

  el.innerHTML = wisSorted.map(function (job, i) {
    var idx = i + 1;
    var isActive   = activeJob === idx;
    var isSelected = selSet && selSet[idx];
    var cls = 'wis-job-row' + (isSelected ? ' job-selected' : '') + (isActive && !isSelected ? ' job-active' : '') + (!isSelected && selSet ? ' job-excluded' : '');
    var predTxt = wisPred[idx] !== undefined ? 'p=' + wisPred[idx] : '';

    return (
      '<div class="' + cls + '">' +
        '<span class="wis-job-idx">J' + idx + '</span>' +
        '<span class="wis-job-color" style="background:' + wisColor(job.origIdx) + '"></span>' +
        '<span class="wis-job-range">[' + job.start + ',' + job.end + ']</span>' +
        '<span class="wis-job-profit">$' + job.profit + '</span>' +
        '<span class="wis-job-pred">' + predTxt + '</span>' +
      '</div>'
    );
  }).join('');
}

/* ════════════════════════════════════════════
   BINARY SEARCH PANEL RENDER
════════════════════════════════════════════ */

function wisRenderBSearch(bsState, jobIdx) {
  var card = document.getElementById('wisBSearchCard');
  var area = document.getElementById('wisBSearchArea');
  if (!card || !area) return;

  if (!bsState) { card.style.display = 'none'; return; }
  card.style.display = 'block';

  var n = bsState.n || 0;
  var endTimes = wisSorted.slice(0, n).map(function (j) { return j.end; });
  var arrHtml  = '<div class="wis-bs-array">';

  endTimes.forEach(function (et, i) {
    var pos = i + 1;
    var cls = 'wis-bs-cell';
    if (bsState.found !== undefined && pos === bsState.found) cls += ' bs-found';
    else if (bsState.mid !== undefined && pos === bsState.mid) cls += ' bs-mid';
    else if (bsState.lo !== undefined && bsState.hi !== undefined) {
      if (pos < bsState.lo || pos > bsState.hi) cls += ' bs-out';
      else if (pos === bsState.lo) cls += ' bs-lo';
      else if (pos === bsState.hi) cls += ' bs-hi';
    }
    arrHtml += '<div class="' + cls + '">' + et + '</div>';
  });
  arrHtml += '</div>';

  var descParts = [];
  if (jobIdx && wisSorted[jobIdx - 1]) {
    descParts.push('Searching for start=' + wisSorted[jobIdx - 1].start);
  }
  if (bsState.lo !== undefined) descParts.push('lo=' + bsState.lo + ' hi=' + bsState.hi);
  if (bsState.mid !== undefined && bsState.mid !== '-') descParts.push('mid=' + bsState.mid + ' (end=' + (endTimes[bsState.mid - 1] !== undefined ? endTimes[bsState.mid - 1] : '—') + ')');
  if (bsState.found !== undefined) descParts.push('→ p(' + jobIdx + ') = ' + bsState.found);
  if (bsState.result !== undefined) descParts.push('Final: p(' + jobIdx + ') = ' + bsState.result);

  area.innerHTML = arrHtml + '<div class="wis-bs-desc">' + descParts.join(' · ') + '</div>';
}

/* ════════════════════════════════════════════
   RESULT PANEL
════════════════════════════════════════════ */

function wisRenderResult(step) {
  var card = document.getElementById('wisResultCard');
  var body = document.getElementById('wisResultBody');
  if (!card || !body || !step.selected) return;

  card.style.display = 'block';
  var jobTags = step.selected.map(function (idx) {
    var job = wisSorted[idx - 1];
    return '<span class="wis-result-job-tag" style="border-color:' + wisColor(job.origIdx) + ';color:' + wisColor(job.origIdx) + '">J' + idx + ' [' + job.start + ',' + job.end + '] $' + job.profit + '</span>';
  }).join('');

  body.innerHTML =
    '<div class="wis-result-profit">$' + step.optProfit + '</div>' +
    '<div class="wis-result-jobs">' + jobTags + '</div>' +
    '<div class="wis-result-note">' + step.selected.length + ' job(s) selected. Total profit = $' + step.optProfit + '.</div>';
}

/* ════════════════════════════════════════════
   GREEDY COMPARISON
════════════════════════════════════════════ */

function wisGreedyByProfit() {
  var jobs = wisSorted.slice();
  jobs.sort(function (a, b) { return b.profit - a.profit; });
  var selected = [];
  var profit   = 0;

  jobs.forEach(function (cand) {
    var ok = selected.every(function (s) { return s.end <= cand.start || cand.end <= s.start; });
    if (ok) { selected.push(cand); profit += cand.profit; }
  });
  return { profit: profit, jobs: selected };
}

function wisGreedyByEnd() {
  var jobs = wisSorted.slice();
  var selected = [];
  var profit   = 0;

  jobs.forEach(function (cand) {
    var ok = selected.every(function (s) { return s.end <= cand.start || cand.end <= s.start; });
    if (ok) { selected.push(cand); profit += cand.profit; }
  });
  return { profit: profit, jobs: selected };
}

function wisRenderCompare(optProfit, selSet) {
  var card = document.getElementById('wisCompareCard');
  var grid = document.getElementById('wisCompareGrid');
  if (!card || !grid) return;

  card.style.display = 'block';

  var gProfit = wisGreedyByProfit();
  var gEnd    = wisGreedyByEnd();

  function renderCol(title, cls, result) {
    var tags = result.jobs.map(function (j, i) {
      var idx = wisSorted.indexOf(j) + 1;
      return '<div class="wis-cmp-job">J' + idx + ' [' + j.start + ',' + j.end + '] $' + j.profit + '</div>';
    }).join('');
    var gap = result.profit < optProfit ? '<div class="wis-compare-gap">Gap: −$' + (optProfit - result.profit) + '</div>' : '<div style="font-size:.68rem;color:#10b981;text-align:center">Optimal ✓</div>';

    return (
      '<div class="wis-compare-col">' +
        '<div class="wis-compare-col-title ' + cls + '">' + title + '</div>' +
        '<div class="wis-compare-profit" style="color:' + (result.profit < optProfit ? '#ef4444' : '#10b981') + '">$' + result.profit + '</div>' +
        '<div class="wis-compare-jobs">' + tags + '</div>' +
        gap +
      '</div>'
    );
  }

  grid.innerHTML =
    renderCol('DP (Optimal)', 'wis-col-dp', { profit: optProfit, jobs: wisSorted.filter(function (_, i) { return selSet && selSet[i + 1]; }) }) +
    renderCol('Greedy: Max Profit', 'wis-col-profit', gProfit) +
    renderCol('Greedy: Earliest End', 'wis-col-end', gEnd);
}

/* ════════════════════════════════════════════
   STEP PLAYBACK
════════════════════════════════════════════ */

function wisApplyStep() {
  if (!wisSteps.length) return;

  var step = wisSteps[wisStepIdx];

  wisSetStatus(step.msg, step.logType === 'inc' ? 'ok' : (step.logType === 'exc' ? 'warn' : (step.logType === 'trace' ? 'purple' : 'info')));
  wisAddLog(step.msg, step.logType || 'info');
  wisUpdateStepUI();

  var selSet = step.selSet || null;
  var actJ   = step.activeJob !== undefined ? step.activeJob : -1;

  wisDrawTimeline(step.phase === 'traceback' ? selSet : null, step.phase !== 'traceback' ? actJ : -1);
  wisRenderJobList(actJ, step.phase === 'traceback' ? selSet : null);
  wisRenderBSearch(step.bsState, actJ);

  if (step.dpState) {
    wisRenderDpTable(step.dpState, actJ, step.decisions, step.phase === 'traceback' ? selSet : null);
  }

  if (step.phase === 'traceback') {
    wisRenderResult(step);
  }
}

function wisStepForward() {
  if (wisStepIdx < wisSteps.length - 1) {
    wisStepIdx++;
    wisApplyStep();
  } else {
    wisStopAuto();
  }
}

function wisStartAuto() {
  if (wisAutoPlaying) return;
  wisAutoPlaying = true;
  var btn = document.getElementById('wisAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';

  wisAutoTimer = setInterval(function () {
    if (wisStepIdx >= wisSteps.length - 1) { wisStopAuto(); return; }
    wisStepForward();
  }, wisSpeed);
}

function wisStopAuto() {
  wisAutoPlaying = false;
  clearInterval(wisAutoTimer);
  var btn = document.getElementById('wisAutoBtn');
  if (btn) btn.innerHTML = '<i class="fas fa-forward"></i> Auto-Play';
}

function wisToggleAuto() {
  if (wisAutoPlaying) wisStopAuto();
  else wisStartAuto();
}

function wisUpdateStepUI() {
  var counter = document.getElementById('wisStepCounter');
  var fill    = document.getElementById('wisStepFill');
  var total   = wisSteps.length;
  var cur     = total ? wisStepIdx + 1 : 0;
  if (counter) counter.textContent = 'Step ' + cur + ' / ' + total;
  if (fill) fill.style.width = (total > 1 ? (wisStepIdx / (total - 1)) * 100 : 0) + '%';
}

/* ════════════════════════════════════════════
   STATUS + LOG
════════════════════════════════════════════ */

function wisSetStatus(msg, cls) {
  var el = document.getElementById('wisStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'wis-status ' + (cls || '');
}

function wisAddLog(msg, type) {
  var log = document.getElementById('wisLog');
  if (!log) return;
  var empty = log.querySelector('.wis-empty-text');
  if (empty) empty.remove();

  var entry = document.createElement('div');
  entry.className = 'wis-log-entry log-' + (type || 'info');
  entry.textContent = '[' + (++wisLogCount) + '] ' + msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 80) log.removeChild(log.lastChild);
}

/* ════════════════════════════════════════════
   ADD JOB
════════════════════════════════════════════ */

function wisAddJob() {
  var sEl = document.getElementById('wisInputStart');
  var eEl = document.getElementById('wisInputEnd');
  var pEl = document.getElementById('wisInputProfit');

  var s = parseInt(sEl ? sEl.value : 0, 10);
  var e = parseInt(eEl ? eEl.value : 0, 10);
  var p = parseInt(pEl ? pEl.value : 0, 10);

  if (isNaN(s) || isNaN(e) || isNaN(p)) { wisSetStatus('Please enter valid numbers for start, end, and profit.', 'fail'); return; }
  if (s >= e) { wisSetStatus('End time must be greater than start time.', 'fail'); return; }
  if (p <= 0) { wisSetStatus('Profit must be positive.', 'fail'); return; }
  if (s < 0 || e > 99 || p > 999) { wisSetStatus('Start/End must be within 0-99 and Profit within 1-999.', 'fail'); return; }
  if (wisJobs.length >= 12) { wisSetStatus('Maximum 12 jobs. Reset to start over.', 'warn'); return; }

  wisJobs.push({ start: s, end: e, profit: p });
  wisRebuild();
  wisSetStatus('Added job [' + s + ',' + e + '] $' + p + '. Total jobs: ' + wisJobs.length + '.', 'ok');
}

function wisRebuild() {
  wisSorted = [];
  wisPred   = [];
  wisOpt    = [];
  wisDpDecisions = [];
  wisSteps  = [];
  wisStepIdx = 0;
  wisSolved  = false;

  wisSortJobs();

  /* Pre-compute all p(j) for display */
  var n = wisSorted.length;
  wisPred = [undefined];
  for (var j = 1; j <= n; j++) wisPred[j] = wisComputePred(j);

  wisRenderJobList(-1, null);
  wisDrawTimeline(null, -1);

  var dpCard = document.getElementById('wisDpCard');
  var bsCard = document.getElementById('wisBSearchCard');
  var resCard = document.getElementById('wisResultCard');
  var cmpCard = document.getElementById('wisCompareCard');
  if (dpCard)  dpCard.style.display  = 'none';
  if (bsCard)  bsCard.style.display  = 'none';
  if (resCard) resCard.style.display = 'none';
  if (cmpCard) cmpCard.style.display = 'none';

  wisSetButtonStates(false);
  wisUpdateStepUI();
}

function wisSetButtonStates(solved) {
  var stepBtn    = document.getElementById('wisStepBtn');
  var autoBtn    = document.getElementById('wisAutoBtn');
  var compareBtn = document.getElementById('wisCompareBtn');

  if (stepBtn)    stepBtn.disabled    = !solved;
  if (autoBtn)    autoBtn.disabled    = !solved;
  if (compareBtn) compareBtn.disabled = !solved;
}

/* ════════════════════════════════════════════
   SOLVE
════════════════════════════════════════════ */

function wisSolve() {
  if (wisJobs.length < 2) { wisSetStatus('Add at least 2 jobs to run the algorithm.', 'warn'); return; }

  wisStopAuto();
  wisRebuild();
  wisBuildSteps();
  wisStepIdx = 0;
  wisSolved  = true;

  wisSetButtonStates(true);
  wisApplyStep();
  wisSetStatus('Ready. Use Step or Auto-Play to walk through the algorithm.', 'info');
}

/* ════════════════════════════════════════════
   RESET
════════════════════════════════════════════ */

function wisReset() {
  wisStopAuto();
  wisJobs    = [];
  wisLogCount = 0;
  wisRebuild();
  wisDrawTimeline(null, -1);

  var log = document.getElementById('wisLog');
  if (log) log.innerHTML = '<span class="wis-empty-text">Steps appear here.</span>';

  wisSetStatus('Reset. Add jobs or load the preset.', 'purple');
  wisUpdateStepUI();
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

function wisInit() {
  wisDrawTimeline(null, -1);
  wisUpdateStepUI();

  var addBtn     = document.getElementById('wisAddJobBtn');
  var presetBtn  = document.getElementById('wisPresetBtn');
  var resetBtn   = document.getElementById('wisResetBtn');
  var solveBtn   = document.getElementById('wisSolveBtn');
  var stepBtn    = document.getElementById('wisStepBtn');
  var autoBtn    = document.getElementById('wisAutoBtn');
  var compareBtn = document.getElementById('wisCompareBtn');
  var speedEl    = document.getElementById('wisSpeed');

  if (addBtn) addBtn.addEventListener('click', wisAddJob);

  if (presetBtn) {
    presetBtn.addEventListener('click', function () {
      wisReset();
      WIS_PRESET.forEach(function (j) { wisJobs.push(j); });
      wisRebuild();
      wisSetStatus('Loaded ' + wisJobs.length + ' preset jobs. Click Solve to run the DP algorithm.', 'ok');
    });
  }

  if (resetBtn)  resetBtn.addEventListener('click', wisReset);
  if (solveBtn)  solveBtn.addEventListener('click', wisSolve);

  if (stepBtn) {
    stepBtn.addEventListener('click', function () {
      wisStopAuto();
      wisStepForward();
    });
  }

  if (autoBtn) autoBtn.addEventListener('click', wisToggleAuto);

  if (compareBtn) {
    compareBtn.addEventListener('click', function () {
      if (!wisSolved || !wisOpt.length) { wisSetStatus('Run Solve first before comparing.', 'warn'); return; }
      var n = wisSorted.length;
      var lastStep = wisSteps[wisSteps.length - 1];
      var selSet = lastStep && lastStep.selSet ? lastStep.selSet : {};
      wisRenderCompare(wisOpt[n], selSet);
      wisSetStatus('Greedy comparison: DP optimal vs greedy-by-profit vs greedy-by-earliest-end.', 'purple');
    });
  }

  if (speedEl) {
    speedEl.addEventListener('input', function () {
      wisSpeed = parseInt(speedEl.value, 10);
      if (wisAutoPlaying) { wisStopAuto(); wisStartAuto(); }
    });
  }

  /* Enter key in inputs */
  ['wisInputStart','wisInputEnd','wisInputProfit'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') wisAddJob(); });
  });

  window.addEventListener('resize', function () { wisDrawTimeline(null, -1); });
}