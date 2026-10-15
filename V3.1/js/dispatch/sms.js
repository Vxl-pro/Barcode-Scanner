// js/dispatch/sms.js

import { normalizePhoneNumber } from "../core/utils.js";

export const sms = {
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

        const isIOS =
            typeof navigator !== "undefined" &&
            /iPad|iPhone|iPod/.test(navigator.userAgent || "");
        const separator = isIOS ? "&" : "?";

        if (phone) {
            return `sms:${phone}${separator}body=${encodeURIComponent(message)}`;
        }

        return `sms:${separator}body=${encodeURIComponent(message)}`;
    },

    open(number, barcodes) {
        const url = this.buildUrl(number, barcodes);

        window.location.href = url;

        return url;
    }
};