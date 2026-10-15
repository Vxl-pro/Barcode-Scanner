// js/scanner/camera.js

import { APP_CONFIG } from "../config.js";

export class CameraController {
    #scanner = null;
    #running = false;
    #starting = false;
    #stopping = false;

    constructor(elementId) {
        this.elementId = elementId;
    }

    get running() {
        return this.#running;
    }

    async start(onSuccess, onError) {
        if (this.#running || this.#starting) {
            return;
        }

        if (typeof window.Html5Qrcode === "undefined") {
            throw new Error("html5-qrcode library is not loaded.");
        }

        this.#starting = true;

        try {
            await this.stop();

            this.#scanner = new Html5Qrcode(this.elementId, {
                verbose: false
            });

            const qrbox = (viewfinderWidth, viewfinderHeight) => {
                const size = Math.floor(
                    Math.min(viewfinderWidth, viewfinderHeight) *
                    APP_CONFIG.scanner.qrboxRatio
                );

                return {
                    width: Math.max(180, size),
                    height: Math.max(120, size * 0.72)
                };
            };

            await this.#scanner.start(
                {
                    facingMode: {
                        exact: "environment"
                    }
                },
                {
                    fps: APP_CONFIG.scanner.fps,
                    qrbox,
                    aspectRatio: 1
                },
                onSuccess,
                onError
            );

            this.#running = true;
        } catch (error) {
            await this.#cleanup();

            throw error;
        } finally {
            this.#starting = false;
        }
    }

    async stop() {
        if (this.#stopping) {
            return;
        }

        this.#stopping = true;

        try {
            await this.#cleanup();
        } finally {
            this.#stopping = false;
        }
    }

    async #cleanup() {
        const scanner = this.#scanner;

        if (!scanner) {
            this.#running = false;
            return;
        }

        try {
            if (this.#running || scanner.getState?.() === 2) {
                await scanner.stop();
            }
        } catch {
            // Cleanup must continue even if stop() rejects.
        }

        try {
            await scanner.clear();
        } catch {
            // clear() can reject if the scanner already released itself.
        }

        this.#scanner = null;
        this.#running = false;
    }
}