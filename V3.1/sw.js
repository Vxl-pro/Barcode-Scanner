// sw.js

const CACHE_NAME = "barcode-dispatch-v2";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",

    "./css/variables.css",
    "./css/base.css",
    "./css/components.css",
    "./css/scanner.css",
    "./css/settings.css",
    "./css/responsive.css",

    "./js/app.js",
    "./js/config.js",

    "./js/core/storage.js",
    "./js/core/state.js",
    "./js/core/utils.js",

    "./js/scanner/scanner.js",
    "./js/scanner/camera.js",
    "./js/scanner/debounce.js",

    "./js/history/history.js",

    "./js/dispatch/dispatcher.js",
    "./js/dispatch/discord.js",
    "./js/dispatch/whatsapp.js",
    "./js/dispatch/telegram.js",
    "./js/dispatch/sms.js",

    "./js/ui/router.js",
    "./js/ui/modal.js",
    "./js/ui/toast.js",
    "./js/ui/settings-ui.js",

    "./assets/sounds/beep.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                if (
                    !response ||
                    response.status !== 200 ||
                    response.type !== "basic"
                ) {
                    return response;
                }

                const clone = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, clone);
                });

                return response;
            });
        })
    );
});