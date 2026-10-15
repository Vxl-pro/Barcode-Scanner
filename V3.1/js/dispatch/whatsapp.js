// js/dispatch/whatsapp.js

import { normalizePhoneNumber } from "../core/utils.js";

export const whatsapp = {
    buildUrl(number, barcodes) {
        const phone = normalizePhoneNumber(number);

        const values = (Array.isArray(barcodes) ? barcodes : [barcodes])
            .map((item) => (typeof item === "object" && item !== null ? item.barcode : item))
            .filter(Boolean);

        if (!values.length) {
            throw new Error("هیچ بارکۆدێک نییە بۆ ناردن.");
        }

        const message = values.length === 1
            ? `بارکۆد:\n${values[0]}`
            : `لیستی بارکۆدەکان (${values.length}):\n${values.join("\n")}`;

        if (phone) {
            return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }

        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    },

    open(number, barcodes) {
        const url = this.buildUrl(number, barcodes);

        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

        return url;
    }
};