// js/config.js

export const APP_CONFIG = Object.freeze({
    storage: Object.freeze({
        history: "barcode_dispatch_history_v1",
        settings: "barcode_dispatch_settings_v1"
    }),

    defaults: Object.freeze({
        whatsappNumber: "",
        discordWebhook: "",
        theme: "system"
    }),

    scanner: Object.freeze({
        elementId: "reader",
        fps: 15,
        qrboxRatio: 0.75,
        stabilityDelay: 350,
        consecutiveDuplicateLimit: 3,
        duplicateCooldownMs: 1000
    }),

    history: Object.freeze({
        maxItems: 30
    }),

    dispatch: Object.freeze({
        discordDelay: 300,
        whatsappCountryCode: "964"
    }),

    pwa: Object.freeze({
        cacheName: "barcode-dispatch-v2"
    })
});