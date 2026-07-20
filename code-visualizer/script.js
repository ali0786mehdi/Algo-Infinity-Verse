// ====== CODE EXECUTOR ENGINE ======
class CodeExecutor {
  constructor(code, snapshots, output) {
    this.code = code;
    this.snapshots = snapshots || [];
    this.output = output || [];
    this.currentIndex = -1; // -1 represents initial ready state (line 0, no variables yet)
    this.isRunning = false;
    this.isPaused = false;
    this.isFinished = false;
    this.playInterval = null;
  }

  // Step Into: Go to the very next step
  stepInto() {
    if (this.isFinished || this.snapshots.length === 0) {
      this.finishExecution();
      return false;
    }

    if (this.currentIndex >= this.snapshots.length - 1) {
      this.finishExecution();
      return false;
    }

    this.currentIndex++;
    this.updateUI();
    return true;
  }

  // Step Over: Go to the next step at the same stack depth or less
  stepOver() {
    if (this.isFinished || this.snapshots.length === 0) {
      this.finishExecution();
      return false;
    }

    if (this.currentIndex >= this.snapshots.length - 1) {
      this.finishExecution();
      return false;
    }

    if (this.currentIndex === -1) {
      return this.stepInto();
    }

    const currentSnapshot = this.snapshots[this.currentIndex];
    const currentDepth = currentSnapshot.stack.length;

    let nextIndex = this.currentIndex + 1;
    while (nextIndex < this.snapshots.length) {
      const nextSnapshot = this.snapshots[nextIndex];
      if (nextSnapshot.stack.length <= currentDepth) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex >= this.snapshots.length) {
      this.currentIndex = this.snapshots.length - 1;
    } else {
      this.currentIndex = nextIndex;
    }

    this.updateUI();
    return true;
  }

  // Step Back: Go to the previous step in history
  stepBackward() {
    if (this.currentIndex <= 0) {
      this.resetToStart();
      return false;
    }

    this.currentIndex--;
    this.isFinished = false;
    this.updateUI();
    return true;
  }

  finishExecution() {
    this.isFinished = true;
    this.stopPlay();
    updateStatus('Finished');
    const container = document.getElementById('explanationContainer');
    if (container) {
      container.innerHTML = `<div class="explanation-step-text" style="line-height: 1.6; font-size: 0.95rem;">Execution complete! Click Reset to edit or run again.</div>`;
    }
    updateControlsUI();
  }

  resetToStart() {
    this.currentIndex = -1;
    this.isFinished = false;
    this.stopPlay();

    highlightLine(0);
    updateVariablesUI({});
    updateStackUI([]);
    updateConsoleUI([]);
    updateTraceUI([]);
    updateStatus('Ready');

    const container = document.getElementById('explanationContainer');
    if (container) {
      container.innerHTML = `<div class="explanation-step-text" style="line-height: 1.6; font-size: 0.95rem;">Ready to start execution. Click Step Into or Step Over.</div>`;
    }
    updateControlsUI();
  }

  updateUI() {
    if (this.currentIndex < 0 || this.currentIndex >= this.snapshots.length) {
      return;
    }

    const snapshot = this.snapshots[this.currentIndex];

    // Highlight active line
    highlightLine(snapshot.line);

    // Update variables UI (with scope categorization)
    updateVariablesUI(snapshot.vars);

    // Update call stack UI
    updateStackUI(snapshot.stack, snapshot.line);

    // Update Console Logs up to this point
    updateConsoleUI(snapshot.output);

    // Update status text
    updateStatus(`Step ${this.currentIndex + 1} of ${this.snapshots.length}`);

    // Update explanation UI
    this.generateStepExplanation(snapshot);

    // Update trace logs UI
    const traceLogs = this.snapshots.slice(0, this.currentIndex + 1).map((snap, idx) => {
      const stackFrame = snap.stack[snap.stack.length - 1];
      const stackStr = stackFrame ? ` (in ${stackFrame.name})` : ' (in global)';
      return {
        line: snap.line,
        message: `▶️ Step ${idx + 1}: Line ${snap.line}${stackStr} - Variables: ${JSON.stringify(snap.vars)}`,
      };
    });
    updateTraceUI(traceLogs);

    updateControlsUI();
  }

