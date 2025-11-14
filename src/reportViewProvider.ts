// FILE: src/reportViewProvider.ts

import * as vscode from "vscode";
import { DiffCollector } from "./diffCollector";
import { LLMClient } from "./llm";
import { TemplateManager } from "./templateManager";
import { HistoryManager } from "./historyManager";
import { GroqUsageManager } from "./groqUsageManager";
import { UsageManager } from "./usageManager";
import { ApiKeyManager } from "./apiKeyManager";

/**
 * Clean report generation panel - generate button, template editor, and report output only
 */
export class ReportViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private currentReport: string = "";

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly templateManager: TemplateManager,
    private readonly historyManager: HistoryManager,
    private readonly groqUsageManager: GroqUsageManager,
    private readonly usageManager: UsageManager,
    private readonly apiKeyManager: ApiKeyManager
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
        case "generateReport":
          await this.handleGenerateReport();
          break;
        case "editTemplate":
          await this.handleEditTemplate();
          break;
        case "copyReport":
          vscode.env.clipboard.writeText(this.currentReport);
          vscode.window.showInformationMessage("✓ Report copied to clipboard");
          break;
      }
    });
  }

  private async handleGenerateReport() {
    try {
      // Check API key
      const apiKey = await this.apiKeyManager.getApiKey();
      if (!apiKey) {
        vscode.window.showErrorMessage(
          "Please configure your API key in the Usage Monitor panel first."
        );
        return;
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Generating Report",
          cancellable: false
        },
        async (progress) => {
          // Check rate limits
          progress.report({ message: "Checking rate limits..." });
          await this.groqUsageManager.enforceLimitsAndWaitIfNeeded();

          if (this.groqUsageManager.isCurrentlyRateLimited()) {
            vscode.window.showErrorMessage(
              "Rate limit active. Please wait and try again."
            );
            return;
          }

          // Collect diffs
          progress.report({ message: "Collecting Git changes..." });
          const diffCollector = new DiffCollector();
          const hasChanges = await diffCollector.hasChanges();

          if (!hasChanges) {
            vscode.window.showInformationMessage("No Git changes detected.");
            return;
          }

          const diffs = await diffCollector.collectDiffs();
          const filesChanged = (diffs.match(/--- File:/g) || []).length;

          // Load template
          progress.report({ message: "Loading template..." });
          const template = await this.templateManager.loadTemplate();

          // Analyze with LLM
          progress.report({ message: "Analyzing with AI..." });
          const llmClient = new LLMClient(apiKey);
          const analysisResult = await llmClient.analyzeDiffWithTemplate(
            diffs,
            template
          );

          // Update usage tracking
          if (analysisResult.usage) {
            await this.usageManager.updateUsage(
              analysisResult.usage.promptTokens,
              analysisResult.usage.completionTokens,
              analysisResult.usage.totalTokens
            );

            await this.groqUsageManager.recordUsage(
              analysisResult.usage.promptTokens,
              analysisResult.usage.completionTokens,
              analysisResult.usage.totalTokens
            );
          }

          // Save to history
          progress.report({ message: "Saving to history..." });
          await this.historyManager.saveReport(
            analysisResult.fullReport,
            `Analysis of ${filesChanged} file(s)`,
            filesChanged
          );

          // Display report
          this.currentReport = analysisResult.fullReport;
          await this.updateWebview();
          vscode.window.showInformationMessage(
            "✓ Report generated successfully"
          );
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to generate report: ${errorMessage}`
      );
    }
  }

  private async handleEditTemplate() {
    try {
      const templatePath = this.templateManager.getTemplatePath();
      const doc = await vscode.workspace.openTextDocument(templatePath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage("Failed to open template editor.");
    }
  }

  public async loadReport(reportContent: string) {
    this.currentReport = reportContent;
    await this.updateWebview();
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
    const hasKey = await this.apiKeyManager.hasApiKey();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Generator</title>
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

        .button-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .primary-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .primary-btn:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
            transform: translateY(-1px);
        }

        .primary-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .secondary-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .secondary-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .report-container {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }

        .report-content {
            font-size: 13px;
            line-height: 1.6;
        }

        .report-content h1 {
            font-size: 18px;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
        }

        .report-content h2 {
            font-size: 16px;
            margin: 16px 0 8px 0;
            color: var(--vscode-foreground);
        }

        .report-content h3 {
            font-size: 14px;
            margin: 12px 0 6px 0;
            color: var(--vscode-foreground);
        }

        .report-content p {
            margin-bottom: 10px;
        }

        .report-content code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
        }

        .report-content pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 10px 0;
        }

        .report-content pre code {
            background: none;
            padding: 0;
        }

        .report-content ul, .report-content ol {
            margin-left: 20px;
            margin-bottom: 10px;
        }

        .report-content li {
            margin-bottom: 4px;
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

        .copy-btn {
            position: sticky;
            top: 0;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            margin-bottom: 12px;
            float: right;
        }

        .copy-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="button-group">
        <button class="primary-btn" onclick="generateReport()" ${
          hasKey ? "" : "disabled"
        } id="generateBtn">
            ${hasKey ? "📝 Generate Report" : "⚠️ Configure API Key First"}
        </button>
        <button class="secondary-btn" onclick="editTemplate()">
            ⚙️ Edit Report Template
        </button>
    </div>

    ${
      this.currentReport
        ? `
    <div class="report-container">
        <button class="copy-btn" onclick="copyReport()">📋 Copy</button>
        <div class="report-content">${this.formatMarkdown(
          this.currentReport
        )}</div>
    </div>
    `
        : `
    <div class="report-container">
        <div class="empty-state">
            <div class="empty-icon">📄</div>
            <div class="empty-text">
                No report generated yet.<br>
                Click "Generate Report" to analyze your Git changes.
            </div>
        </div>
    </div>
    `
    }

    <script>
        const vscode = acquireVsCodeApi();

        function generateReport() {
            vscode.postMessage({ type: 'generateReport' });
        }

        function editTemplate() {
            vscode.postMessage({ type: 'editTemplate' });
        }

        function copyReport() {
            vscode.postMessage({ type: 'copyReport' });
        }
    </script>
</body>
</html>`;
  }

  private formatMarkdown(text: string): string {
    let html = text;

    // Code blocks
    html = html.replace(/```([^`]+)```/g, "<pre><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Line breaks and paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = "<p>" + html + "</p>";
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p>(<h[123]>)/g, "$1");
    html = html.replace(/(<\/h[123]>)<\/p>/g, "$1");
    html = html.replace(/<p>(<pre>)/g, "$1");
    html = html.replace(/(<\/pre>)<\/p>/g, "$1");

    return html;
  }

  public dispose() {}
}
