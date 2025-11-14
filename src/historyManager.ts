// FILE: src/historyManager.ts

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  date: string;
  reportContent: string;
  diffSummary: string;
  filesChanged: number;
}

export class HistoryManager {
  private historyDir: string;

  constructor() {
    const baseDir = path.join(os.homedir(), ".vscode-ai-git-reporter");
    this.historyDir = path.join(baseDir, "history");
  }

  /**
   * Initialize the history directory
   */
  async initialize(): Promise<void> {
    try {
      if (!fs.existsSync(this.historyDir)) {
        fs.mkdirSync(this.historyDir, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to initialize history manager: ${error}`);
    }
  }

  /**
   * Save a new report to history
   */
  async saveReport(
    reportContent: string,
    diffSummary: string,
    filesChanged: number
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const id = `report-${timestamp}`;
      const date = new Date(timestamp).toISOString();

      const entry: HistoryEntry = {
        id,
        timestamp,
        date,
        reportContent,
        diffSummary,
        filesChanged
      };

      const filePath = path.join(this.historyDir, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), "utf-8");

      return id;
    } catch (error) {
      throw new Error(`Failed to save report to history: ${error}`);
    }
  }

  /**
   * Load all history entries
   */
  async loadHistory(): Promise<HistoryEntry[]> {
    try {
      if (!fs.existsSync(this.historyDir)) {
        await this.initialize();
        return [];
      }

      const files = fs
        .readdirSync(this.historyDir)
        .filter((file) => file.endsWith(".json"))
        .sort((a, b) => {
          // Sort by timestamp descending (newest first)
          const aTime = parseInt(a.replace("report-", "").replace(".json", ""));
          const bTime = parseInt(b.replace("report-", "").replace(".json", ""));
          return bTime - aTime;
        });

      const entries: HistoryEntry[] = [];
      for (const file of files) {
        try {
          const filePath = path.join(this.historyDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const entry = JSON.parse(content) as HistoryEntry;
          entries.push(entry);
        } catch (error) {
          console.error(`Failed to load history entry ${file}:`, error);
        }
      }

      return entries;
    } catch (error) {
      throw new Error(`Failed to load history: ${error}`);
    }
  }

  /**
   * Load a specific history entry by ID
   */
  async loadEntry(id: string): Promise<HistoryEntry | null> {
    try {
      const filePath = path.join(this.historyDir, `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as HistoryEntry;
    } catch (error) {
      throw new Error(`Failed to load history entry: ${error}`);
    }
  }

  /**
   * Delete a history entry
   */
  async deleteEntry(id: string): Promise<void> {
    try {
      const filePath = path.join(this.historyDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to delete history entry: ${error}`);
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    try {
      if (!fs.existsSync(this.historyDir)) {
        return;
      }

      const files = fs
        .readdirSync(this.historyDir)
        .filter((file) => file.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(this.historyDir, file);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(`Failed to clear history: ${error}`);
    }
  }

  /**
   * Get history count
   */
  async getHistoryCount(): Promise<number> {
    try {
      if (!fs.existsSync(this.historyDir)) {
        return 0;
      }

      const files = fs
        .readdirSync(this.historyDir)
        .filter((file) => file.endsWith(".json"));

      return files.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get the history directory path
   */
  getHistoryDirectory(): string {
    return this.historyDir;
  }

  /**
   * Format a date for display
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /**
   * Get a short summary from report content
   */
  getShortSummary(reportContent: string, maxLength: number = 100): string {
    // Extract first meaningful line from report
    const lines = reportContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip markdown headers and separators
      if (
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("---") &&
        trimmed.length > 10
      ) {
        if (trimmed.length > maxLength) {
          return trimmed.substring(0, maxLength) + "...";
        }
        return trimmed;
      }
    }

    return "Analysis Report";
  }
}
