// js/dispatch/telegram.js

export const telegram = {
    buildUrl(barcodes) {
        const values = (Array.isArray(barcodes) ? barcodes : [barcodes])
            .map((item) => (typeof item === "object" && item !== null ? item.barcode : item))
            .filter(Boolean);

        if (!values.length) {
            throw new Error("هیچ بارکۆدێک نییە بۆ ناردن.");
        }

        const message = values.length === 1
            ? `بارکۆد:\n${values[0]}`
            : `لیستی بارکۆدەکان (${values.length}):\n${values.join("\n")}`;

        return `https://t.me/share/url?text=${encodeURIComponent(message)}`;
    },

    open(barcodes) {
        const url = this.buildUrl(barcodes);

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

        return url;
    }
};
