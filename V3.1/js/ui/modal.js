// js/ui/modal.js

export class ModalManager {
    #modals = new Map();
    #confirmResolver = null;

    constructor() {
        document.querySelectorAll(".modal-backdrop").forEach((element) => {
            const id = element.id;

            if (id) {
                this.#modals.set(id, element);

                element.addEventListener("click", (event) => {
                    if (event.target === element) {
                        this.close(id);
                    }
                });
            }
        });

        document.querySelectorAll("[data-close-modal]").forEach((button) => {
            button.addEventListener("click", () => {
                this.close(button.dataset.closeModal);
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") {
                return;
            }

            const openModal = [...this.#modals.entries()]
                .find(([, element]) => element.classList.contains("open"));

            if (openModal) {
                this.close(openModal[0]);
            }
        });

        document.getElementById("confirmCancel")
            ?.addEventListener("click", () => {
                this.#resolveConfirm(false);
            });

        document.getElementById("confirmAccept")
            ?.addEventListener("click", () => {
                this.#resolveConfirm(true);
            });
    }

    open(id) {
        const modal = this.#modals.get(id);

        if (!modal) {
            return;
        }

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
    }

    close(id) {
        const modal = this.#modals.get(id);

        if (!modal) {
            return;
        }

        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
    }

    confirm({
        title = "دڵنیایت؟",
        message = "ئەم کردارە ناتوانرێت بگەڕێندرێتەوە.",
        acceptText = "بەڵێ",
        cancelText = "هەڵوەشاندنەوە"
    } = {}) {
        const titleElement = document.getElementById("confirmTitle");
        const messageElement = document.getElementById("confirmMessage");
        const acceptButton = document.getElementById("confirmAccept");
        const cancelButton = document.getElementById("confirmCancel");

        titleElement.textContent = title;
        messageElement.textContent = message;
        acceptButton.textContent = acceptText;
        cancelButton.textContent = cancelText;

        this.open("confirmModal");

        return new Promise((resolve) => {
            this.#confirmResolver = resolve;
        });
    }

    #resolveConfirm(value) {
        this.close("confirmModal");

        const resolver = this.#confirmResolver;

        this.#confirmResolver = null;

        resolver?.(value);
    }
}