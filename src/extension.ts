// FILE: src/extension.ts

import * as vscode from "vscode";
import { TemplateManager } from "./templateManager";
import { HistoryManager } from "./historyManager";
import { UsageManager } from "./usageManager";
import { ApiKeyManager } from "./apiKeyManager";
import { GroqUsageManager } from "./groqUsageManager";
import { UsageViewProvider } from "./usageViewProvider";
import { ReportViewProvider } from "./reportViewProvider";
import { HistoryViewProvider } from "./historyViewProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("AI Git Reporter extension is now active!");

  // Initialize managers
  const templateManager = new TemplateManager();
  const historyManager = new HistoryManager();
  const usageManager = new UsageManager();
  const apiKeyManager = new ApiKeyManager(context);
  const groqUsageManager = new GroqUsageManager(context);

  // Initialize three clean panels
  const usageViewProvider = new UsageViewProvider(
    context.extensionUri,
    groqUsageManager,
    apiKeyManager
  );

  const reportViewProvider = new ReportViewProvider(
    context.extensionUri,
    templateManager,
    historyManager,
    groqUsageManager,
    usageManager,
    apiKeyManager
  );

  const historyViewProvider = new HistoryViewProvider(
    context.extensionUri,
    historyManager
  );

  // Connect history panel to report panel
  historyViewProvider.onReportLoad(async (reportContent) => {
    await reportViewProvider.loadReport(reportContent);
  });

  // Initialize directories and managers
  templateManager.initialize().catch((error) => {
    console.error("Failed to initialize template manager:", error);
  });
  historyManager.initialize().catch((error) => {
    console.error("Failed to initialize history manager:", error);
  });
  usageManager.initialize().catch((error) => {
    console.error("Failed to initialize usage manager:", error);
  });

  // Register three separate sidebar panels
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("usageMonitor", usageViewProvider)
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "reportGenerator",
      reportViewProvider
    )
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "reportHistory",
      historyViewProvider
    )
  );
  context.subscriptions.push(groqUsageManager);
}

export function deactivate() {}
