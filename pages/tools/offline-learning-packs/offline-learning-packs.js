(function() {
    'use strict';

    // ----- DOM refs -----
    const topicGrid = document.getElementById('topicGrid');
    const packsList = document.getElementById('packsList');
    const downloadBtn = document.getElementById('downloadBtn');
    const selectedCount = document.getElementById('selectedCount');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const storageUsed = document.getElementById('storageUsed');
    const storageQuota = document.getElementById('storageQuota');
    const storageBar = document.getElementById('storageBar');
    const storageWarning = document.getElementById('storageWarning');
    const quizSection = document.getElementById('quizSection');
    const closeQuizBtn = document.getElementById('closeQuizBtn');
    const quizTopicName = document.getElementById('quizTopicName');
    const quizQuestionCount = document.getElementById('quizQuestionCount');
    const questionText = document.getElementById('questionText');
    const quizOptions = document.getElementById('quizOptions');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const quizResult = document.getElementById('quizResult');
    const resultMessage = document.getElementById('resultMessage');
    const retryQuizBtn = document.getElementById('retryQuizBtn');
    const syncStatus = document.getElementById('syncStatus');
    const syncIcon = document.getElementById('syncIcon');
    const syncMessage = document.getElementById('syncMessage');
    const syncProgress = document.getElementById('syncProgress');
    const syncBar = document.getElementById('syncBar');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    // ----- State -----
    let topics = [];
    let downloadedPacks = [];
    let selectedTopics = new Set();
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let quizAnswers = [];
    let quizCompleted = false;
    let syncQueue = [];

    // ----- Mock data (topics and quizzes) -----
    const TOPIC_DATA = [
        {
            id: 1,
            name: 'JavaScript Fundamentals',
            size: '2.4 MB',
            icon: '📘',
            quiz: {
                questions: [
                    {
                        question: 'What is the output of `typeof null`?',
                        options: ['null', 'undefined', 'object', 'number'],
                        correct: 2
                    },
                    {
                        question: 'Which method adds an element to the end of an array?',
                        options: ['push()', 'pop()', 'shift()', 'unshift()'],
                        correct: 0
                    },
                    {
                        question: 'What is the result of `2 + "2"`?',
                        options: ['4', '"22"', '22', 'Error'],
                        correct: 1
                    }
                ]
            }
        },
        {
            id: 2,
            name: 'React Basics',
            size: '3.1 MB',
            icon: '⚛️',
            quiz: {
                questions: [
                    {
                        question: 'Which hook is used for side effects?',
                        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
                        correct: 1
                    },
                    {
                        question: 'What is JSX?',
                        options: ['JavaScript XML', 'JavaScript Extension', 'JSON Syntax', 'Java Syntax'],
                        correct: 0
                    },
                    {
                        question: 'Which method is used to update state in class components?',
                        options: ['this.state', 'this.setState', 'this.updateState', 'state.update'],
                        correct: 1
                    }
                ]
            }
        },
        {
            id: 3,
            name: 'CSS Flexbox & Grid',
            size: '1.8 MB',
            icon: '🎨',
            quiz: {
                questions: [
                    {
                        question: 'Which property creates a flex container?',
                        options: ['display: flex', 'display: grid', 'flex: 1', 'display: block'],
                        correct: 0
                    },
                    {
                        question: 'What does `justify-content: center` do?',
                        options: ['Centers vertically', 'Centers horizontally', 'Centers both', 'None'],
                        correct: 1
                    },
                    {
                        question: 'Which property creates a grid container?',
                        options: ['display: flex', 'display: grid', 'display: block', 'grid: true'],
                        correct: 1
                    }
                ]
            }
        },
        {
            id: 4,
            name: 'Node.js & Express',
            size: '4.2 MB',
            icon: '🟩',
            quiz: {
                questions: [
                    {
                        question: 'Which method creates a server in Express?',
                        options: ['express.server()', 'app.listen()', 'http.createServer()', 'express.createServer()'],
                        correct: 1
                    },
                    {
                        question: 'What is middleware in Express?',
                        options: ['Functions that process requests', 'Database layer', 'Template engine', 'Security layer'],
                        correct: 0
                    },
                    {
                        question: 'Which package manages dependencies in Node?',
                        options: ['npm', 'node', 'yarn', 'Both npm and yarn'],
                        correct: 3
                    }
                ]
            }
        },
        {
            id: 5,
            name: 'Data Structures',
            size: '5.6 MB',
            icon: '📊',
            quiz: {
                questions: [
                    {
                        question: 'What is the time complexity of binary search?',
                        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
                        correct: 1
                    },
                    {
                        question: 'Which data structure uses LIFO?',
                        options: ['Queue', 'Stack', 'Array', 'Linked List'],
                        correct: 1
                    },
                    {
                        question: 'Which data structure uses FIFO?',
                        options: ['Queue', 'Stack', 'Tree', 'Graph'],
                        correct: 0
                    }
                ]
            }
        },
        {
            id: 6,
            name: 'TypeScript',
            size: '2.9 MB',
            icon: '🔷',
            quiz: {
                questions: [
                    {
                        question: 'What is TypeScript?',
                        options: ['A superset of JavaScript', 'A new language', 'A framework', 'A library'],
                        correct: 0
                    },
                    {
                        question: 'What type is `any`?',
                        options: ['Any type', 'String', 'Number', 'Boolean'],
                        correct: 0
                    },
                    {
                        question: 'Which keyword defines an interface?',
                        options: ['interface', 'type', 'class', 'implements'],
                        correct: 0
                    }
                ]
            }
        },
        {
            id: 7,
            name: 'Git & GitHub',
            size: '1.5 MB',
            icon: '🔀',
            quiz: {
                questions: [
                    {
                        question: 'Which command creates a new branch?',
                        options: ['git branch new', 'git checkout -b new', 'git create branch', 'Both A and B'],
                        correct: 3
                    },
                    {
                        question: 'What does `git commit -m "msg"` do?',
                        options: ['Commits changes with message', 'Creates a tag', 'Merges branches', 'Pushes to remote'],
                        correct: 0
                    },
                    {
                        question: 'Which command pushes to remote?',
                        options: ['git push', 'git pull', 'git fetch', 'git clone'],
                        correct: 0
                    }
                ]
            }
        },
        {
            id: 8,
            name: 'Docker & DevOps',
            size: '6.8 MB',
            icon: '🐳',
            quiz: {
                questions: [
                    {
                        question: 'What is Docker?',
                        options: ['Containerization platform', 'Virtual machine', 'Package manager', 'Framework'],
                        correct: 0
                    },
                    {
                        question: 'What is a Docker image?',
                        options: ['A template for containers', 'A running container', 'A network', 'A volume'],
                        correct: 0
                    },
                    {
                        question: 'Which command builds a Docker image?',
                        options: ['docker build', 'docker create', 'docker run', 'docker image'],
                        correct: 0
                    }
                ]
            }
        }
    ];

    // ----- Theme -----
    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeIcon.textContent = dark ? '☀️' : '🌙';
        themeLabel.textContent = dark ? 'Light' : 'Dark';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        setTheme(!isDark);
    });

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme(true);
    }

    // ----- Storage (IndexedDB simulation using localStorage) -----
    function getPacks() {
        try {
            const data = localStorage.getItem('offlinePacks');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function savePacks(packs) {
        localStorage.setItem('offlinePacks', JSON.stringify(packs));
        downloadedPacks = packs;
    }

    function getSyncQueue() {
        try {
            const data = localStorage.getItem('syncQueue');
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveSyncQueue(queue) {
        localStorage.setItem('syncQueue', JSON.stringify(queue));
        syncQueue = queue;
    }

    // ----- Storage quota simulation -----
    function updateStorageStatus() {
        const packs = getPacks();
        const totalSize = packs.reduce((sum, p) => sum + p.size, 0);
        const quota = 50; // MB
        const used = totalSize;
        const percentage = Math.min((used / quota) * 100, 100);

        storageUsed.textContent = used.toFixed(1) + ' MB';
        storageQuota.textContent = quota + ' MB';
        storageBar.style.width = percentage + '%';

        if (percentage > 80) {
            storageWarning.style.display = 'block';
            storageBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (percentage > 60) {
            storageWarning.style.display = 'block';
            storageWarning.textContent = '⚠️ Storage is getting full. Consider clearing old packs.';
            storageBar.style.background = 'linear-gradient(90deg, #f59e0b, #f97316)';
        } else {
            storageWarning.style.display = 'none';
            storageBar.style.background = 'linear-gradient(90deg, #3b82f6, #8b5cf6)';
        }
    }

    // ----- Render topics -----
    function renderTopics() {
        topics = TOPIC_DATA;
        const downloaded = getPacks();
        const downloadedIds = new Set(downloaded.map(p => p.id));

        let html = '';
        topics.forEach(topic => {
            const isSelected = selectedTopics.has(topic.id);
            const isDownloaded = downloadedIds.has(topic.id);
            const statusIcon = isDownloaded ? '✅' : isSelected ? '☑️' : '⬜';

            html += `
                <div class="topic-card ${isSelected ? 'selected' : ''} ${isDownloaded ? 'downloaded' : ''}" 
                     data-id="${topic.id}" data-downloaded="${isDownloaded}">
                    <div class="topic-status">${statusIcon}</div>
                    <div class="topic-name">${topic.icon} ${topic.name}</div>
                    <div class="topic-size">${topic.size}</div>
                </div>
            `;
        });

        topicGrid.innerHTML = html;

        // Add click listeners
        document.querySelectorAll('.topic-card').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.id);
                const isDownloaded = el.dataset.downloaded === 'true';
                if (isDownloaded) {
                    // Can't select already downloaded topics for re-download
                    // But we can allow deselecting
                    if (selectedTopics.has(id)) {
                        selectedTopics.delete(id);
                        el.classList.remove('selected');
                    }
                } else {
                    if (selectedTopics.has(id)) {
                        selectedTopics.delete(id);
                        el.classList.remove('selected');
                    } else {
                        selectedTopics.add(id);
                        el.classList.add('selected');
                    }
                }
                updateDownloadButton();
            });
        });

        updateDownloadButton();
    }

    // ----- Update download button -----
    function updateDownloadButton() {
        const count = selectedTopics.size;
        selectedCount.textContent = count;
        downloadBtn.disabled = count === 0;
    }

    // ----- Download packs -----
    function downloadPacks() {
        const selected = topics.filter(t => selectedTopics.has(t.id));
        if (selected.length === 0) return;

        const existing = getPacks();
        const existingIds = new Set(existing.map(p => p.id));
        const newPacks = selected.filter(t => !existingIds.has(t.id));

        if (newPacks.length === 0) {
            alert('All selected topics are already downloaded!');
            return;
        }

        // Simulate download progress
        downloadBtn.textContent = '⬇️ Downloading...';
        downloadBtn.disabled = true;

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress >= 100) {
                clearInterval(interval);
                // Add new packs
                const updated = [...existing, ...newPacks.map(t => ({
                    id: t.id,
                    name: t.name,
                    icon: t.icon,
                    size: parseFloat(t.size) || 0,
                    quiz: t.quiz,
                    downloadedAt: new Date().toISOString()
                }))];
                savePacks(updated);
                selectedTopics.clear();
                renderTopics();
                renderPacks();
                updateStorageStatus();
                downloadBtn.textContent = '⬇️ Download Selected (0)';
                downloadBtn.disabled = false;
                // Show sync status
                showSyncStatus('Download complete!', 100);
                setTimeout(() => hideSyncStatus(), 2000);
            }
            syncBar.style.width = progress + '%';
            syncProgress.textContent = progress + '%';
        }, 200);
    }

    // ----- Render downloaded packs -----
    function renderPacks() {
        const packs = getPacks();
        if (packs.length === 0) {
            packsList.innerHTML = '<div class="empty-state">No packs downloaded yet. Select topics above to get started.</div>';
            return;
        }

        let html = '';
        packs.forEach(pack => {
            html += `
                <div class="pack-item" data-id="${pack.id}">
                    <div class="pack-info">
                        <span class="pack-icon">${pack.icon || '📦'}</span>
                        <div>
                            <div class="pack-name">${pack.name}</div>
                            <div class="pack-detail">${pack.size.toFixed(1)} MB · Downloaded ${new Date(pack.downloadedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="pack-actions">
                        <button class="btn-quiz" data-id="${pack.id}">📝 Quiz</button>
                        <button class="btn-delete-pack" data-id="${pack.id}">🗑️</button>
                    </div>
                </div>
            `;
        });

        packsList.innerHTML = html;

        // Add event listeners
        document.querySelectorAll('.btn-quiz').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                startQuiz(id);
            });
        });

        document.querySelectorAll('.btn-delete-pack').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                deletePack(id);
            });
        });
    }

    // ----- Delete pack -----
    function deletePack(id) {
        if (!confirm('Are you sure you want to delete this pack?')) return;
        let packs = getPacks();
        packs = packs.filter(p => p.id !== id);
        savePacks(packs);
        renderPacks();
        renderTopics();
        updateStorageStatus();
        // Close quiz if it was for this pack
        if (currentQuiz && currentQuiz.id === id) {
            closeQuiz();
        }
    }

    // ----- Clear all packs -----
    function clearAllPacks() {
        if (!confirm('Are you sure you want to clear ALL downloaded packs? This will free up storage.')) return;
        savePacks([]);
        renderPacks();
        renderTopics();
        updateStorageStatus();
        closeQuiz();
    }

    // ----- Quiz functionality -----
    function startQuiz(packId) {
        const packs = getPacks();
        const pack = packs.find(p => p.id === packId);
        if (!pack || !pack.quiz) {
            alert('Quiz data not found for this pack.');
            return;
        }

        currentQuiz = pack;
        currentQuestionIndex = 0;
        quizAnswers = [];
        quizCompleted = false;
        quizSection.style.display = 'block';
        quizTopicName.textContent = pack.icon + ' ' + pack.name;
        quizResult.style.display = 'none';
        submitAnswerBtn.style.display = 'inline-block';
        nextQuestionBtn.style.display = 'none';

        renderQuestion();
        quizSection.scrollIntoView({ behavior: 'smooth' });
    }

    function renderQuestion() {
        if (!currentQuiz || !currentQuiz.quiz) return;

        const questions = currentQuiz.quiz.questions;
        if (currentQuestionIndex >= questions.length) {
            completeQuiz();
            return;
        }

        const q = questions[currentQuestionIndex];
        questionText.textContent = q.question;
        quizQuestionCount.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;

        let html = '';
        q.options.forEach((option, index) => {
            const isSelected = quizAnswers[currentQuestionIndex] === index;
            html += `
                <div class="quiz-option ${isSelected ? 'selected' : ''}" data-index="${index}">
                    ${String.fromCharCode(65 + index)}. ${option}
                </div>
            `;
        });

        quizOptions.innerHTML = html;
        quizOptions.querySelectorAll('.quiz-option').forEach(el => {
            el.addEventListener('click', () => {
                if (quizCompleted) return;
                const index = parseInt(el.dataset.index);
                quizAnswers[currentQuestionIndex] = index;
                // Update UI
                quizOptions.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                el.classList.add('selected');
                submitAnswerBtn.disabled = false;
            });
        });

        submitAnswerBtn.disabled = true;
        submitAnswerBtn.style.display = 'inline-block';
        nextQuestionBtn.style.display = 'none';
        quizResult.style.display = 'none';
    }

    function submitAnswer() {
        if (quizCompleted || quizAnswers[currentQuestionIndex] === undefined) return;

        const questions = currentQuiz.quiz.questions;
        const q = questions[currentQuestionIndex];
        const selected = quizAnswers[currentQuestionIndex];
        const isCorrect = selected === q.correct;

        // Show correct/wrong
        const options = quizOptions.querySelectorAll('.quiz-option');
        options.forEach((opt, idx) => {
            opt.classList.add('disabled');
            if (idx === q.correct) opt.classList.add('correct');
            if (idx === selected && !isCorrect) opt.classList.add('wrong');
        });

        submitAnswerBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'inline-block';
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= currentQuiz.quiz.questions.length) {
            completeQuiz();
        } else {
            renderQuestion();
        }
    }

    function completeQuiz() {
        quizCompleted = true;
        const questions = currentQuiz.quiz.questions;
        const correct = quizAnswers.filter((ans, idx) => ans === questions[idx].correct).length;
        const total = questions.length;

        quizResult.style.display = 'block';
        resultMessage.innerHTML = `
            🎉 Quiz Complete!<br>
            You got <strong>${correct}</strong> out of <strong>${total}</strong> correct (${Math.round((correct/total)*100)}%)
        `;
        submitAnswerBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'none';

        // Add to sync queue
        const queue = getSyncQueue();
        queue.push({
            packId: currentQuiz.id,
            packName: currentQuiz.name,
            score: correct,
            total: total,
            timestamp: new Date().toISOString()
        });
        saveSyncQueue(queue);
        showSyncStatus('Queued for sync', 100);
        setTimeout(() => hideSyncStatus(), 2000);
    }

    function retryQuiz() {
        if (!currentQuiz) return;
        currentQuestionIndex = 0;
        quizAnswers = [];
        quizCompleted = false;
        quizResult.style.display = 'none';
        renderQuestion();
    }

    function closeQuiz() {
        quizSection.style.display = 'none';
        currentQuiz = null;
        quizCompleted = false;
    }

    // ----- Sync status -----
    function showSyncStatus(message, progress) {
        syncStatus.style.display = 'block';
        syncMessage.textContent = message;
        syncProgress.textContent = progress + '%';
        syncBar.style.width = progress + '%';
        syncIcon.textContent = progress < 100 ? '🔄' : '✅';
    }

    function hideSyncStatus() {
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 1000);
    }

    // ----- Event listeners -----
    downloadBtn.addEventListener('click', downloadPacks);
    selectAllBtn.addEventListener('click', () => {
        const downloaded = getPacks();
        const downloadedIds = new Set(downloaded.map(p => p.id));
        const available = topics.filter(t => !downloadedIds.has(t.id));
        if (available.length === 0) {
            alert('All topics are already downloaded!');
            return;
        }
        available.forEach(t => {
            if (!selectedTopics.has(t.id)) {
                selectedTopics.add(t.id);
            }
        });
        renderTopics();
    });

    clearAllBtn.addEventListener('click', clearAllPacks);
    closeQuizBtn.addEventListener('click', closeQuiz);
    submitAnswerBtn.addEventListener('click', submitAnswer);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    retryQuizBtn.addEventListener('click', retryQuiz);

    // ----- Initialize -----
    renderTopics();
    renderPacks();
    updateStorageStatus();

    // Auto-sync queue on load
    const queue = getSyncQueue();
    if (queue.length > 0) {
        showSyncStatus(`Syncing ${queue.length} items...`, 50);
        setTimeout(() => {
            saveSyncQueue([]);
            showSyncStatus('Sync complete!', 100);
            setTimeout(() => hideSyncStatus(), 2000);
        }, 1500);
    }

    // Expose for debugging
    window.__OfflinePacks = {
        topics: TOPIC_DATA,
        getPacks,
        savePacks,
        selectedTopics,
        downloadPacks,
        startQuiz,
        clearAllPacks
    };

    console.log('📦 Offline Learning Packs initialized!');
    console.log('💡 Select topics and download for offline study.');
})();