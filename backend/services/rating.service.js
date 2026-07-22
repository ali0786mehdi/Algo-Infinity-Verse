/**
 * Rating Service - ELO/Glicko rating calculation
 * Used for contest and battle rating updates
 */

class RatingService {
    constructor() {
        this.K_FACTOR = 32;
        this.SEASON_RESET_INTERVAL = 3; // months
        this.RATING_FLOOR = 400;
        this.RATING_CEILING = 3200;
        this.DEFAULT_RATING = 1200;
    }

    /**
     * Calculate ELO rating change
     * @param {number} playerRating - Current rating of player
     * @param {number} opponentRating - Current rating of opponent
     * @param {number} result - 1 for win, 0 for loss, 0.5 for draw
     * @param {number} K - K-factor (default: 32)
     * @returns {number} Rating change
     */
    calculateELO(playerRating, opponentRating, result, K = this.K_FACTOR) {
        const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        const change = K * (result - expected);
        return Math.round(change);
    }

    /**
     * Get tier based on rating
     * @param {number} rating
     * @returns {string} Tier name
     */
    getTier(rating) {
        if (rating < 1000) return 'novice';
        if (rating < 1300) return 'apprentice';
        if (rating < 1600) return 'adept';
        if (rating < 1900) return 'expert';
        if (rating < 2200) return 'master';
        if (rating < 2500) return 'grandmaster';
        return 'legend';
    }

    /**
     * Get tier color for UI
     * @param {string} tier
     * @returns {string} Hex color code
     */
    getTierColor(tier) {
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
    }

    /**
     * Get tier emoji
     * @param {string} tier
     * @returns {string} Emoji
     */
    getTierEmoji(tier) {
        const emojis = {
            novice: '🟢',
            apprentice: '🔵',
            adept: '🟣',
            expert: '🟡',
            master: '🟠',
            grandmaster: '🔴',
            legend: '👑'
        };
        return emojis[tier] || '⚪';
    }

    /**
     * Update player rating after a match
     * @param {Object} player - Player object with rating, matches, history
     * @param {Object} opponent - Opponent object
     * @param {number} result - 1 for win, 0 for loss, 0.5 for draw
     * @param {number} season - Current season number
     * @returns {Object} Updated player with change amount
     */
    updateRating(player, opponent, result, season) {
        const change = this.calculateELO(player.rating, opponent.rating, result);
        const newRating = Math.max(this.RATING_FLOOR, Math.min(this.RATING_CEILING, player.rating + change));
        
        player.rating = newRating;
        player.tier = this.getTier(newRating);
        player.matches = (player.matches || 0) + 1;
        
        if (result === 1) {
            player.wins = (player.wins || 0) + 1;
        } else if (result === 0) {
            player.losses = (player.losses || 0) + 1;
        } else {
            player.draws = (player.draws || 0) + 1;
        }
        
        // Track streak
        if (result === 1) {
            player.streak = (player.streak || 0) > 0 ? player.streak + 1 : 1;
        } else if (result === 0) {
            player.streak = (player.streak || 0) < 0 ? player.streak - 1 : -1;
        } else {
            player.streak = 0;
        }
        
        // Add to history
        if (!player.history) player.history = [];
        player.history.push({
            date: new Date().toISOString(),
            rating: newRating,
            change: change,
            opponent: opponent.name || 'unknown',
            result: result,
            season: season
        });
        
        // Keep last 50 history entries for performance
        if (player.history.length > 50) {
            player.history = player.history.slice(-50);
        }
        
        return {
            ...player,
            change: change
        };
    }

    /**
     * Perform season reset for all players
     * @param {Array} players - Array of player objects
     * @param {number} newSeason - New season number
     * @param {number} resetFactor - How much to compress ratings (default: 0.5)
     * @returns {Array} Updated players array
     */
    seasonReset(players, newSeason, resetFactor = 0.5) {
        const targetRating = this.DEFAULT_RATING;
        return players.map(player => {
            // Soft reset: move rating towards target
            const newRating = Math.round(
                player.rating + (targetRating - player.rating) * resetFactor
            );
            const finalRating = Math.max(this.RATING_FLOOR, Math.min(this.RATING_CEILING, newRating));
            
            return {
                ...player,
                rating: finalRating,
                tier: this.getTier(finalRating),
                season: newSeason,
                // Keep some history but mark season transition
                history: player.history ? [
                    ...player.history.slice(-5),
                    {
                        date: new Date().toISOString(),
                        rating: finalRating,
                        change: 0,
                        opponent: 'Season Reset',
                        result: 0,
                        season: newSeason,
                        isSeasonReset: true
                    }
                ] : []
            };
        });
    }

    /**
     * Calculate expected win probability
     * @param {number} rating1 - Rating of player 1
     * @param {number} rating2 - Rating of player 2
     * @returns {number} Expected probability (0-1)
     */
    getExpectedWinRate(rating1, rating2) {
        return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    }

    /**
     * Validate rating update
     * @param {Object} update - Rating update object
     * @returns {boolean} Whether update is valid
     */
    validateUpdate(update) {
        return (
            update &&
            typeof update.playerId === 'number' &&
            typeof update.opponentId === 'number' &&
            [0, 0.5, 1].includes(update.result) &&
            update.season > 0
        );
    }

    /**
     * Get player stats summary
     * @param {Object} player - Player object
     * @returns {Object} Stats summary
     */
    getPlayerStats(player) {
        const total = player.matches || 0;
        const wins = player.wins || 0;
        const losses = player.losses || 0;
        const draws = player.draws || 0;
        
        return {
            name: player.name,
            rating: player.rating,
            tier: player.tier,
            matches: total,
            wins: wins,
            losses: losses,
            draws: draws,
            winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
            streak: player.streak || 0,
            history: player.history || []
        };
    }

    /**
     * Generate ranking list
     * @param {Array} players - Array of player objects
     * @param {string} sortBy - Sort field (rating, matches, wins)
     * @returns {Array} Sorted players with rankings
     */
    getRankings(players, sortBy = 'rating') {
        const sorted = [...players].sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'matches') return b.matches - a.matches;
            if (sortBy === 'wins') return b.wins - a.wins;
            return b.rating - a.rating;
        });
        
        return sorted.map((player, index) => ({
            ...player,
            rank: index + 1
        }));
    }
}

module.exports = RatingService;