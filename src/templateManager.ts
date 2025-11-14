// FILE: src/templateManager.ts

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export class TemplateManager {
  private templateDir: string;
  private templatePath: string;

  constructor() {
    this.templateDir = path.join(os.homedir(), ".vscode-ai-git-reporter");
    this.templatePath = path.join(this.templateDir, "template.md");
  }

  /**
   * Initialize the template directory and create default template if needed
   */
  async initialize(): Promise<void> {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.templateDir)) {
        fs.mkdirSync(this.templateDir, { recursive: true });
      }

      // Create default template if it doesn't exist
      if (!fs.existsSync(this.templatePath)) {
        await this.createDefaultTemplate();
      }
    } catch (error) {
      throw new Error(`Failed to initialize template manager: ${error}`);
    }
  }

  /**
   * Create the default template file
   */
  private async createDefaultTemplate(): Promise<void> {
    const defaultTemplate = `Status Report: {{date}}
        Worked Hours: {{hours}}

        * Shopify Services
          * tbl_shopify_categories
            * Added tbl_shopify_category_and_channel_metafield_linkers relation
            * Helps queries reach tbl_shopify_channel_definitions more easily
          * getSuggestedAttributes
            * Finds attributes connected to a product's category
            * Removes attributes that already have a value
          * getSuggestedAttributesByCategoryId
            * Enables standard metafield definitions for a category
            * Creates category metafields
            * Returns attributes associated with the category

        * Product Response Update
          * Cleaned response and removed unused fields

        * Category Metafield Flow
          * Added conditional processing based on category or product id
          * Only updates product-channel records when product id is present

        ---

        ## Commit Message

        {{commit_message}}
    `;

    fs.writeFileSync(this.templatePath, defaultTemplate, "utf-8");
  }

  /**
   * Load the template content
   */
  async loadTemplate(): Promise<string> {
    try {
      if (!fs.existsSync(this.templatePath)) {
        await this.createDefaultTemplate();
      }
      return fs.readFileSync(this.templatePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to load template: ${error}`);
    }
  }

  /**
   * Save template content
   */
  async saveTemplate(content: string): Promise<void> {
    try {
      fs.writeFileSync(this.templatePath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to save template: ${error}`);
    }
  }

  /**
   * Open the template file in VS Code editor
   */
  async openTemplateInEditor(): Promise<void> {
    try {
      // Ensure template exists
      if (!fs.existsSync(this.templatePath)) {
        await this.createDefaultTemplate();
      }

      const doc = await vscode.workspace.openTextDocument(this.templatePath);
      await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.One
      });

      vscode.window.showInformationMessage(
        "Edit your template and save the file. Changes will be used in the next analysis."
      );
    } catch (error) {
      throw new Error(`Failed to open template: ${error}`);
    }
  }

  /**
   * Get the template directory path
   */
  getTemplateDirectory(): string {
    return this.templateDir;
  }

  /**
   * Get the template file path
   */
  getTemplatePath(): string {
    return this.templatePath;
  }

  /**
   * Check if template exists
   */
  templateExists(): boolean {
    return fs.existsSync(this.templatePath);
  }

  /**
   * Reset template to default
   */
  async resetToDefault(): Promise<void> {
    try {
      await this.createDefaultTemplate();
      vscode.window.showInformationMessage(
        "Template reset to default successfully."
      );
    } catch (error) {
      throw new Error(`Failed to reset template: ${error}`);
    }
  }
}
