
export const LOOKUP_LIMIT = 10;
export const RESET_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface LookupStats {
    periodCount: number;
    totalCount: number;
    lastReset: number;
    daysUntilReset: number;
    limitReached: boolean;
}

const getKeys = (userId: string) => ({
    period: `designMatch_lookup_count_week_${userId}`,
    total: `designMatch_lookupCount_${userId}`,
    reset: `designMatch_lookup_lastReset_${userId}`
});

export const getLookupStats = (userId: string): LookupStats => {
    const keys = getKeys(userId);
    const now = Date.now();

    let periodCount = parseInt(localStorage.getItem(keys.period) || "0");
    const totalCount = parseInt(localStorage.getItem(keys.total) || "0");
    let lastReset = parseInt(localStorage.getItem(keys.reset) || "0");

    // Proactive reset check
    if (lastReset === 0 || (now - lastReset >= RESET_PERIOD)) {
        periodCount = 0;
        lastReset = now;
        localStorage.setItem(keys.period, "0");
        localStorage.setItem(keys.reset, now.toString());
    }

    const timeLeft = Math.max(0, (lastReset + RESET_PERIOD) - now);
    const daysUntilReset = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

    return {
        periodCount,
        totalCount,
        lastReset,
        daysUntilReset,
        limitReached: periodCount >= LOOKUP_LIMIT
    };
};

export const incrementLookup = (userId: string) => {
    const keys = getKeys(userId);
    const stats = getLookupStats(userId);

    localStorage.setItem(keys.period, (stats.periodCount + 1).toString());
    localStorage.setItem(keys.total, (stats.totalCount + 1).toString());
};
