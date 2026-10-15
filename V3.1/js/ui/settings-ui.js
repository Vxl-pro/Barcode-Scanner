// js/ui/settings-ui.js

export class SettingsUI {
    constructor({
        state,
        onChange
    }) {
        this.state = state;
        this.onChange = onChange;

        this.whatsappInput =
            document.getElementById("whatsappNumber");

        this.discordInput =
            document.getElementById("discordWebhook");

        this.themeButtons =
            [...document.querySelectorAll(".theme-option")];

        this.bind();
        this.render();
    }

    bind() {
        this.whatsappInput.addEventListener(
            "input",
            () => {
                this.onChange({
                    whatsappNumber: this.whatsappInput.value
                });
            }
        );

        this.discordInput.addEventListener(
            "input",
            () => {
                this.onChange({
                    discordWebhook: this.discordInput.value
                });
            }
        );

        this.themeButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.onChange({
                    theme: button.dataset.theme
                });

                this.render();
            });
        });
    }

    render() {
        const {
            whatsappNumber,
            discordWebhook,
            theme
        } = this.state;

        this.whatsappInput.value = whatsappNumber ?? "";
        this.discordInput.value = discordWebhook ?? "";

        document.documentElement.dataset.theme =
            theme || "system";

        this.themeButtons.forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.theme === theme
            );
        });
    }

    update(settings) {
        this.state = settings;
        this.render();
    }
}