  generateStepExplanation(snapshot) {
    const container = document.getElementById('explanationContainer');
    if (!container) return;

    let explanation = '';
    const stackFrame = snapshot.stack[snapshot.stack.length - 1];
    const funcName = stackFrame ? `${stackFrame.name}()` : 'global scope';

    explanation += `Executing code on line <code>${snapshot.line}</code> inside the <strong style="color: #3b82f6;">${funcName}</strong>.<br>`;

    const varKeys = Object.keys(snapshot.vars);
    if (varKeys.length > 0) {
      explanation += `Variables currently active in scope:<ul>`;
      for (const key of varKeys) {
        const val = snapshot.vars[key];
        const displayVal =
          typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
        explanation += `<li><code>${key}</code> = <strong style="color: #22c55e; font-family: monospace;">${displayVal}</strong></li>`;
      }
      explanation += `</ul>`;
    } else {
      explanation += `No active variables in current scope at this line.`;
    }

    container.innerHTML = `<div class="explanation-step-text" style="line-height: 1.6; font-size: 0.95rem;">${explanation}</div>`;
  }

  stopPlay() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    updateControlsUI();
  }
}

// ====== UI UPDATE FUNCTIONS ======

function updateStatus(status) {
  const el = document.getElementById('statusText');
  if (el)
    el.textContent =
      status.startsWith('⏹️') || status.startsWith('⏳') || status.startsWith('❌')
        ? status
        : `⏹️ ${status}`;
}

function highlightLine(lineNumber) {
  const highlightLineEl = document.getElementById('highlightLine');
  if (!highlightLineEl) return;
  if (lineNumber <= 0) {
    highlightLineEl.style.display = 'none';
    return;
  }
  const lineHeight = 1.6 * 16; // ~25.6px
  const top = (lineNumber - 1) * lineHeight + 12;
  highlightLineEl.style.top = `${top}px`;
  highlightLineEl.style.display = 'block';

  const lineStatusEl = document.getElementById('lineStatus');
  if (lineStatusEl) lineStatusEl.textContent = `Line: ${lineNumber}`;
}

function updateVariablesUI(variables) {
  const container = document.getElementById('variablesContainer');
  if (!container) return;

  const keys = Object.keys(variables);
  if (keys.length === 0) {
    container.innerHTML = '<div class="empty-state">No variables active in scope.</div>';
    return;
  }

  let html = '';
  for (const key of keys) {
    const value = variables[key];
    const displayValue =
      typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
    html += `
            <div class="variable-item" style="display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: 'Courier New', monospace; font-size: 0.9rem;">
                <span class="variable-name" style="font-weight: 600; color: #3b82f6;">${key}</span>
                <span class="variable-value" style="color: #22c55e; word-break: break-all; max-width: 70%; text-align: right;">${displayValue}</span>
            </div>
        `;
  }
  container.innerHTML = html;
}

function updateStackUI(stack, currentLine) {
  const container = document.getElementById('stackContainer');
  if (!container) return;

  if (!stack || stack.length === 0) {
    container.innerHTML = `
            <div class="stack-frame active" style="padding: 0.4rem 0.6rem; border-radius: 6px; background: rgba(59, 130, 246, 0.15); border-left: 3px solid #3b82f6; display: flex; justify-content: space-between; font-family: 'Courier New', monospace; font-size: 0.9rem;">
                <span class="frame-name" style="font-weight: bold; color: #3b82f6;">(global)</span>
                <span class="frame-line" style="color: #888; font-size: 0.8rem;">line ${currentLine || '-'}</span>
            </div>
        `;
    return;
  }

  let html = '';
  // Display stack from top (most recent) to bottom
  for (let i = stack.length - 1; i >= 0; i--) {
    const frame = stack[i];
    const isActive = i === stack.length - 1;
    html += `
            <div class="stack-frame ${isActive ? 'active' : ''}" style="padding: 0.4rem 0.6rem; margin-bottom: 0.4rem; border-radius: 6px; background: ${isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)'}; border-left: 3px solid ${isActive ? '#3b82f6' : '#9ca3af'}; display: flex; justify-content: space-between; font-family: 'Courier New', monospace; font-size: 0.9rem;">
                <span class="frame-name" style="font-weight: bold; color: ${isActive ? '#3b82f6' : '#e4e4e4'};">${frame.name}()</span>
                <span class="frame-line" style="color: #888; font-size: 0.8rem;">line ${isActive ? currentLine : frame.line}</span>
            </div>
        `;
  }

  // Add global frame at the bottom
  html += `
        <div class="stack-frame" style="padding: 0.4rem 0.6rem; border-radius: 6px; background: rgba(255,255,255,0.01); border-left: 3px solid #6b7280; display: flex; justify-content: space-between; font-family: 'Courier New', monospace; font-size: 0.9rem;">
            <span class="frame-name" style="color: #888;">(global)</span>
            <span class="frame-line" style="color: #555; font-size: 0.8rem;">-</span>
        </div>
    `;

  container.innerHTML = html;
}

