// js/ui/router.js

export class ViewRouter {
    constructor() {
        this.views = {
            scanner: document.getElementById("scannerView"),
            settings: document.getElementById("settingsView")
        };
    }

    show(viewName) {
        Object.entries(this.views).forEach(([name, element]) => {
            const active = name === viewName;

            element.classList.toggle("active-view", active);
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    showScanner() {
        this.show("scanner");
    }

    showSettings() {
        this.show("settings");
    }
}