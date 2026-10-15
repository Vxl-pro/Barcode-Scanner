// js/dispatch/discord.js

import { APP_CONFIG } from "../config.js";
import { sleep, safeJsonResponse } from "../core/utils.js";

const makePayload = (barcode) => ({
    content: `\`\`\`\n${barcode}\n\`\`\``,
    allowed_mentions: {
        parse: []
    }
});

const sendOne = async (webhookUrl, barcode) => {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(makePayload(barcode))
    });

    if (!response.ok) {
        const body = await safeJsonResponse(response);

        const error = new Error(
            `Discord request failed with HTTP ${response.status}.`
        );

        error.status = response.status;
        error.body = body;

        throw error;
    }

    return response;
};

export const discord = {
    validateWebhook(url) {
        try {
            const parsed = new URL(url);

            return (
                parsed.protocol === "https:" &&
                parsed.hostname === "discord.com" &&
                parsed.pathname.includes("/api/webhooks/")
            );
        } catch {
            return false;
        }
    },

    async sendOne(webhookUrl, barcode) {
        if (!this.validateWebhook(webhookUrl)) {
            throw new Error("Discord Webhook URL is invalid.");
        }

        return sendOne(webhookUrl, barcode);
    },

    async sendSequential(webhookUrl, barcodes, onProgress) {
        if (!this.validateWebhook(webhookUrl)) {
            throw new Error("Discord Webhook URL is invalid.");
        }

        const values = Array.from(
            new Set(
                barcodes
                    .map((item) => item.barcode ?? item)
                    .filter(Boolean)
            )
        );

        const results = [];

        for (let index = 0; index < values.length; index += 1) {
            const barcode = values[index];

            try {
                const response = await sendOne(
                    webhookUrl,
                    barcode
                );

                results.push({
                    barcode,
                    success: true,
                    response
                });
            } catch (error) {
                results.push({
                    barcode,
                    success: false,
                    error
                });
            }

            onProgress?.({
                current: index + 1,
                total: values.length,
                barcode,
                success: results.at(-1)?.success === true
            });

            if (index < values.length - 1) {
                await sleep(APP_CONFIG.dispatch.discordDelay);
            }
        }

        return results;
    }
};