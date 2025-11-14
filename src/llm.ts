// FILE: src/llm.ts

import { GroqChatRequest, GroqChatResponse, GroqChatMessage } from "./types";

export interface AnalysisResult {
  fullReport: string;
  commitMessage: string;
  perFileAnalysis: string;
  impactAndRisks: string;
  recommendations: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMClient {
  private readonly apiEndpoint =
    "https://api.groq.com/openai/v1/chat/completions";
  private readonly model = "llama-3.3-70b-versatile";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze git diffs using Groq AI with custom template
   */
  async analyzeDiffWithTemplate(
    diffContent: string,
    template: string
  ): Promise<AnalysisResult> {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new Error(
        "Groq API key is not configured. Please set it in the extension settings."
      );
    }

    const systemPrompt = `You are a developer writing a status report about your day's work.

      Your job is to:
      1. Read Git diffs and explain what changed in simple, human terms.
      2. Describe WHY someone would make these changes (the purpose and intent).
      3. Explain what the updated code does and what it accomplishes.
      4. Group changes by file or feature area.
      5. Generate a simple, clear commit message.
      6. Follow the user's template format exactly—match the tone, style, and indentation.

      Important guidelines:
      - Write like a human developer, not an AI reviewer
      - Focus on WHAT and WHY, not critique or suggestions
      - No risk analysis, no recommendations, no "should/could" advice
      - Keep it simple, structured, and conversational
      - Match the template's bullet point style and indentation exactly
      - This is a change report, not a code review

      Replace template placeholders:
      - {{date}} with current date
      - {{hours}} with estimated work hours
      - {{commit_message}} with a clear, concise commit message`;

          const currentDate = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });

          const userPrompt = `## Current Date
      ${currentDate}

      ## Git Diff to Analyze
      ${diffContent}

      ## Report Template
      ${template}

      Use the same bullet point style and indentation as the template.
      Replace {{date}}, {{hours}}, and {{commit_message}} placeholders.

      Keep the tone conversational and human—like you're explaining your work to a teammate.
      No risks, no suggestions, no code review. Just describe what you did and why.`;

    const messages: GroqChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const requestBody: GroqChatRequest = {
      model: this.model,
      messages: messages,
      temperature: 0.2,
      max_tokens: 4096
    };

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Groq API request failed: ${response.status} ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = `Groq API Error: ${errorJson.error.message}`;
          }
        } catch {
          // Use default error message
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as GroqChatResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response received from Groq API");
      }

      const fullReport = data.choices[0].message.content;

      const result: AnalysisResult = {
        fullReport,
        commitMessage: this.extractSection(fullReport, "Commit Message"),
        perFileAnalysis: fullReport,
        impactAndRisks: "",
        recommendations: "",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
              totalTokens: data.usage.total_tokens || 0
            }
          : undefined
      };

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to communicate with Groq API: ${String(error)}`);
    }
  }

  /**
   * Extract a section from markdown report
   */
  private extractSection(content: string, sectionName: string): string {
    const lines = content.split("\n");
    let inSection = false;
    let sectionContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        line.includes(sectionName) ||
        line.toLowerCase().includes(sectionName.toLowerCase())
      ) {
        inSection = true;
        continue;
      }

      if (inSection && (line.startsWith("##") || line.startsWith("---"))) {
        break;
      }

      if (inSection) {
        sectionContent.push(line);
      }
    }

    return sectionContent.join("\n").trim();
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: GroqChatMessage[] = [
        { role: "user", content: "Hello" }
      ];

      const requestBody: GroqChatRequest = {
        model: this.model,
        messages: testMessages,
        max_tokens: 10
      };

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
