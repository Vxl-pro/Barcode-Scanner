// js/app.js

import { APP_CONFIG } from "./config.js";
import { storage } from "./core/storage.js";
import {
    state,
    setSettings,
    setLatestBarcode
} from "./core/state.js";
import {
    escapeHtml,
    formatTime
} from "./core/utils.js";

import { HistoryManager } from "./history/history.js";
import { BarcodeScanner } from "./scanner/scanner.js";
import { Dispatcher } from "./dispatch/dispatcher.js";

import { ViewRouter } from "./ui/router.js";
import { ModalManager } from "./ui/modal.js";
import { ToastManager } from "./ui/toast.js";
import { SettingsUI } from "./ui/settings-ui.js";

import { scannerBeep, warningBeep, unlockAudio } from "../assets/sounds/beep.js";

class App {
    #selectedPlatform = "whatsapp";
    #selectedScope = "all";

    // Smart Duplicate Cooldown Engine state
    #lastScannedBarcode = null;
    #consecutiveDuplicateCount = 0;
    #isCooldownLocked = false;
    #cooldownTimer = null;

    constructor() {
        this.history = new HistoryManager();

        this.router = new ViewRouter();
        this.modal = new ModalManager();
        this.toast = new ToastManager();

        this.dispatcher = new Dispatcher({
            getSettings: () => state.settings
        });

        this.settingsUI = null;
        this.scanner = null;
    }

    async init() {
        this.#applyTheme();
        this.#setupSettings();
        this.#setupScanner();
        this.#setupNavigation();
        this.#setupHistory();
        this.#setupDispatch();
        this.#renderHistory();
        this.#renderLatest();
        this.#registerServiceWorker();

        // Unlock Web Audio context on initial user action
        window.addEventListener("pointerdown", () => unlockAudio(), { once: true, passive: true });

        window.addEventListener("beforeunload", () => {
            this.scanner?.stop();
        });
    }

    #setupScanner() {
        this.scanner = new BarcodeScanner({
            elementId: APP_CONFIG.scanner.elementId,

            onBarcode: (barcode) => {
                this.#handleBarcode(barcode);
            },

            onStateChange: (status, error) => {
                this.#handleScannerState(status, error);
            }
        });

