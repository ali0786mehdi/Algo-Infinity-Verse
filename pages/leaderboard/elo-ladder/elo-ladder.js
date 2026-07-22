(function() {
    'use strict';

    // ----- DOM refs -----
    const ladderBody = document.getElementById('ladderBody');
    const searchInput = document.getElementById('searchPlayer');
    const tierFilter = document.getElementById('tierFilter');
    const historyPlayer = document.getElementById('historyPlayer');
    const totalPlayersEl = document.getElementById('totalPlayers');
    const topRatingEl = document.getElementById('topRating');
    const activeSeasonEl = document.getElementById('activeSeason');
    const totalMatchesEl = document.getElementById('totalMatches');
    const seasonToggle = document.getElementById('seasonToggle');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    let ratingChart = null;
    let currentSeason = 1;
    let allPlayers = [];
    let selectedPlayer = null;

    // ----- theme -----
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

    // ----- Mock data (simulates data/ratings.json) -----
    function generateMockPlayers(count = 25) {
        const names = [
            'ShadowStrike', 'CodeNinja', 'ByteWizard', 'LogicMaster', 'ArrayQueen',
            'RecursionKing', 'BinaryBoss', 'HashHero', 'PointerPro', 'StackGuru',
            'LoopLegend', 'SortSavant', 'QueryCoder', 'DataDynamo', 'AlgoAce',
            'DebugDiva', 'SyntaxSage', 'FunctionFox', 'VariableViper', 'ObjectOracle',
            'ClassCaptain', 'MethodMaverick', 'ThreadTitan', 'CacheChampion', 'PixelPioneer'
        ];
        const players = [];
        const tiers = ['novice', 'apprentice', 'adept', 'expert', 'master', 'grandmaster', 'legend'];
        
        for (let i = 0; i < Math.min(count, names.length); i++) {
            const baseRating = 800 + Math.floor(Math.random() * 2200);
            const tierIndex = Math.min(Math.floor((baseRating - 800) / 300), tiers.length - 1);
            const matches = 10 + Math.floor(Math.random() * 90);
            const wins = Math.floor(matches * (0.3 + Math.random() * 0.5));
            
            players.push({
                id: i + 1,
                name: names[i],
                rating: baseRating,
                tier: tiers[tierIndex],
                matches: matches,
                wins: wins,
                losses: matches - wins,
                streak: Math.floor(Math.random() * 8) - 3,
                history: generateHistory(baseRating, 20 + Math.floor(Math.random() * 30))
            });
        }
        // Sort by rating descending
        players.sort((a, b) => b.rating - a.rating);
        return players;
    }

    function generateHistory(baseRating, points) {
        const history = [];
        let current = baseRating - 200;
        for (let i = 0; i < points; i++) {
            current += Math.floor(Math.random() * 60) - 25;
            current = Math.max(400, Math.min(3200, current));
            history.push({
                date: new Date(Date.now() - (points - i) * 86400000 * 2).toISOString().split('T')[0],
                rating: current
            });
        }
        return history;
    }

    // ----- Rating service (simulates backend/services/rating.service.js) -----
    const RatingService = {
        calculateELO: function(playerRating, opponentRating, result) {
            // result: 1 = win, 0 = loss, 0.5 = draw
            const K = 32;
            const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
            const change = K * (result - expected);
            return Math.round(change);
        },

        getTier: function(rating) {
            if (rating < 1000) return 'novice';
            if (rating < 1300) return 'apprentice';
            if (rating < 1600) return 'adept';
            if (rating < 1900) return 'expert';
            if (rating < 2200) return 'master';
            if (rating < 2500) return 'grandmaster';
            return 'legend';
        },

        getTierColor: function(tier) {
            const colors = {
                novice: '#d1d5db',
                apprentice: '#93c5fd',
                adept: '#6ee7b7',
                expert: '#fcd34d',
                master: '#f59e0b',
                grandmaster: '#f472b6',
                legend: '#a78bfa'
            };
            return colors[tier] || '#d1d5db';
        },

        updateRating: function(player, opponent, result, season) {
            const change = this.calculateELO(player.rating, opponent.rating, result);
            player.rating += change;
            player.tier = this.getTier(player.rating);
            player.matches += 1;
            if (result === 1) player.wins += 1;
            else if (result === 0) player.losses += 1;
            player.history.push({
                date: new Date().toISOString().split('T')[0],
                rating: player.rating
            });
            return change;
        },

        seasonReset: function(players, newSeason) {
            // Reset ratings with soft reset (towards 1200)
            return players.map(p => {
                const newRating = Math.round((p.rating + 1200) / 2);
                return {
                    ...p,
                    rating: newRating,
                    tier: this.getTier(newRating),
                    history: p.history.slice(-5) // keep last 5 history points
                };
            });
        }
    };

    // ----- Data management (simulates data/ratings.json) -----
    let playersData = [];

    function loadData() {
        try {
            const stored = localStorage.getItem('eloLadderData');
            if (stored) {
                playersData = JSON.parse(stored);
                return;
            }
        } catch (e) {
            console.warn('Failed to load from localStorage, using mock data');
        }
        playersData = generateMockPlayers(25);
        saveData();
    }

    function saveData() {
        try {
            localStorage.setItem('eloLadderData', JSON.stringify(playersData));
        } catch (e) {
            console.warn('Failed to save to localStorage');
        }
    }

    // ----- Render functions -----
    function renderLadder(players) {
        if (!players || players.length === 0) {
            ladderBody.innerHTML = '<tr><td colspan="7" class="loading-state">No players found</td></tr>';
            return;
        }

        let html = '';
        players.forEach((player, index) => {
            const winRate = player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
            const streakIcon = player.streak > 0 ? '🔥' : player.streak < 0 ? '❄️' : '➖';
            const displayStreak = player.streak > 0 ? `+${player.streak}` : player.streak;

            html += `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td><strong>${player.name}</strong></td>
                    <td><strong>${player.rating}</strong></td>
                    <td><span class="tier-badge tier-${player.tier}">${player.tier}</span></td>
                    <td>${player.matches}</td>
                    <td>${winRate}%</td>
                    <td>${streakIcon} ${displayStreak}</td>
                </tr>
            `;
        });
        ladderBody.innerHTML = html;
        updateStats(players);
        updateHistoryDropdown(players);
    }

    function updateStats(players) {
        totalPlayersEl.textContent = players.length;
        const topRating = players.length > 0 ? players[0].rating : 0;
        topRatingEl.textContent = topRating;
        activeSeasonEl.textContent = `Season ${currentSeason}`;
        const totalMatches = players.reduce((sum, p) => sum + p.matches, 0);
        totalMatchesEl.textContent = totalMatches;
    }

    function updateHistoryDropdown(players) {
        const currentValue = historyPlayer.value;
        historyPlayer.innerHTML = '<option value="">Select a player...</option>';
        players.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.name} (${p.rating})`;
            historyPlayer.appendChild(option);
        });
        if (currentValue && players.some(p => p.id == currentValue)) {
            historyPlayer.value = currentValue;
        }
    }

    // ----- Chart -----
    function renderChart(player) {
        if (!player || !player.history || player.history.length === 0) {
            if (ratingChart) {
                ratingChart.destroy();
                ratingChart = null;
            }
            return;
        }

        const ctx = document.getElementById('ratingChart').getContext('2d');
        if (ratingChart) {
            ratingChart.destroy();
        }

        const labels = player.history.map(h => h.date);
        const data = player.history.map(h => h.rating);

        ratingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${player.name}'s Rating`,
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: document.body.classList.contains('dark') ? '#e2e8f0' : '#0b1b2f'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: document.body.classList.contains('dark') ? '#334155' : '#e2e8f0'
                        },
                        ticks: {
                            color: document.body.classList.contains('dark') ? '#e2e8f0' : '#0b1b2f'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: document.body.classList.contains('dark') ? '#e2e8f0' : '#0b1b2f',
                            maxTicksLimit: 20
                        }
                    }
                }
            }
        });
    }

    // ----- Filtering -----
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const tier = tierFilter.value;

        let filtered = playersData.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm);
            const matchesTier = tier === 'all' || p.tier === tier;
            return matchesSearch && matchesTier;
        });

        renderLadder(filtered);
    }

    // ----- Season management -----
    function toggleSeason() {
        if (currentSeason === 1) {
            // Start new season
            playersData = RatingService.seasonReset(playersData, currentSeason + 1);
            currentSeason++;
            seasonToggle.textContent = `📅 Season ${currentSeason}`;
            saveData();
            filterAndRender();
            // Reset chart
            if (ratingChart) {
                ratingChart.destroy();
                ratingChart = null;
            }
        } else {
            // Show previous season (mock - just revert to original)
            loadData();
            currentSeason = 1;
            seasonToggle.textContent = '📅 Season 1';
            filterAndRender();
        }
    }

    // ----- Event listeners -----
    searchInput.addEventListener('input', filterAndRender);
    tierFilter.addEventListener('change', filterAndRender);
    seasonToggle.addEventListener('click', toggleSeason);

    historyPlayer.addEventListener('change', function() {
        const playerId = parseInt(this.value);
        if (playerId) {
            const player = playersData.find(p => p.id === playerId);
            if (player) {
                renderChart(player);
                selectedPlayer = player;
            }
        } else {
            if (ratingChart) {
                ratingChart.destroy();
                ratingChart = null;
            }
            selectedPlayer = null;
        }
    });

    // ----- Initialize -----
    loadData();
    filterAndRender();

    // Auto-select first player for chart
    if (playersData.length > 0) {
        historyPlayer.value = playersData[0].id;
        renderChart(playersData[0]);
        selectedPlayer = playersData[0];
    }

    // ----- Simulate battle (for demo) -----
    window.simulateBattle = function(player1Id, player2Id, result) {
        // result: 1 = player1 wins, 0 = player2 wins
        const p1 = playersData.find(p => p.id === player1Id);
        const p2 = playersData.find(p => p.id === player2Id);
        if (!p1 || !p2) return;

        const change = RatingService.updateRating(p1, p2, result, currentSeason);
        // Update opponent
        RatingService.updateRating(p2, p1, 1 - result, currentSeason);
        saveData();
        filterAndRender();
        
        // Update chart if selected player affected
        if (selectedPlayer && (selectedPlayer.id === p1.id || selectedPlayer.id === p2.id)) {
            const updated = playersData.find(p => p.id === selectedPlayer.id);
            if (updated) renderChart(updated);
        }
        return change;
    };

    // Expose for console debugging
    window.__ELOLadder = {
        playersData,
        RatingService,
        currentSeason,
        simulateBattle: window.simulateBattle,
        renderChart
    };

    console.log('🏆 ELO Ladder initialized!');
    console.log('💡 Try: simulateBattle(1, 2, 1) to simulate a battle');
})();