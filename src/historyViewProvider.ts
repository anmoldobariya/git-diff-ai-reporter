// FILE: src/historyViewProvider.ts

import * as vscode from "vscode";
import { HistoryManager, HistoryEntry } from "./historyManager";

/**
 * Clean history panel - list of past reports only
 */
export class HistoryViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private onReportLoadCallback?: (reportContent: string) => Promise<void>;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly historyManager: HistoryManager
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    this.updateWebview();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "loadReport":
          await this.handleLoadReport(data.historyId);
          break;
        case "deleteReport":
          await this.handleDeleteReport(data.historyId);
          break;
        case "clearHistory":
          await this.handleClearHistory();
          break;
      }
    });
  }

  public onReportLoad(callback: (reportContent: string) => Promise<void>) {
    this.onReportLoadCallback = callback;
  }

  private async handleLoadReport(historyId: string) {
    try {
      const entry = await this.historyManager.loadEntry(historyId);
      if (entry && this.onReportLoadCallback) {
        await this.onReportLoadCallback(entry.reportContent);
        vscode.window.showInformationMessage("✓ Report loaded");
      }
    } catch (error) {
      vscode.window.showErrorMessage("Failed to load report.");
    }
  }

  private async handleDeleteReport(historyId: string) {
    try {
      const confirm = await vscode.window.showWarningMessage(
        "Delete this report?",
        { modal: true },
        "Delete"
      );

      if (confirm === "Delete") {
        await this.historyManager.deleteEntry(historyId);
        await this.updateWebview();
        vscode.window.showInformationMessage("✓ Report deleted");
      }
    } catch (error) {
      vscode.window.showErrorMessage("Failed to delete report.");
    }
  }

  private async handleClearHistory() {
    try {
      const confirm = await vscode.window.showWarningMessage(
        "Clear all history? This cannot be undone.",
        { modal: true },
        "Clear All"
      );

      if (confirm === "Clear All") {
        await this.historyManager.clearHistory();
        await this.updateWebview();
        vscode.window.showInformationMessage("✓ History cleared");
      }
    } catch (error) {
      vscode.window.showErrorMessage("Failed to clear history.");
    }
  }

  public async refresh() {
    await this.updateWebview();
  }

  private async updateWebview() {
    if (this._view) {
      this._view.webview.html = await this.getHtmlForWebview(
        this._view.webview
      );
    }
  }

  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    const history = await this.historyManager.loadHistory();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>History</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            padding: 16px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }

        .clear-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
        }

        .clear-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .history-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .history-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
            transform: translateX(2px);
        }

        .item-date {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 4px;
        }

        .item-summary {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .item-meta {
            font-size: 9px;
            color: var(--vscode-descriptionForeground);
            font-family: 'Consolas', monospace;
        }

        .item-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .action-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 9px;
            font-weight: 500;
        }

        .action-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .action-btn.delete {
            background: var(--vscode-errorForeground);
            color: white;
        }

        .action-btn.delete:hover {
            opacity: 0.9;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
            opacity: 0.5;
        }

        .empty-text {
            font-size: 13px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="header">
        ${
          history.length > 0
            ? '<button class="clear-btn" onclick="clearAll()">Clear All</button>'
            : ""
        }
    </div>

    ${
      history.length > 0
        ? `
    <div class="history-list">
        ${history
          .map(
            (entry) => `
        <div class="history-item">
            <div class="item-date">${this.formatDate(entry.timestamp)}</div>
            <div class="item-summary">${this.getSummary(entry)}</div>
            <div class="item-meta">${entry.filesChanged} files changed</div>
            <div class="item-actions">
                <button class="action-btn" onclick="loadReport('${
                  entry.id
                }')">📖 Open</button>
                <button class="action-btn delete" onclick="deleteReport('${
                  entry.id
                }')">🗑️ Delete</button>
            </div>
        </div>
        `
          )
          .join("")}
    </div>
    `
        : `
    <div class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">
            No reports in history yet.<br>
            Generate your first report to see it here.
        </div>
    </div>
    `
    }

    <script>
        const vscode = acquireVsCodeApi();

        function loadReport(historyId) {
            vscode.postMessage({ type: 'loadReport', historyId: historyId });
        }

        function deleteReport(historyId) {
            vscode.postMessage({ type: 'deleteReport', historyId: historyId });
        }

        function clearAll() {
            vscode.postMessage({ type: 'clearHistory' });
        }
    </script>
</body>
</html>`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    }
    if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  }

  private getSummary(entry: HistoryEntry): string {
    // Extract first meaningful line from report
    const lines = entry.reportContent
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
        if (trimmed.length > 100) {
          return trimmed.substring(0, 100) + "...";
        }
        return trimmed;
      }
    }

    return entry.diffSummary || "Analysis report";
  }

  public dispose() {}
}
