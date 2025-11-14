// FILE: src/apiKeyManager.ts

import * as vscode from "vscode";

export class ApiKeyManager {
  private static readonly SECRET_KEY = "aiGitReporter.groqApiKey";
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get the API key from secure storage
   */
  async getApiKey(): Promise<string | undefined> {
    return await this.context.secrets.get(ApiKeyManager.SECRET_KEY);
  }

  /**
   * Save API key to secure storage
   */
  async saveApiKey(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API key cannot be empty");
    }

    // Basic validation
    if (apiKey.length < 20) {
      throw new Error("API key appears to be invalid (too short)");
    }

    await this.context.secrets.store(ApiKeyManager.SECRET_KEY, apiKey.trim());
  }

  /**
   * Delete API key from secure storage
   */
  async deleteApiKey(): Promise<void> {
    await this.context.secrets.delete(ApiKeyManager.SECRET_KEY);
  }

  /**
   * Check if API key is set
   */
  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== undefined && key.trim() !== "";
  }

  /**
   * Validate API key format (basic check)
   */
  validateApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    if (apiKey.length < 20) {
      return false;
    }
    return true;
  }

  /**
   * Get masked API key for display
   */
  async getMaskedApiKey(): Promise<string> {
    const key = await this.getApiKey();
    if (!key) {
      return "Not set";
    }
    // Show first 8 and last 4 characters
    if (key.length > 12) {
      return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    }
    return "••••••••";
  }

  /**
   * Get API key settings HTML
   */
  async getApiKeySettingsHTML(): Promise<string> {
    const hasKey = await this.hasApiKey();
    const maskedKey = await this.getMaskedApiKey();

    return `
<div class="api-key-section">
    <div class="section-title">API KEY</div>
    <div class="api-key-status">
        <div class="status-indicator ${
          hasKey ? "status-active" : "status-inactive"
        }">
            ${hasKey ? "●" : "○"}
        </div>
        <div class="status-text">
            ${hasKey ? `Key is set: ${maskedKey}` : "API key not configured"}
        </div>
    </div>
    <div class="api-key-input-container">
        <input 
            type="password" 
            id="apiKeyInput" 
            class="api-key-input" 
            placeholder="Enter your Groq API key"
            autocomplete="off"
        />
        <button id="saveApiKeyBtn" class="action-button">Save API Key</button>
        ${
          hasKey
            ? '<button id="deleteApiKeyBtn" class="action-button danger">Remove Key</button>'
            : ""
        }
    </div>
    <div class="api-key-help">
        Get your free API key at <a href="https://console.groq.com" target="_blank">console.groq.com</a>
    </div>
</div>`;
  }
}
