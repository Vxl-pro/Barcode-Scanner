// js/ui/toast.js

export class ToastManager {
    constructor(containerId = "toastContainer") {
        this.container = document.getElementById(containerId);
    }

    show(message, type = "default", duration = 2600) {
        if (!this.container) {
            return;
        }

        const toast = document.createElement("div");

        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add("out");

            window.setTimeout(() => {
                toast.remove();
            }, 200);
        }, duration);
    }

    success(message) {
        this.show(message, "success");
    }

    error(message, duration = 3200) {
        this.show(message, "error", duration);
    }

    warning(message, duration = 3000) {
        this.show(message, "warning", duration);
    }

    info(message) {
        this.show(message);
    }
}