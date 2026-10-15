// js/dispatch/dispatcher.js

import { discord } from "./discord.js";
import { whatsapp } from "./whatsapp.js";
import { telegram } from "./telegram.js";
import { sms } from "./sms.js";

export class Dispatcher {
    constructor({ getSettings }) {
        this.getSettings = getSettings;
    }

    async dispatch({ platform, scope, history, latest, onProgress }) {
        const payload = scope === "latest" ? (latest ? [latest] : []) : history;

        if (!payload || !payload.length) {
            throw new Error("هیچ بارکۆدێک نییە بۆ ناردن.");
        }

        const settings = this.getSettings();

        switch (platform) {
            case "whatsapp":
                return whatsapp.open(settings.whatsappNumber, payload);

            case "telegram":
                return telegram.open(payload);

            case "sms":
                return sms.open(settings.whatsappNumber, payload);

            case "discord": {
                const webhook = settings.discordWebhook;

                if (!webhook) {
                    const error = new Error("تکایە لە بەشی ڕێکخستنەکان Discord Webhook دابین بکە.");
                    error.code = "MISSING_WEBHOOK";
                    throw error;
                }

                if (scope === "latest") {
                    const target = latest?.barcode ?? latest;
                    return discord.sendOne(webhook, target);
                }

                return discord.sendSequential(webhook, payload, onProgress);
            }

            default:
                throw new Error(`پلاتفۆرمی نەناسراو: ${platform}`);
        }
    }
}