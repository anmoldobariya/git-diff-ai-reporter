// FILE: src/usageManager.ts

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface UsageData {
  month: string;
  totalUsed: number;
  promptUsed: number;
  completionUsed: number;
}

export class UsageManager {
  private usageFile: string;
  private currentMonth: string;

  constructor() {
    const baseDir = path.join(os.homedir(), ".vscode-ai-git-reporter");
    this.usageFile = path.join(baseDir, "usage.json");
    this.currentMonth = this.getCurrentMonth();
  }

  /**
   * Initialize the usage tracking system
   */
  async initialize(): Promise<void> {
    try {
      const dir = path.dirname(this.usageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create file if it doesn't exist
      if (!fs.existsSync(this.usageFile)) {
        await this.resetUsage();
      } else {
        // Check if we need to reset for new month
        const data = await this.loadUsage();
        if (data.month !== this.currentMonth) {
          await this.resetUsage();
        }
      }
    } catch (error) {
      throw new Error(`Failed to initialize usage manager: ${error}`);
    }
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  /**
   * Load usage data from file
   */
  async loadUsage(): Promise<UsageData> {
    try {
      if (!fs.existsSync(this.usageFile)) {
        return {
          month: this.currentMonth,
          totalUsed: 0,
          promptUsed: 0,
          completionUsed: 0
        };
      }

      const content = fs.readFileSync(this.usageFile, "utf-8");
      return JSON.parse(content) as UsageData;
    } catch (error) {
      console.error("Error loading usage data:", error);
      return {
        month: this.currentMonth,
        totalUsed: 0,
        promptUsed: 0,
        completionUsed: 0
      };
    }
  }

  /**
   * Update usage with new tokens
   */
  async updateUsage(
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  ): Promise<void> {
    try {
      const data = await this.loadUsage();

      // Check if month has changed
      if (data.month !== this.currentMonth) {
        await this.resetUsage();
        const newData = await this.loadUsage();
        newData.totalUsed = totalTokens;
        newData.promptUsed = promptTokens;
        newData.completionUsed = completionTokens;
        await this.saveUsage(newData);
      } else {
        data.totalUsed += totalTokens;
        data.promptUsed += promptTokens;
        data.completionUsed += completionTokens;
        await this.saveUsage(data);
      }
    } catch (error) {
      console.error("Error updating usage:", error);
    }
  }

  /**
   * Save usage data to file
   */
  private async saveUsage(data: UsageData): Promise<void> {
    try {
      fs.writeFileSync(this.usageFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      throw new Error(`Failed to save usage data: ${error}`);
    }
  }

  /**
   * Reset usage for new month
   */
  async resetUsage(): Promise<void> {
    const data: UsageData = {
      month: this.currentMonth,
      totalUsed: 0,
      promptUsed: 0,
      completionUsed: 0
    };
    await this.saveUsage(data);
  }

  /**
   * Get usage percentage based on quota
   */
  async getUsagePercentage(quotaLimit: number): Promise<number> {
    const data = await this.loadUsage();
    if (quotaLimit <= 0) {
      return 0;
    }
    return Math.min(100, (data.totalUsed / quotaLimit) * 100);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString("en-US");
  }

  /**
   * Get next reset date
   */
  getNextResetDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  /**
   * Get usage summary HTML
   */
  async getUsageSummaryHTML(quotaLimit: number): Promise<string> {
    const data = await this.loadUsage();
    const percentage = await this.getUsagePercentage(quotaLimit);
    const barFilled = Math.round(percentage / 5); // 20 blocks total
    const barEmpty = 20 - barFilled;
    const progressBar = "█".repeat(barFilled) + "░".repeat(barEmpty);

    return `
<div class="usage-section">
    <div class="section-title">TOKEN USAGE</div>
    <div class="usage-bar-container">
        <div class="usage-percentage">Used: ${percentage.toFixed(0)}%</div>
        <div class="usage-bar">${progressBar}</div>
        <div class="usage-numbers">
            ${this.formatNumber(data.totalUsed)} / ${this.formatNumber(
      quotaLimit
    )}
        </div>
        <div class="usage-reset">Resets on ${this.getNextResetDate()}</div>
    </div>
</div>`;
  }
}
