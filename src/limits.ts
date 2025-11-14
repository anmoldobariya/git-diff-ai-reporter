// FILE: src/limits.ts

/**
 * Groq API rate limits for different models
 * Source: https://console.groq.com/docs/rate-limits
 */
export interface ModelLimits {
  rpm: number; // Requests per minute
  rpd: number; // Requests per day
  tpm: number; // Tokens per minute
  tpd: number; // Tokens per day
}

export const MODEL_LIMITS: Record<string, ModelLimits> = {
  "llama-3.3-70b-versatile": {
    rpm: 30,
    rpd: 14400,
    tpm: 6000,
    tpd: 500000
  },
  "llama-3.1-70b-versatile": {
    rpm: 30,
    rpd: 14400,
    tpm: 6000,
    tpd: 500000
  },
  "llama-3.1-8b-instant": {
    rpm: 30,
    rpd: 14400,
    tpm: 20000,
    tpd: 1000000
  },
  "llama3-70b-8192": {
    rpm: 30,
    rpd: 14400,
    tpm: 6000,
    tpd: 500000
  },
  "llama3-8b-8192": {
    rpm: 30,
    rpd: 14400,
    tpm: 20000,
    tpd: 1000000
  },
  "mixtral-8x7b-32768": {
    rpm: 30,
    rpd: 14400,
    tpm: 5000,
    tpd: 500000
  },
  "gemma-7b-it": {
    rpm: 30,
    rpd: 14400,
    tpm: 15000,
    tpd: 500000
  },
  "gemma2-9b-it": {
    rpm: 30,
    rpd: 14400,
    tpm: 15000,
    tpd: 500000
  }
};

/**
 * Get rate limits for a specific model
 * @param model - The model identifier
 * @returns ModelLimits object or default limits if model not found
 */
export function getLimitsForModel(model: string): ModelLimits {
  const limits = MODEL_LIMITS[model];

  if (!limits) {
    console.warn(`No limits found for model: ${model}. Using default limits.`);
    return {
      rpm: 30,
      rpd: 14400,
      tpm: 6000,
      tpd: 500000
    };
  }

  return limits;
}

/**
 * Check if usage exceeds any limit
 * @param usage - Current usage state
 * @param limits - Model limits
 * @returns true if any limit is exceeded
 */
export function isRateLimited(
  usage: {
    tokensUsedThisMinute: number;
    tokensUsedToday: number;
    requestsUsedThisMinute: number;
    requestsUsedToday: number;
  },
  limits: ModelLimits
): boolean {
  return (
    usage.tokensUsedThisMinute >= limits.tpm ||
    usage.tokensUsedToday >= limits.tpd ||
    usage.requestsUsedThisMinute >= limits.rpm ||
    usage.requestsUsedToday >= limits.rpd
  );
}

/**
 * Calculate time until next reset
 * @param minuteResetAt - Timestamp of next minute reset
 * @param dayResetAt - Timestamp of next day reset
 * @returns Seconds until next reset
 */
export function getSecondsUntilReset(
  minuteResetAt: number,
  dayResetAt: number
): number {
  const now = Date.now();
  const secondsUntilMinuteReset = Math.max(
    0,
    Math.ceil((minuteResetAt - now) / 1000)
  );
  const secondsUntilDayReset = Math.max(
    0,
    Math.ceil((dayResetAt - now) / 1000)
  );

  return Math.min(secondsUntilMinuteReset, secondsUntilDayReset);
}
