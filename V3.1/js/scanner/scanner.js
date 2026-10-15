// js/scanner/scanner.js

import { APP_CONFIG } from "../config.js";
import { StabilityDebounce } from "./debounce.js";
import { CameraController } from "./camera.js";
import { normalizeBarcode, isValidBarcode } from "../core/utils.js";

export class BarcodeScanner {
    #camera;
    #debounce;
    #lastFrame = "";
    #onBarcode;
    #onStateChange;

    constructor({
        elementId = APP_CONFIG.scanner.elementId,
        onBarcode,
        onStateChange
    }) {
        this.#camera = new CameraController(elementId);

        this.#debounce = new StabilityDebounce(
            APP_CONFIG.scanner.stabilityDelay
        );

        this.#onBarcode = onBarcode;
        this.#onStateChange = onStateChange;
    }

    get running() {
        return this.#camera.running;
    }

    async start() {
        if (this.running) {
            return;
        }

        this.#onStateChange?.("starting");

        try {
            await this.#camera.start(
                (decodedText) => this.#handleDecode(decodedText),
                () => {}
            );

            this.#onStateChange?.("scanning");
        } catch (error) {
            this.#onStateChange?.("error", error);
            throw error;
        }
    }

    async stop() {
        this.#debounce.cancel();

        this.#lastFrame = "";

        await this.#camera.stop();

        this.#onStateChange?.("ready");
    }

    async toggle() {
        if (this.running) {
            await this.stop();
        } else {
            await this.start();
        }
    }

    #handleDecode(decodedText) {
        const barcode = normalizeBarcode(decodedText);

        if (!isValidBarcode(barcode)) {
            return;
        }

        if (barcode === this.#lastFrame) {
            return;
        }

        this.#lastFrame = barcode;

        this.#debounce.schedule(() => {
            this.#onBarcode?.(barcode);
            this.#lastFrame = "";
        });
    }
}