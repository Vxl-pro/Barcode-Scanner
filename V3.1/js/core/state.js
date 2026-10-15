// js/core/state.js

import { APP_CONFIG } from "../config.js";
import { storage } from "./storage.js";

const createInitialState = () => ({
    history: storage.getHistory(),
    settings: storage.getSettings(),

    scanner: {
        running: false,
        starting: false,
        stopping: false
    },

    latestBarcode: null
});

export const state = createInitialState();

export function setHistory(history) {
    state.history = history.slice(0, APP_CONFIG.history.maxItems);
}

export function setSettings(settings) {
    state.settings = {
        ...state.settings,
        ...settings
    };
}

export function setLatestBarcode(barcode) {
    state.latestBarcode = barcode;
}