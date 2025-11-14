// FILE: src/groqUsageManager.ts

import * as vscode from "vscode";
import {
  ModelLimits,
  getLimitsForModel,
  isRateLimited,
  getSecondsUntilReset
} from "./limits";

/**
 * Global usage state for Groq API
 */
export interface GroqUsageState {
  model: string;

  tokensUsedThisMinute: number;
  tokensUsedToday: number;

  requestsUsedThisMinute: number;
  requestsUsedToday: number;

  minuteResetAt: number; // Unix timestamp
  dayResetAt: number; // Unix timestamp (midnight)
}

/**
 * Manager for tracking and enforcing Groq API usage limits
 */
export class GroqUsageManager {
  private context: vscode.ExtensionContext;
  private updateCallbacks: Array<() => void> = [];
  private resetTimer?: NodeJS.Timeout;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeUsageState();
    this.startResetTimer();
  }

  /**
   * Initialize usage state with defaults
   */
  private initializeUsageState(): void {
    const existing = this.getUsageState();

    if (!existing) {
      const now = Date.now();
      const initialState: GroqUsageState = {
        model: "llama-3.3-70b-versatile",
        tokensUsedThisMinute: 0,
        tokensUsedToday: 0,
        requestsUsedThisMinute: 0,
        requestsUsedToday: 0,
        minuteResetAt: now + 60000, // 1 minute from now
        dayResetAt: this.getNextMidnight()
      };

      this.context.globalState.update("groqUsage", initialState);
    } else {
      // Check if resets are needed
      this.checkAndResetCounters();
    }
  }

  /**
   * Get current usage state
   */
  public getUsageState(): GroqUsageState | undefined {
    return this.context.globalState.get<GroqUsageState>("groqUsage");
  }

  /**
   * Update usage state
   */
  private async updateUsageState(state: GroqUsageState): Promise<void> {
    await this.context.globalState.update("groqUsage", state);
    this.notifyUpdates();
  }

  /**
   * Get next midnight timestamp
   */
  private getNextMidnight(): number {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Check if counters need to be reset
   */
  private checkAndResetCounters(): void {
    const state = this.getUsageState();
    if (!state) {
      return;
    }

    const now = Date.now();
    let updated = false;

    // Reset minute counters
    if (now >= state.minuteResetAt) {
      state.tokensUsedThisMinute = 0;
      state.requestsUsedThisMinute = 0;
      state.minuteResetAt = now + 60000;
      updated = true;
    }

    // Reset daily counters
    if (now >= state.dayResetAt) {
      state.tokensUsedToday = 0;
      state.requestsUsedToday = 0;
      state.dayResetAt = this.getNextMidnight();
      updated = true;
    }

    if (updated) {
      this.updateUsageState(state);
    }
  }

  /**
   * Start automatic reset timer
   */
  private startResetTimer(): void {
    this.resetTimer = setInterval(() => {
      this.checkAndResetCounters();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Record API usage
   */
  public async recordUsage(
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  ): Promise<void> {
    this.checkAndResetCounters();

    const state = this.getUsageState();
    if (!state) {
      return;
    }

    state.tokensUsedThisMinute += totalTokens;
    state.tokensUsedToday += totalTokens;
    state.requestsUsedThisMinute += 1;
    state.requestsUsedToday += 1;

    await this.updateUsageState(state);
  }

  /**
   * Check if rate limited and enforce wait if needed
   */
  public async enforceLimitsAndWaitIfNeeded(): Promise<void> {
    this.checkAndResetCounters();

    const state = this.getUsageState();
    if (!state) {
      return;
    }

    const limits = getLimitsForModel(state.model);

    if (isRateLimited(state, limits)) {
      const secondsToWait = getSecondsUntilReset(
        state.minuteResetAt,
        state.dayResetAt
      );

      // Show notification
      vscode.window.showWarningMessage(
        `Rate limit reached. Waiting ${secondsToWait} seconds...`
      );

      // Wait
      await new Promise((resolve) => setTimeout(resolve, secondsToWait * 1000));

      // Reset counters after wait
      this.checkAndResetCounters();
    }
  }

  /**
   * Check if currently rate limited
   */
  public isCurrentlyRateLimited(): boolean {
    this.checkAndResetCounters();

    const state = this.getUsageState();
    if (!state) {
      return false;
    }

    const limits = getLimitsForModel(state.model);
    return isRateLimited(state, limits);
  }

  /**
   * Get seconds until next reset
   */
  public getSecondsUntilNextReset(): number {
    const state = this.getUsageState();
    if (!state) {
      return 0;
    }

    return getSecondsUntilReset(state.minuteResetAt, state.dayResetAt);
  }

  /**
   * Get current model limits
   */
  public getCurrentLimits(): ModelLimits {
    const state = this.getUsageState();
    const model = state?.model || "llama-3.3-70b-versatile";
    return getLimitsForModel(model);
  }

  /**
   * Set the current model
   */
  public async setModel(model: string): Promise<void> {
    const state = this.getUsageState();
    if (!state) {
      return;
    }

    state.model = model;
    await this.updateUsageState(state);
  }

  /**
   * Register callback for usage updates
   */
  public onUpdate(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyUpdates(): void {
    this.updateCallbacks.forEach((cb) => cb());
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
    }
  }
}
