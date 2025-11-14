import * as vscode from "vscode";
import { GitExtension, GitAPI, Repository, Change } from "./types";

export class DiffCollector {
  private gitExtension: vscode.Extension<GitExtension> | undefined;
  private gitAPI: GitAPI | undefined;

  constructor() {
    this.gitExtension =
      vscode.extensions.getExtension<GitExtension>("vscode.git");
  }

  /**
   * Initialize the Git API
   */
  private async initializeGitAPI(): Promise<void> {
    if (!this.gitExtension) {
      throw new Error(
        "Git extension not found. Please ensure Git is installed and the Git extension is enabled."
      );
    }

    if (!this.gitExtension.isActive) {
      await this.gitExtension.activate();
    }

    this.gitAPI = this.gitExtension.exports.getAPI(1);
  }

  /**
   * Get the active Git repository
   */
  private async getRepository(): Promise<Repository> {
    if (!this.gitAPI) {
      await this.initializeGitAPI();
    }

    if (!this.gitAPI || this.gitAPI.repositories.length === 0) {
      throw new Error(
        "No Git repository found in the workspace. Please open a folder with a Git repository."
      );
    }

    // Use the first repository (most common case)
    return this.gitAPI.repositories[0];
  }

  /**
   * Get the status description for a change
   */
  private getStatusDescription(change: Change): string {
    const statusMap: { [key: number]: string } = {
      0: "modified (index)",
      1: "added (index)",
      2: "deleted (index)",
      3: "renamed (index)",
      4: "copied (index)",
      5: "modified",
      6: "deleted",
      7: "untracked",
      8: "ignored",
      9: "added by us",
      10: "added by them",
      11: "deleted by us",
      12: "deleted by them",
      13: "both added",
      14: "both deleted",
      15: "both modified"
    };
    return statusMap[change.status] || "unknown";
  }

  /**
   * Collect all diffs from the working tree and index
   */
  async collectDiffs(): Promise<string> {
    const repository = await this.getRepository();
    const state = repository.state;

    let diffContent = "";

    // Add summary of changes
    const allChanges = [...state.indexChanges, ...state.workingTreeChanges];

    if (allChanges.length === 0) {
      return "No changes detected in the repository.";
    }

    diffContent += `=== Git Changes Summary ===\n`;
    diffContent += `Total files changed: ${allChanges.length}\n`;
    diffContent += `Staged changes: ${state.indexChanges.length}\n`;
    diffContent += `Unstaged changes: ${state.workingTreeChanges.length}\n\n`;

    // List all changed files
    diffContent += `=== Changed Files ===\n`;
    for (const change of allChanges) {
      const relativePath = vscode.workspace.asRelativePath(change.uri);
      const status = this.getStatusDescription(change);
      diffContent += `${status}: ${relativePath}\n`;
    }
    diffContent += `\n`;

    // Collect diffs for staged changes (index)
    if (state.indexChanges.length > 0) {
      diffContent += `=== Staged Changes (Index) ===\n\n`;
      for (const change of state.indexChanges) {
        try {
          const relativePath = vscode.workspace.asRelativePath(change.uri);
          diffContent += `--- File: ${relativePath} ---\n`;

          const diff = await repository.diffIndexWithHEAD(change.uri.fsPath);
          if (diff) {
            diffContent += diff + "\n\n";
          } else {
            diffContent += "(Binary file or no diff available)\n\n";
          }
        } catch (error) {
          diffContent += `Error getting diff: ${error}\n\n`;
        }
      }
    }

    // Collect diffs for unstaged changes (working tree)
    if (state.workingTreeChanges.length > 0) {
      diffContent += `=== Unstaged Changes (Working Tree) ===\n\n`;
      for (const change of state.workingTreeChanges) {
        try {
          const relativePath = vscode.workspace.asRelativePath(change.uri);
          diffContent += `--- File: ${relativePath} ---\n`;

          const diff = await repository.diffWithHEAD(change.uri.fsPath);
          if (diff) {
            diffContent += diff + "\n\n";
          } else {
            diffContent += "(Binary file or no diff available)\n\n";
          }
        } catch (error) {
          diffContent += `Error getting diff: ${error}\n\n`;
        }
      }
    }

    return diffContent;
  }

  /**
   * Check if there are any changes in the repository
   */
  async hasChanges(): Promise<boolean> {
    try {
      const repository = await this.getRepository();
      const state = repository.state;
      return (
        state.indexChanges.length > 0 || state.workingTreeChanges.length > 0
      );
    } catch (error) {
      return false;
    }
  }
}
