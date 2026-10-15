// assets/sounds/beep.js

let audioContext = null;

export const getAudioContext = () => {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        audioContext = new AudioContextClass();
    }

    return audioContext;
};

// Unlock AudioContext on first user interaction
export const unlockAudio = async () => {
    try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === "suspended") {
            await ctx.resume();
        }
    } catch {
        // Audio unlock is non-critical
    }
};

if (typeof window !== "undefined") {
    ["click", "touchstart", "keydown"].forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });
}

const tone = (
    context,
    frequency,
    startTime,
    duration,
    volume = 0.2,
    type = "sine"
) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.01);
};

/**
 * Crisp, pleasant POS dual-frequency beep for every successful scan execution
 */
export const scannerBeep = async () => {
    try {
        const context = getAudioContext();

        if (context) {
            if (context.state === "suspended") {
                await context.resume();
            }

            const now = context.currentTime;
            tone(context, 1850, now, 0.065, 0.22, "sine");
            tone(context, 2480, now + 0.05, 0.075, 0.18, "sine");
        }
    } catch {
        // Audio feedback is non-critical.
    }

    try {
        if ("vibrate" in navigator) {
            navigator.vibrate([40, 20, 40]);
        }
    } catch {
        // Vibration is optional.
    }
};

/**
 * Distinct warning alert tone when duplicate threshold is triggered
 */
export const warningBeep = async () => {
    try {
        const context = getAudioContext();

        if (context) {
            if (context.state === "suspended") {
                await context.resume();
            }

            const now = context.currentTime;
            tone(context, 340, now, 0.12, 0.26, "sawtooth");
            tone(context, 260, now + 0.14, 0.18, 0.28, "sawtooth");
        }
    } catch {
        // Audio feedback is non-critical.
    }

    try {
        if ("vibrate" in navigator) {
            navigator.vibrate([120, 60, 140]);
        }
    } catch {
        // Vibration is optional.
    }
};