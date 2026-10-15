// js/core/utils.js

export const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeBarcode = (value) =>
    String(value ?? "").trim();

export const isValidBarcode = (value) => {
    const barcode = normalizeBarcode(value);

    return barcode.length > 0 && barcode.length <= 128;
};

export const formatTime = (timestamp) => {
    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).format(new Date(timestamp));
    } catch {
        return "";
    }
};

export const escapeHtml = (value) =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export const normalizePhoneNumber = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    if (digits.startsWith("964")) {
        return digits;
    }

    if (digits.startsWith("0")) {
        return `964${digits.slice(1)}`;
    }

    return `964${digits}`;
};

export const safeJsonResponse = async (response) => {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};