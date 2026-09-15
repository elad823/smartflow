import { GoogleGenAI } from '@google/genai';
import { AIAnalysis, IssuePriority, IssueSeverity } from '../types/issue.types';
import { config } from '../config/env';

export interface AIAnalysisResult {
  category: string;
  severity: IssueSeverity;
  priority: IssuePriority;
  analysis: AIAnalysis;
  iterations?: number;
}

export interface GeminiIssueAnalysisResponse {
  category?: string;
  priority?: string;
  summary?: string;
  confidenceScore?: number;
  recommendedAction?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: {
    category: string;
    priority: IssuePriority;
    summary: string;
    confidenceScore: number;
    recommendedAction: string;
  };
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Validation function verifying that model output contains mandatory fields
 * and adheres to the expected schema.
 */
export function validateClassificationOutput(raw: any, title = '', description = ''): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      errors: ['Model output must be a valid JSON object.']
    };
  }

  // 1. Validate mandatory field: category
  if (!raw.category || typeof raw.category !== 'string' || raw.category.trim().length === 0) {
    errors.push("Mandatory field 'category' is missing or empty.");
  }

  // 2. Validate mandatory field: priority
  if (!raw.priority || typeof raw.priority !== 'string' || raw.priority.trim().length === 0) {
    errors.push("Mandatory field 'priority' is missing or empty.");
  } else {
    const normalizedPriority = raw.priority.toLowerCase().trim();
    if (!VALID_PRIORITIES.includes(normalizedPriority as any)) {
      errors.push(
        `Field 'priority' has invalid value '${raw.priority}'. Must be one of: ${VALID_PRIORITIES.join(', ')}.`
      );
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const category = raw.category.trim();
  const priority = raw.priority.toLowerCase().trim() as IssuePriority;
  const summary =
    typeof raw.summary === 'string' && raw.summary.trim().length > 0
      ? raw.summary.trim()
      : `${title.trim()}: Tagged with ${priority} priority in ${category}.`;
  const confidenceScore =
    typeof raw.confidenceScore === 'number'
      ? Math.max(0, Math.min(1, raw.confidenceScore))
      : 0.95;
  const recommendedAction =
    typeof raw.recommendedAction === 'string' && raw.recommendedAction.trim().length > 0
      ? raw.recommendedAction.trim()
      : `Investigate ${category.toLowerCase()} diagnostics and inspect application logs for ${title.trim()}.`;

  return {
    isValid: true,
    errors: [],
    data: {
      category,
      priority,
      summary,
      confidenceScore,
      recommendedAction
    }
  };
}

export class AIService {
  private client: GoogleGenAI | null = null;
  private model: string;

  constructor(client?: GoogleGenAI, model?: string) {
    this.model = model || config.geminiModel || 'gemini-2.5-flash';
    if (client) {
      this.client = client;
    } else if (config.geminiApiKey) {
      this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  /**
   * Set or inject a custom GoogleGenAI client (useful for mocking during unit tests)
   */
  public setClient(client: GoogleGenAI): void {
    this.client = client;
  }

  /**
   * Primary entry point for issue analysis via autonomous Agentic Loop.
   */
  public async analyzeIssue(title: string, description: string): Promise<AIAnalysisResult> {
    return this.runAgenticLoop(title, description);
  }

  /**
   * Autonomous Agentic Loop:
   * 1. Calls Gemini model with structured prompt.
   * 2. Validates output with validateClassificationOutput().
   * 3. On failure or invalid data structure, feeds back validation errors and retries automatically.
   * 4. Once validated successfully, returns verified analysis for database persistence.
   */
  public async runAgenticLoop(
    title: string,
    description: string,
    maxRetries = 3
  ): Promise<AIAnalysisResult> {
    if (!this.client) {
      console.warn('⚠️ No Gemini client configured. Falling back to local triage engine.');
      return this.fallbackAnalysis(title, description);
    }

    let lastValidationErrors: string[] = [];
    const candidateModels = Array.from(
      new Set([this.model, 'gemini-2.5-flash', 'gemini-3.6-flash'])
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const prompt = this.buildPrompt(title, description, lastValidationErrors, attempt);
      const currentModel = candidateModels[(attempt - 1) % candidateModels.length];

      try {
        console.log(`🤖 Agentic Loop (Attempt ${attempt}/${maxRetries}): Querying ${currentModel}...`);

        const response = await this.client.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text ? response.text.trim() : '';
        if (!rawText) {
          lastValidationErrors = ['Empty response text received from model.'];
          console.warn(`⚠️ Attempt ${attempt} failed: Empty response. Retrying...`);
          continue;
        }

        let parsedJson: any;
        try {
          const cleanJson = rawText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          parsedJson = JSON.parse(cleanJson);
        } catch (parseError: any) {
          lastValidationErrors = [`Invalid JSON syntax: ${parseError.message}`];
          console.warn(`⚠️ Attempt ${attempt} failed: JSON syntax invalid. Retrying...`);
          continue;
        }

        // Run validation function
        const validation = validateClassificationOutput(parsedJson, title, description);
        if (validation.isValid && validation.data) {
          console.log(
            `✅ Agentic Loop succeeded on attempt ${attempt}: Tagged [Category: ${validation.data.category}, Priority: ${validation.data.priority}]`
          );

          const { category, priority, summary, confidenceScore, recommendedAction } = validation.data;
          const severity: IssueSeverity = priority;

          return {
            category,
            severity,
            priority,
            iterations: attempt,
            analysis: {
              summary,
              detectedCategory: category,
              confidenceScore,
              recommendedAction
            }
          };
        }

        // Validation failed: record errors to feed into next iteration's prompt
        lastValidationErrors = validation.errors;
        console.warn(
          `⚠️ Attempt ${attempt} failed validation: ${lastValidationErrors.join(', ')}. Initiating agentic self-correction retry...`
        );
      } catch (error: any) {
        const errMsg = error?.message || String(error);
        lastValidationErrors = [`Model execution error: ${errMsg}`];
        console.warn(`⚠️ Attempt ${attempt} encountered error: ${errMsg}. Retrying...`);

        // Brief delay before next iteration
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    console.warn(
      `⚠️ Agentic Loop exhausted ${maxRetries} attempts. Seamlessly applying fallback triage.`
    );
    return this.fallbackAnalysis(title, description);
  }

  private buildPrompt(
    title: string,
    description: string,
    previousErrors: string[],
    attempt: number
  ): string {
    let errorFeedback = '';
    if (previousErrors.length > 0) {
      errorFeedback = `
CRITICAL CORRECTION REQUIRED:
Your previous output was REJECTED by the automated validation layer with the following errors:
${previousErrors.map((err) => `- ${err}`).join('\n')}

You MUST strictly fix these errors in your JSON output. Ensure 'category' and 'priority' are both present, non-empty, and adhere to the schema.
`;
    }

    return `You are an expert autonomous triage agent for the SmartFlow Issue Tracker.
Analyze the following issue report:
Title: "${title}"
Description: "${description}"
${errorFeedback}
Return ONLY a valid, single JSON object (no markdown, no backticks, no markdown code fences, no introductory or concluding text) matching this EXACT specification:
{
  "category": "Frontend" | "Backend" | "Infrastructure" | "Database" | "Security" | "Performance" | "Network",
  "priority": "low" | "medium" | "high" | "critical",
  "summary": "Concise executive summary of the issue (1-2 sentences)",
  "confidenceScore": 0.95,
  "recommendedAction": "Concrete immediate steps recommended to resolve or mitigate this issue"
}

Mandatory rules:
1. 'category' is strictly required and must specify the affected system component.
2. 'priority' is strictly required and must be exactly one of: 'low', 'medium', 'high', 'critical'.`;
  }

  private fallbackAnalysis(title: string, description: string): AIAnalysisResult {
    const text = `${title} ${description}`.toLowerCase();

    let category = 'Backend';
    if (text.includes('react') || text.includes('ui') || text.includes('css') || text.includes('browser') || text.includes('modal') || text.includes('button')) {
      category = 'Frontend';
    } else if (text.includes('sql') || text.includes('db') || text.includes('database') || text.includes('query') || text.includes('postgres') || text.includes('table')) {
      category = 'Database';
    } else if (text.includes('auth') || text.includes('token') || text.includes('jwt') || text.includes('security') || text.includes('vulnerability') || text.includes('permission')) {
      category = 'Security';
    } else if (text.includes('latency') || text.includes('slow') || text.includes('timeout') || text.includes('memory') || text.includes('cpu')) {
      category = 'Performance';
    } else if (text.includes('k8s') || text.includes('docker') || text.includes('cluster') || text.includes('pod') || text.includes('disk')) {
      category = 'Infrastructure';
    }

    let priority: IssuePriority = 'medium';
    if (text.includes('outage') || text.includes('down') || text.includes('critical') || text.includes('deadlock') || text.includes('breach')) {
      priority = 'critical';
    } else if (text.includes('timeout') || text.includes('fail') || text.includes('error') || text.includes('unauthorized')) {
      priority = 'high';
    } else if (text.includes('typo') || text.includes('minor') || text.includes('clarification')) {
      priority = 'low';
    }

    return {
      category,
      severity: priority,
      priority,
      iterations: 0,
      analysis: {
        summary: `${title.trim()}. Classified as ${category} with ${priority} priority.`,
        detectedCategory: category,
        confidenceScore: 0.9,
        recommendedAction: `Inspect ${category.toLowerCase()} diagnostics and verify application logs for errors.`
      }
    };
  }
}

export const aiService = new AIService();