function updateConsoleUI(output) {
  const container = document.getElementById('outputConsole');
  if (!container) return;

  if (!output || output.length === 0) {
    container.innerHTML = '<div class="empty-state">Console output will appear here...</div>';
    return;
  }

  let html = '';
  for (const line of output) {
    const isError =
      line.startsWith('❌') || line.includes('Error:') || line.includes('Runtime Error:');
    const color = isError ? '#ef4444' : '#e4e4e4';
    html += `<div class="log-line" style="color: ${color}; font-family: 'Courier New', monospace; font-size: 0.9rem;">> ${line}</div>`;
  }
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function updateTraceUI(trace) {
  const container = document.getElementById('traceContainer');
  if (!container) return;

  if (!trace || trace.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Execution steps trace will appear here...</div>';
    return;
  }

  let html = '';
  for (let i = 0; i < trace.length; i++) {
    const item = trace[i];
    const isLast = i === trace.length - 1;
    html += `
            <div class="trace-item ${isLast ? 'active' : ''}" style="color: ${isLast ? '#3b82f6' : '#9ca3af'}; padding: 0.2rem 0; font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: ${isLast ? 'bold' : 'normal'};">
                ${item.message}
            </div>
        `;
  }
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function updateControlsUI() {
  const prevBtn = document.getElementById('prevBtn');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stepIntoBtn = document.getElementById('stepIntoBtn');
  const stepOverBtn = document.getElementById('stepOverBtn');
  const runBtn = document.getElementById('runBtn');

  if (!executor) {
    if (prevBtn) prevBtn.disabled = true;
    if (stepIntoBtn) stepIntoBtn.disabled = true;
    if (stepOverBtn) stepOverBtn.disabled = true;
    if (playBtn) {
      playBtn.disabled = true;
      playBtn.style.display = 'inline-block';
    }
    if (pauseBtn) pauseBtn.style.display = 'none';
    return;
  }

  if (prevBtn) {
    prevBtn.disabled = executor.currentIndex <= -1;
  }

  if (executor.playInterval) {
    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-block';
    if (stepIntoBtn) stepIntoBtn.disabled = true;
    if (stepOverBtn) stepOverBtn.disabled = true;
    if (runBtn) runBtn.disabled = true;
  } else {
    if (playBtn) playBtn.style.display = 'inline-block';
    if (pauseBtn) pauseBtn.style.display = 'none';

    const isAtEnd = executor.isFinished || executor.currentIndex >= executor.snapshots.length - 1;
    if (stepIntoBtn) stepIntoBtn.disabled = isAtEnd;
    if (stepOverBtn) stepOverBtn.disabled = isAtEnd;
    if (playBtn) playBtn.disabled = isAtEnd;
    if (runBtn) runBtn.disabled = false;
  }
}

// ====== SETUP EXECUTOR ======
let executor = null;

async function runCode() {
  const code = document.getElementById('codeEditor').value;
  if (!code.trim()) {
    updateConsoleUI(['❌ Error: Code editor is empty.']);
    return;
  }

  updateStatus('⏳ Tracing...');
  updateConsoleUI(['⏳ Running code and tracing execution step-by-step...']);

  const runBtn = document.getElementById('runBtn');
  if (runBtn) runBtn.disabled = true;

  try {
    let headers = {
      'Content-Type': 'application/json',
    };
    try {
      const csrfRes = await fetch('/api/csrf-token');
      if (csrfRes.ok) {
        const data = await csrfRes.json();
        if (data.csrfToken) {
          headers['X-CSRF-Token'] = data.csrfToken;
        }
      }
    } catch (e) {
      console.warn('Could not fetch CSRF token:', e);
    }

    const response = await fetch('/api/execute/traced', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        sourceCode: code,
        language: 'javascript',
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Traced execution failed.');
    }

    if (!result.snapshots || result.snapshots.length === 0) {
      throw new Error(
        'No snapshots generated. Please make sure the code has executable statements.'
      );
    }

    executor = new CodeExecutor(code, result.snapshots, result.data.output.split('\n'));
    executor.resetToStart();

    updateConsoleUI(['✅ Tracing complete! Use controls to step through the execution.']);
  } catch (error) {
    console.error(error);
    updateStatus('❌ Traced execution failed');
    updateConsoleUI([
      '❌ Traced execution failed.',
      error.message,
      'Please make sure your JavaScript code is syntactically valid and contains no infinite loops.',
    ]);
    executor = null;
    updateControlsUI();
  } finally {
    if (runBtn) runBtn.disabled = false;
  }
}

// ====== BUTTON EVENT LISTENERS ======

document.getElementById('runBtn').addEventListener('click', runCode);

document.getElementById('prevBtn').addEventListener('click', () => {
  if (executor) executor.stepBackward();
});

document.getElementById('stepIntoBtn').addEventListener('click', () => {
  if (executor) executor.stepInto();
});

document.getElementById('stepOverBtn').addEventListener('click', () => {
  if (executor) executor.stepOver();
});

document.getElementById('playBtn').addEventListener('click', () => {
  if (!executor) return;
  if (executor.playInterval) return;

  executor.playInterval = setInterval(() => {
    if (executor.currentIndex >= executor.snapshots.length - 1) {
      executor.finishExecution();
      return;
    }
    executor.stepInto();
  }, 1000);

  updateControlsUI();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  if (executor) executor.stopPlay();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (executor) {
    executor.stopPlay();
    executor.resetToStart();
  }
});

// ====== INITIAL SETUP ======
/* global defaultCode, updateLineNumbers */
document.addEventListener('DOMContentLoaded', () => {
  const editor = document.getElementById('codeEditor');
  if (editor) {
    editor.value = defaultCode;
    updateLineNumbers();
  }

  executor = null;
  updateVariablesUI({});
  updateTraceUI([]);
  updateConsoleUI([]);
  updateStackUI([]);
  updateStatus('Ready');
});

// Re-initialize when code changes
document.getElementById('codeEditor').addEventListener('input', () => {
  if (executor) {
    executor.stopPlay();
    executor = null;
  }
  updateVariablesUI({});
  updateTraceUI([]);
  updateConsoleUI([]);
  updateStackUI([]);
  updateStatus('Ready');
  highlightLine(0);
  updateControlsUI();
});

window.addEventListener('resize', () => {
  if (typeof window.updateLineNumbers === 'function') window.updateLineNumbers();
});

/**
 * Generates and downloads a stylized PDF certificate client-side.
 * @param {string} userName - Name printed on the certificate
 * @param {string} topicName - Completed learning track roadmap
 * @param {string} date - Date of completion
 * @param {string} certId - Unique verifiable hash/ID
 */
function downloadCertificatePDF(userName, topicName, date, certId) {
  // Access the bundled library from window scope
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [842, 595], // Standard A4 Landscape dimension
  });

  // --- 1. Draw Aesthetic Certificate Background/Borders ---
  doc.setFillColor(253, 253, 251); // Off-white ivory background
  doc.rect(0, 0, 842, 595, 'F');

  // Decorative elegant double borders
  doc.setDrawColor(118, 75, 162); // Purple primary theme accent
  doc.setLineWidth(8);
  doc.rect(20, 20, 802, 555);

  doc.setDrawColor(102, 126, 234); // Indigo secondary inner border
  doc.setLineWidth(2);
  doc.rect(32, 32, 778, 531);

  // --- 2. Typography & Header Section ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(118, 75, 162);
  doc.text('CERTIFICATE OF COMPLETION', 421, 110, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(102, 102, 102);
  doc.text('THIS IS PROUDLY PRESENTED TO', 421, 170, { align: 'center' });

  // --- 3. Dynamic User Name ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(34, 34, 34);
  doc.text(userName, 421, 225, { align: 'center' });

  // Elegant decorative line below name
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(250, 245, 592, 245);

  // --- 4. Topic Completion Statement ---
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(102, 102, 102);
  doc.text('for successfully mastering and completing the structured learning track on', 421, 285, {
    align: 'center',
  });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(118, 75, 162);
  doc.text(topicName, 421, 330, { align: 'center' });

  // --- 5. Footer Analytics (Date, Signatures, IDs) ---
  // Date Field
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text(`Date of Completion: ${date}`, 100, 460);

  // Verification Hash Stamp
  doc.setFont('Courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(153, 153, 153);
  doc.text(`Certificate ID: ${certId}`, 100, 480);

  // Decorative Digital Board Seal/Signature Placeholder
  doc.setDrawColor(118, 75, 162);
  doc.line(600, 460, 720, 460);
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text('Authorized Platform Board', 660, 475, { align: 'center' });

  // Trigger browser download workflow natively
  doc.save(`Certificate-${topicName.replace(/\s+/g, '-')}.pdf`);
}

/**
 * Validates requirements and lists cert items on user history panel
 */
function renderCertificatesDashboard(tracks) {
  const certListContainer = document.getElementById('certificates-list');
  if (!certListContainer) return;

  certListContainer.innerHTML = ''; // clear out loading tags

  tracks.forEach((track) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '12px 15px';
    li.style.marginBottom = '10px';
    li.style.background = '#fafafa';
    li.style.border = '1px solid #f0f0f0';
    li.style.borderRadius = '6px';

    // Verification check markup layout
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <strong style="color:#333; font-size:15px;">${track.topicName} Roadmap</strong>
      <div style="font-size:12px; color:#888; margin-top:2px;">
        Completed: ${track.completionDate} | Status: <span style="color:#16a34a; font-weight:600;">✓ Verified</span>
      </div>
    `;

    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download PDF';
    downloadBtn.style.padding = '6px 12px';
    downloadBtn.style.background = '#667eea';
    downloadBtn.style.color = '#fff';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.fontSize = '12px';
    downloadBtn.style.fontWeight = '600';

    // Hook click action to client-side canvas renderer
    downloadBtn.addEventListener('click', () => {
      // Real-time verification safety wrapper
      if (track.isCompleted) {
        // Automatically uses structural records cleanly
        downloadCertificatePDF(
          'Prasiddhi Mishra',
          track.topicName,
          track.completionDate,
          track.certificateId
        );
      } else {
        downloadBtn.textContent = '⚠ Track not completed';
        downloadBtn.style.background = '#6b7280';
        downloadBtn.disabled = true;
        setTimeout(() => {
          downloadBtn.textContent = 'Download PDF';
          downloadBtn.style.background = '#667eea';
          downloadBtn.disabled = false;
        }, 3000);
      }
    });

    li.appendChild(infoDiv);
    li.appendChild(downloadBtn);
    certListContainer.appendChild(li);
  });
}

// Mock completion database list for roadmaps
const mockUserCompletedRoadmaps = [
  {
    topicName: 'Data Structures & Algorithms',
    isCompleted: true,
    completionDate: '2026-05-14',
    certificateId: 'CERT-DSA-9941X',
  },
  {
    topicName: 'System Design Foundation',
    isCompleted: true,
    completionDate: '2026-06-20',
    certificateId: 'CERT-SYS-2180Z',
  },
];

// Execute layout setup on dashboard load hook
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('certificates-dashboard')) {
    renderCertificatesDashboard(mockUserCompletedRoadmaps);
  }
});

// Function to update user interface metrics for Interview Readiness
function renderReadinessDashboard(data) {
  // Update numbers
  document.getElementById('overall-score-badge').innerText = `${data.overallPercentage}%`;
  document.getElementById('dsa-score').innerText = `${data.breakdown.dsa}%`;
  document.getElementById('design-score').innerText = `${data.breakdown.systemDesign}%`;
  document.getElementById('quiz-score').innerText = `${data.breakdown.interview}%`;

  // Render Suggestions
  const suggestionsList = document.getElementById('suggestions-list');
  suggestionsList.innerHTML = ''; // clear out loading placeholder
  data.suggestions.forEach((tip) => {
    const li = document.createElement('li');
    li.style.fontSize = '14px';
    li.style.color = '#444';
    li.style.marginBottom = '8px';
    li.innerHTML = `💡 ${tip}`;
    suggestionsList.appendChild(li);
  });

  // Render Missing Topics
  const tagsContainer = document.getElementById('missing-topics-tags');
  tagsContainer.innerHTML = '';
  data.missingTopics.forEach((topic) => {
    const span = document.createElement('span');
    span.className = 'topic-tag';
    span.innerText = `⚠️ ${topic}`;
    tagsContainer.appendChild(span);
  });
}

// Mocking data simulation (or replace URL with real backend fetch call if running)
const dummyDataReport = {
  overallPercentage: 74,
  breakdown: { dsa: 80, systemDesign: 50, interview: 85 },
  missingTopics: ['Microservices', 'System Design Basics', 'Graphs'],
  suggestions: [
    'Take more mock quizzes to boost your quick recall.',
    'Focus on learning missing foundational topics: Microservices.',
    'Try solving at least 2 DSA problems daily to hit your target.',
  ],
};

// Auto-run dashboard on load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('readiness-dashboard')) {
    renderReadinessDashboard(dummyDataReport);
  }
});

/**
 * Saves the current page's bookmark details to browser local storage.
 * Call this function whenever a user opens/navigates to a learning resource page or visualizer.
 * @param {string} title - The title of the module or topic
 * @param {string} category - e.g., 'DSA', 'System Design', 'Interview Prep'
 * @param {string} relativeUrl - The file path or query string to load upon click
 */
function trackUserProgress(title, category, relativeUrl) {
  const progressMetadata = {
    title,
    category,
    relativeUrl,
    timestamp: new Date().toLocaleString(),
  };
  localStorage.setItem('last_visited_learning_page', JSON.stringify(progressMetadata));
}

/**
 * Checks local storage for previous progress and loads the resume widget if data exists.
 */
function initResumeWidget() {
  const widget = document.getElementById('resume-learning-widget');
  const titleElem = document.getElementById('resume-page-title');
  const categoryElem = document.getElementById('resume-page-category');
  const timeElem = document.getElementById('resume-page-time');
  const resumeBtn = document.getElementById('resume-learning-btn');

  if (!widget) return;

  const savedData = localStorage.getItem('last_visited_learning_page');

  if (savedData) {
    const progress = JSON.parse(savedData);

    // Update UI elements with retrieved metadata
    titleElem.innerText = progress.title;
    categoryElem.innerText = progress.category;
    timeElem.innerText = progress.timestamp;

    // Display widget card reactively
    widget.style.display = 'block';

    // Hook up click functionality to redirect user
    resumeBtn.onclick = () => {
      window.location.href = progress.relativeUrl;
    };
  } else {
    widget.style.display = 'none';
  }
}

// Simulated Tracker Event: Let's log a baseline entry if no history exists for demonstration purposes
document.addEventListener('DOMContentLoaded', () => {
  // If the user is checking out the dashboard for the first time, mock an active track
  if (!localStorage.getItem('last_visited_learning_page')) {
    trackUserProgress(
      'Graph Traversals (BFS & DFS)',
      'Data Structures & Algorithms',
      '#graph-visualizer'
    );
  }

  // Initialize and check layout visibility rules
  initResumeWidget();
});