        const toggleBtn = document.getElementById("scannerToggleButton");
        toggleBtn.addEventListener("click", async () => {
            await unlockAudio();
            await this.#toggleScanner();
        });
    }

    #setupNavigation() {
        document
            .getElementById("settingsButton")
            .addEventListener("click", () => {
                this.router.showSettings();
            });

        document
            .getElementById("backToScannerButton")
            .addEventListener("click", () => {
                this.router.showScanner();
            });
    }

    #setupHistory() {
        document
            .getElementById("clearHistoryButton")
            .addEventListener("click", async () => {
                if (!this.history.count) {
                    this.toast.info("هیچ مێژوویەک نییە بۆ سڕینەوە.");
                    return;
                }

                const confirmed = await this.modal.confirm({
                    title: "سڕینەوەی مێژوو",
                    message: "هەموو بارکۆدە تۆمارکراوەکانی ئەم ئامێرە دەسڕدرێنەوە و ئەم کردارە ناگەڕێندرێتەوە.",
                    acceptText: "بەڵێ، بیسڕەوە",
                    cancelText: "هەڵوەشاندنەوە"
                });

                if (!confirmed) {
                    return;
                }

                this.history.clear();
                setLatestBarcode(null);
                this.#lastScannedBarcode = null;
                this.#consecutiveDuplicateCount = 0;

                this.#renderHistory();
                this.#renderLatest();

                this.toast.success("مێژووی بارکۆدەکان بە سەرکەوتوویی سڕایەوە.");
            });
    }

    #setupDispatch() {
        const dispatchButton = document.getElementById("dispatchButton");
        const executeButton = document.getElementById("executeDispatchButton");

        // Scope buttons
        const scopeAllBtn = document.getElementById("scopeAllButton");
        const scopeLatestBtn = document.getElementById("scopeLatestButton");

        // Platform cards
        const platformCards = document.querySelectorAll(".platform-card");

        // Open modal
        dispatchButton.addEventListener("click", () => {
            if (!this.history.count) {
                this.toast.info("هیچ بارکۆدێک نییە بۆ ناردن.");
                return;
            }

            this.#updateDispatchModalInfo();
            this.modal.open("dispatchModal");
        });

        // Scope selection handlers
        scopeAllBtn.addEventListener("click", () => {
            this.#setScope("all");
        });

        scopeLatestBtn.addEventListener("click", () => {
            this.#setScope("latest");
        });

        // Platform selection handlers
        platformCards.forEach((card) => {
            card.addEventListener("click", () => {
                const platform = card.dataset.platform;
                this.#setPlatform(platform);
            });
        });

        // Execute dispatch
        executeButton.addEventListener("click", async () => {
            await this.#executeDispatch();
        });
    }

    #setScope(scope) {
        this.#selectedScope = scope;

        const scopeAllBtn = document.getElementById("scopeAllButton");
        const scopeLatestBtn = document.getElementById("scopeLatestButton");

        scopeAllBtn.classList.toggle("active", scope === "all");
        scopeAllBtn.setAttribute("aria-checked", scope === "all" ? "true" : "false");

        scopeLatestBtn.classList.toggle("active", scope === "latest");
        scopeLatestBtn.setAttribute("aria-checked", scope === "latest" ? "true" : "false");
    }

    #setPlatform(platform) {
        this.#selectedPlatform = platform;

        const platformCards = document.querySelectorAll(".platform-card");
        platformCards.forEach((card) => {
            const isMatch = card.dataset.platform === platform;
            card.classList.toggle("active", isMatch);
        });
    }

    #updateDispatchModalInfo() {
        const allCountElem = document.getElementById("scopeAllCount");
        const latestPreviewElem = document.getElementById("scopeLatestPreview");

        const count = this.history.count;
        const latest = this.history.latest;

        allCountElem.textContent = `${count} دانە`;
        latestPreviewElem.textContent = latest ? latest.barcode : "هیچ نییە";

        // Reset default scope to "all" (or "latest" if only 1 item)
        this.#setScope(count === 1 ? "latest" : "all");
        this.#setPlatform(this.#selectedPlatform || "whatsapp");
    }

    async #executeDispatch() {
        const history = this.history.all;
        const latest = this.history.latest;

        if (!history.length) {
            this.toast.info("هیچ بارکۆدێک نییە بۆ ناردن.");
            this.modal.close("dispatchModal");
            return;
        }

        const platform = this.#selectedPlatform;
        const scope = this.#selectedScope;

        this.modal.close("dispatchModal");

        try {
            if (platform === "discord") {
                const total = scope === "latest" ? 1 : history.length;
                this.toast.info(`ناردنی ${total} بارکۆد بۆ Discord دەستی پێکرد...`, 2000);

                await this.dispatcher.dispatch({
                    platform,
                    scope,
                    history,
                    latest,
                    onProgress: ({ current, total: progTotal }) => {
                        this.toast.info(`Discord: ${current} لە ${progTotal}`, 900);
                    }
                });

                this.toast.success("بارکۆدەکان بە سەرکەوتوویی بۆ Discord نێردران.");
            } else {
                await this.dispatcher.dispatch({
                    platform,
                    scope,
                    history,
                    latest
                });

                if (platform === "whatsapp") {
                    this.toast.success("ئەپی WhatsApp کرایەوە.");
                } else if (platform === "telegram") {
                    this.toast.success("ئەپی Telegram کرایەوە.");
                } else if (platform === "sms") {
                    this.toast.success("ئەپی نامە (SMS) کرایەوە.");
                }
            }
        } catch (error) {
            console.error(error);

            if (error.code === "MISSING_WEBHOOK") {
                this.toast.error("تکایە لە بەشی ڕێکخستنەکان Discord Webhook دابین بکە.");
            } else {
                this.toast.error(error.message || "کرداری ناردن سەرکەوتوو نەبوو.");
            }
        }
    }

    #setupSettings() {
        this.settingsUI = new SettingsUI({
            state: state.settings,

            onChange: (changes) => {
                setSettings(changes);
                storage.setSettings(state.settings);
                this.#applyTheme();
            }
        });
    }

    #applyTheme() {
        document.documentElement.dataset.theme =
            state.settings.theme || "system";

        this.settingsUI?.update(state.settings);
    }

    async #toggleScanner() {
        const button = document.getElementById("scannerToggleButton");
        button.disabled = true;

        try {
            await this.scanner.toggle();
        } catch (error) {
            console.error(error);
            this.toast.error(this.#cameraErrorMessage(error));
        } finally {
            button.disabled = false;
        }
    }

    #handleScannerState(status) {
        const statusElement = document.getElementById("scannerStatus");
        const buttonText = document.getElementById("scannerToggleText");
        const placeholder = document.getElementById("cameraPlaceholder");

        statusElement.className = "status-pill";

        if (status === "starting") {
            statusElement.classList.add("scanning");
            statusElement.innerHTML = "<i></i> چالاککردنی کامێرا...";
            buttonText.textContent = "چاوەڕێ بکە...";
            return;
        }

        if (status === "scanning") {
            statusElement.classList.add("scanning");
            statusElement.innerHTML = "<i></i> سکانکردن چالاکە";
            buttonText.textContent = "ڕاگرتنی سکانکردن";
            placeholder.classList.add("hidden");
            return;
        }

        if (status === "error") {
            statusElement.classList.add("error");
            statusElement.innerHTML = "<i></i> هەڵەی کامێرا";
            buttonText.textContent = "دووبارە هەوڵبدەرەوە";
            placeholder.classList.remove("hidden");
            return;
        }

        statusElement.classList.add("ready");
        statusElement.innerHTML = "<i></i> ئامادەیە";
        buttonText.textContent = "دەستپێکردنی سکانکردن";
        placeholder.classList.remove("hidden");
    }

    /**
     * Smart Duplicate Cooldown Engine & Scan Execution
     * - Track consecutive scans of identical duplicate barcodes.
     * - If scanned > 3 times consecutively, trigger distinct warning alert and 1s lock.
     * - Ensure crisp audio beep on every successful scan execution.
     */
    async #handleBarcode(barcode) {
        // 1. If currently in cooldown lock, ignore frame completely
        if (this.#isCooldownLocked) {
            return;
        }

        // 2. Track consecutive identical scans
        if (barcode === this.#lastScannedBarcode) {
            this.#consecutiveDuplicateCount += 1;
        } else {
            this.#lastScannedBarcode = barcode;
            this.#consecutiveDuplicateCount = 1;
        }

        // 3. Cooldown Threshold Check (> 3 consecutive duplicate scans)
        if (this.#consecutiveDuplicateCount > APP_CONFIG.scanner.consecutiveDuplicateLimit) {
            // Trigger distinct warning audio feedback
            await warningBeep();

            // Distinct warning toast
            this.toast.warning("ئاگاداری: بارکۆدی دووبارە زیاتر لە ٣ جار بەدوای یەکدا سکانکرا! سکانەر بۆ ١ چرکە ڕاگیرا.", 2600);

            // Temporarily lock scanner for 1000ms cooldown
            this.#activateCooldown(APP_CONFIG.scanner.duplicateCooldownMs);
            return;
        }

        // 4. Reliable Audio Feedback: Play crisp beep on every successful scan execution
        await scannerBeep();

        // 5. Handle duplicate in history
        const isDuplicate = this.history.has(barcode);

        if (isDuplicate) {
            await this.#copyToClipboard(barcode);
            this.toast.info(`ئەم بارکۆدە پێشتر تۆمارکراوە (دووبارە: ${this.#consecutiveDuplicateCount})`);
            return;
        }

        // 6. Add new unique barcode to history
        const result = this.history.add(barcode);

        if (!result.added) {
            return;
        }

        setLatestBarcode(result.item);

        await this.#copyToClipboard(barcode);

        this.#renderHistory();
        this.#renderLatest();

        this.toast.success("بارکۆد کۆپیکرا و تۆمارکرا.");
    }

    /**
     * Activates 1000ms cooldown lock on the scanner
     */
    #activateCooldown(durationMs = 1000) {
        this.#isCooldownLocked = true;

        const viewport = document.getElementById("scannerViewport");
        const statusElement = document.getElementById("scannerStatus");

        viewport?.classList.add("cooldown-active");

        if (statusElement) {
            statusElement.className = "status-pill warning";
            statusElement.innerHTML = "<i></i> ساردبوونەوە (١ چرکە)";
        }

        if (this.#cooldownTimer) {
            clearTimeout(this.#cooldownTimer);
        }

        this.#cooldownTimer = setTimeout(() => {
            this.#isCooldownLocked = false;
            this.#consecutiveDuplicateCount = 0; // Reset consecutive counter after cooldown
            viewport?.classList.remove("cooldown-active");

            if (this.scanner?.running) {
                statusElement.className = "status-pill scanning";
                statusElement.innerHTML = "<i></i> سکانکردن چالاکە";
            } else {
                statusElement.className = "status-pill ready";
                statusElement.innerHTML = "<i></i> ئامادەیە";
            }
        }, durationMs);
    }

    async #copyToClipboard(value) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
                return true;
            }
        } catch {
            // Fallback below
        }

        try {
            const textarea = document.createElement("textarea");
            textarea.value = value;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            textarea.style.pointerEvents = "none";

            document.body.appendChild(textarea);
            textarea.select();

            const copied = document.execCommand("copy");
            textarea.remove();
            return copied;
        } catch {
            return false;
        }
    }

    #renderLatest() {
        const element = document.getElementById("latestBarcode");
        const latest = this.history.latest;

        if (!latest) {
            element.className = "latest-barcode empty";
            element.textContent = "هیچ بارکۆدێک تۆمار نەکراوە";
            return;
        }

        element.className = "latest-barcode";
        element.textContent = latest.barcode;
    }

    #renderHistory() {
        const list = document.getElementById("historyList");
        const empty = document.getElementById("historyEmpty");
        const count = document.getElementById("historyCount");

        const items = this.history.all;

        count.textContent = String(items.length);
        list.innerHTML = "";

        empty.classList.toggle("hidden", items.length > 0);

        items.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "history-item";

            row.innerHTML = `
                <span class="history-index">
                    ${String(index + 1).padStart(2, "0")}
                </span>

                <span class="history-value">
                    ${escapeHtml(item.barcode)}
                </span>

                <time class="history-time">
                    ${escapeHtml(formatTime(item.timestamp))}
                </time>
            `;

            list.appendChild(row);
        });
    }

    #cameraErrorMessage(error) {
        const message = String(error?.message ?? "").toLowerCase();

        if (
            message.includes("permission") ||
            message.includes("notallowed")
        ) {
            return "ڕێگەپێدانی کامێرا پێویستە چالاک بکرێت.";
        }

        if (
            message.includes("secure") ||
            message.includes("https")
        ) {
            return "کامێرا پێویستی بە بەستەری پارێزراو (HTTPS) هەیە.";
        }

        if (
            message.includes("notfound") ||
            message.includes("camera")
        ) {
            return "هیچ کامێرایەک نەدۆزرایەوە.";
        }

        return "نەتوانرا کامێرا دەستپێبکرێت.";
    }

    #registerServiceWorker() {
        if ("serviceWorker" in navigator && window.isSecureContext) {
            navigator.serviceWorker
                .register("./sw.js")
                .catch((error) => {
                    console.warn("Service Worker registration failed:", error);
                });
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const app = new App();
    await app.init();
});