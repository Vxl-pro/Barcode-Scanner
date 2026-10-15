// js/history/history.js

import { APP_CONFIG } from "../config.js";
import { storage } from "../core/storage.js";
import { normalizeBarcode } from "../core/utils.js";
import { state, setHistory } from "../core/state.js";

export class HistoryManager {
    get all() {
        return state.history;
    }

    get latest() {
        return state.history[0] ?? null;
    }

    get count() {
        return state.history.length;
    }

    has(barcode) {
        const normalized = normalizeBarcode(barcode);

        return state.history.some(
            (item) => item.barcode === normalized
        );
    }

    add(barcode) {
        const normalized = normalizeBarcode(barcode);

        if (!normalized || this.has(normalized)) {
            return {
                added: false,
                duplicate: this.has(normalized)
            };
        }

        const item = {
            barcode: normalized,
            timestamp: Date.now()
        };

        const next = [
            item,
            ...state.history
        ].slice(0, APP_CONFIG.history.maxItems);

        setHistory(next);
        storage.setHistory(next);

        return {
            added: true,
            duplicate: false,
            item
        };
    }

    clear() {
        setHistory([]);
        storage.clearHistory();
    }
}