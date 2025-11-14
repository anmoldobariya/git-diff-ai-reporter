// FILE: src/usageViewProvider.ts

import * as vscode from "vscode";
import { GroqUsageManager } from "./groqUsageManager";
import { ApiKeyManager } from "./apiKeyManager";

/**
 * Clean usage monitoring panel - API key + usage bars only
 */
export class UsageViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private refreshInterval?: NodeJS.Timeout;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly groqUsageManager: GroqUsageManager,
    private readonly apiKeyManager: ApiKeyManager
  ) {
    // Register for usage updates
    this.groqUsageManager.onUpdate(() => {
      this.refresh();
    });
  }

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

    // Auto-refresh every 2 seconds
    this.refreshInterval = setInterval(() => {
      this.updateWebview();
    }, 2000);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "showApiKeyInput":
          // Just refresh to show input state
          break;
        case "saveApiKey":
          await this.handleSaveApiKey(data.apiKey);
          break;
        case "cancelApiKeyChange":
          await this.updateWebview();
          break;
      }
    });
  }

  private async handleSaveApiKey(apiKey: string) {
    try {
      // Validate API key with lightweight request
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (response.status !== 200) {
        vscode.window.showErrorMessage(
          "Invalid API key. Please check and try again."
        );
        return;
      }

      // Save the valid key
      await this.apiKeyManager.saveApiKey(apiKey);
      vscode.window.showInformationMessage("✓ API key saved successfully!");

      // Refresh to hide input and show masked key
      await this.updateWebview();
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to validate API key. Check your internet connection."
      );
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
    const usage = this.groqUsageManager.getUsageState();
    const limits = this.groqUsageManager.getCurrentLimits();
    const isRateLimited = this.groqUsageManager.isCurrentlyRateLimited();
    const secondsUntilReset = this.groqUsageManager.getSecondsUntilNextReset();
    const maskedKey = await this.apiKeyManager.getMaskedApiKey();
    const hasKey = await this.apiKeyManager.hasApiKey();

    if (!usage) {
      return this.getErrorHtml();
    }

    // Calculate percentages
    const tokensMinutePercent = Math.min(
      100,
      Math.round((usage.tokensUsedThisMinute / limits.tpm) * 100)
    );
    const requestsMinutePercent = Math.min(
      100,
      Math.round((usage.requestsUsedThisMinute / limits.rpm) * 100)
    );
    const tokensDayPercent = Math.min(
      100,
      Math.round((usage.tokensUsedToday / limits.tpd) * 100)
    );
    const requestsDayPercent = Math.min(
      100,
      Math.round((usage.requestsUsedToday / limits.rpd) * 100)
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Usage Monitor</title>
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

        .panel {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 16px;
        }

        .panel-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
        }

        .api-key-display {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .api-key-value {
            font-family: 'Consolas', monospace;
            font-size: 11px;
            color: var(--vscode-foreground);
        }

        .change-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
        }

        .change-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .api-key-input-row {
            display: none;
            margin-bottom: 12px;
        }

        .api-key-input-row.active {
            display: block;
        }

        .api-key-input {
            width: 100%;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 8px;
            font-family: 'Consolas', monospace;
        }

        .input-buttons {
            display: flex;
            gap: 8px;
        }

        .save-btn, .cancel-btn {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
        }

        .save-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .save-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .cancel-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .cancel-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .rate-limit-banner {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
        }

        .banner-text {
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .banner-countdown {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .model-badge {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
            margin-bottom: 16px;
        }

        .metric {
            margin-bottom: 20px;
        }

        .metric-label {
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 6px;
            color: var(--vscode-foreground);
        }

        .bar-container {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            height: 18px;
            overflow: hidden;
            margin-bottom: 6px;
        }

        .bar-fill {
            height: 100%;
            transition: width 0.5s ease-out;
            border-radius: 8px;
            background: linear-gradient(90deg, #0078d4, #1a8adb);
        }

        .bar-fill.warning {
            background: linear-gradient(90deg, #f59e0b, #f97316);
        }

        .bar-fill.danger {
            background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .metric-value {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            font-family: 'Consolas', monospace;
        }

        .divider {
            border-top: 1px solid var(--vscode-panel-border);
            margin: 20px 0;
        }
    </style>
</head>
<body>
    ${
      isRateLimited
        ? `
    <div class="rate-limit-banner">
        <div class="banner-text">⚠️ Rate limit reached</div>
        <div class="banner-countdown">Resets in ${secondsUntilReset} seconds</div>
    </div>
    `
        : ""
    }

    <div class="panel">
        <div class="panel-title">API Key</div>
        
        <div class="api-key-display" id="keyDisplay" style="${
          hasKey ? "" : "display: none;"
        }">
            <span class="api-key-value">${maskedKey || "Not configured"}</span>
            <button class="change-btn" onclick="showKeyInput()">Change Key</button>
        </div>

        <div class="api-key-input-row" id="keyInput" ${
          !hasKey ? 'class="active"' : ""
        }>
            <input type="password" class="api-key-input" id="apiKeyField" 
                   placeholder="Enter your Groq API key">
            <div class="input-buttons">
                <button class="save-btn" onclick="saveKey()">Save</button>
                <button class="cancel-btn" onclick="cancelKey()" style="${
                  hasKey ? "" : "display: none;"
                }">Cancel</button>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-title">Usage Monitor</div>
        <div class="model-badge">${usage.model}</div>

        <div class="metric">
            <div class="metric-label">Tokens per Minute</div>
            <div class="bar-container">
                <div class="bar-fill ${
                  tokensMinutePercent >= 90
                    ? "danger"
                    : tokensMinutePercent >= 70
                    ? "warning"
                    : ""
                }" 
                     style="width: ${tokensMinutePercent}%"></div>
            </div>
            <div class="metric-value">
                ${usage.tokensUsedThisMinute.toLocaleString()} / ${limits.tpm.toLocaleString()} (${tokensMinutePercent}%)
            </div>
        </div>

        <div class="metric">
            <div class="metric-label">Requests per Minute</div>
            <div class="bar-container">
                <div class="bar-fill ${
                  requestsMinutePercent >= 90
                    ? "danger"
                    : requestsMinutePercent >= 70
                    ? "warning"
                    : ""
                }" 
                     style="width: ${requestsMinutePercent}%"></div>
            </div>
            <div class="metric-value">
                ${usage.requestsUsedThisMinute} / ${
      limits.rpm
    } (${requestsMinutePercent}%)
            </div>
        </div>

        <div class="divider"></div>

        <div class="metric">
            <div class="metric-label">Tokens per Day</div>
            <div class="bar-container">
                <div class="bar-fill ${
                  tokensDayPercent >= 90
                    ? "danger"
                    : tokensDayPercent >= 70
                    ? "warning"
                    : ""
                }" 
                     style="width: ${tokensDayPercent}%"></div>
            </div>
            <div class="metric-value">
                ${usage.tokensUsedToday.toLocaleString()} / ${limits.tpd.toLocaleString()} (${tokensDayPercent}%)
            </div>
        </div>

        <div class="metric">
            <div class="metric-label">Requests per Day</div>
            <div class="bar-container">
                <div class="bar-fill ${
                  requestsDayPercent >= 90
                    ? "danger"
                    : requestsDayPercent >= 70
                    ? "warning"
                    : ""
                }" 
                     style="width: ${requestsDayPercent}%"></div>
            </div>
            <div class="metric-value">
                ${usage.requestsUsedToday.toLocaleString()} / ${limits.rpd.toLocaleString()} (${requestsDayPercent}%)
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function showKeyInput() {
            document.getElementById('keyDisplay').style.display = 'none';
            document.getElementById('keyInput').classList.add('active');
            document.getElementById('apiKeyField').focus();
        }

        function saveKey() {
            const key = document.getElementById('apiKeyField').value.trim();
            if (!key) {
                return;
            }
            vscode.postMessage({ type: 'saveApiKey', apiKey: key });
        }

        function cancelKey() {
            document.getElementById('keyDisplay').style.display = 'flex';
            document.getElementById('keyInput').classList.remove('active');
            document.getElementById('apiKeyField').value = '';
        }
    </script>
</body>
</html>`;
  }

  private getErrorHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            padding: 16px;
        }
    </style>
</head>
<body>
    <p>Failed to load usage data. Please reload the extension.</p>
</body>
</html>`;
  }

  public dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
