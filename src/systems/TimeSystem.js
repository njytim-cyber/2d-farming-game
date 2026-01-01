/**
 * Time System
 * Manages day/night cycle, seasons, weather, and energy
 */

import {
    SEASONS,
    SEASON_ICONS,
    DAYS_PER_SEASON,
    RAIN_CHANCE,
    DAY_LENGTH,
    DAY_START_HOUR,
    DAY_DURATION_HOURS
} from '../game/constants.js';

/**
 * Time System class
 */
export class TimeSystem {
    constructor(state = {}) {
        this.dayTime = state.dayTime || 0;
        this.dayLength = state.dayLength || DAY_LENGTH;
        this.dayCount = state.dayCount || 1;
        this.season = state.season || 0;
        this.weather = state.weather || 'Sunny';
        this.energy = state.energy || 300;
        this.maxEnergy = state.maxEnergy || 300;

        this.onDayEndCallbacks = [];
    }

    /**
     * Subscribe to day end events
     */
    onDayEnd(callback) {
        this.onDayEndCallbacks.push(callback);
        return () => {
            const idx = this.onDayEndCallbacks.indexOf(callback);
            if (idx > -1) this.onDayEndCallbacks.splice(idx, 1);
        };
    }

    /**
     * Update time (called each frame)
     * @returns {boolean} Whether a new day started
     */
    update() {
        this.dayTime++;

        if (this.dayTime > this.dayLength) {
            this.startNewDay();
            return true;
        }
        return false;
    }

    /**
     * Start a new day
     */
    startNewDay() {
        this.dayTime = 0;
        this.dayCount++;
        this.energy = this.maxEnergy;

        // Track season change
        const previousSeason = this.season;

        // Update season (28 days per season)
        this.season = Math.floor((this.dayCount - 1) / DAYS_PER_SEASON) % 4;

        // Flag if season changed
        this.seasonChanged = previousSeason !== this.season;

        // Determine weather
        this.weather = Math.random() < RAIN_CHANCE ? 'Rain' : 'Sunny';

        // Notify listeners
        this.onDayEndCallbacks.forEach(cb => cb(this));
    }

    /**
     * Get current time as formatted string (HH:MM)
     */
    getTimeString() {
        const progress = this.dayTime / this.dayLength;
        // Day spans 6:00 to 2:00 (20 hours = 1200 minutes)
        const totalMinutes = Math.floor(progress * DAY_DURATION_HOURS * 60);
        const startMinutes = DAY_START_HOUR * 60;
        let currentMinutes = startMinutes + totalMinutes;

        if (currentMinutes >= 24 * 60) {
            currentMinutes -= 24 * 60;
        }

        const hours = Math.floor(currentMinutes / 60);
        const mins = Math.floor((currentMinutes % 60) / 10) * 10; // Round to 10 min

        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Get day progress (0-1)
     */
    getDayProgress() {
        return this.dayTime / this.dayLength;
    }

    /**
     * Get night overlay alpha (starts at 60% of day)
     */
    getNightAlpha() {
        const progress = this.getDayProgress();
        if (progress <= 0.6) return 0;
        return Math.min(0.85, (progress - 0.6) * 3);
    }

    /**
     * Get current season name
     */
    getSeasonName() {
        return SEASONS[this.season];
    }

    /**
     * Get current season icon
     */
    getSeasonIcon() {
        return SEASON_ICONS[this.season];
    }

    /**
     * Get weather icon
     */
    getWeatherIcon() {
        if (this.weather !== 'Rain') return '';
        return this.season === 3 ? '🌨️' : '🌧️';
    }

    /**
     * Get weather message
     */
    getWeatherMessage() {
        if (this.weather === 'Rain') {
            return this.season === 3 ? 'Snowing!' : 'Raining!';
        }
        return 'Sunny';
    }

    /**
     * Consume energy for an action
     * @param {number} amount 
     * @returns {boolean} Whether action was possible
     */
    consumeEnergy(amount) {
        if (this.energy >= amount) {
            this.energy -= amount;
            return true;
        }
        return false;
    }

    /**
     * Restore energy (e.g., from sleeping)
     */
    restoreEnergy(amount = this.maxEnergy) {
        this.energy = Math.min(this.energy + amount, this.maxEnergy);
    }

    /**
     * Get energy bar level class
     */
    getEnergyLevel() {
        if (this.energy < 20) return 'low';
        if (this.energy < 50) return 'medium';
        return 'normal';
    }

    /**
     * Serialize for save
     */
    serialize() {
        return {
            dayTime: this.dayTime,
            dayLength: this.dayLength,
            dayCount: this.dayCount,
            season: this.season,
            weather: this.weather,
            energy: this.energy,
            maxEnergy: this.maxEnergy
        };
    }

    /**
     * Create from serialized data
     */
    static deserialize(data) {
        return new TimeSystem(data);
    }
}

export default TimeSystem;
