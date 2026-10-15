// js/scanner/debounce.js

export class StabilityDebounce {
    #timer = null;
    #token = 0;

    constructor(delay = 400) {
        this.delay = delay;
    }

    schedule(callback) {
        this.cancel();

        const token = ++this.#token;

        this.#timer = window.setTimeout(() => {
            if (token !== this.#token) {
                return;
            }

            this.#timer = null;
            callback();
        }, this.delay);
    }

    cancel() {
        if (this.#timer !== null) {
            window.clearTimeout(this.#timer);
            this.#timer = null;
        }

        ++this.#token;
    }
}