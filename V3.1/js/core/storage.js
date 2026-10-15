// js/core/storage.js

import { APP_CONFIG } from "../config.js";

const safeParse = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const read = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return safeParse(value, fallback);
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

const remove = (key) => {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
};

export const storage = {
    getHistory() {
        const history = read(APP_CONFIG.storage.history, []);

        if (!Array.isArray(history)) {
            return [];
        }

        return history;
    },

    setHistory(history) {
        return write(APP_CONFIG.storage.history, history);
    },

    clearHistory() {
        return remove(APP_CONFIG.storage.history);
    },

    getSettings() {
        const saved = read(APP_CONFIG.storage.settings, {});

        return {
            ...APP_CONFIG.defaults,
            ...(saved && typeof saved === "object" ? saved : {})
        };
    },

    setSettings(settings) {
        return write(APP_CONFIG.storage.settings, settings);
    }
};