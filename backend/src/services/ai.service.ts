import { GoogleGenAI } from '@google/genai';
import { AIAnalysis, IssuePriority, IssueSeverity } from '../types/issue.types';
import { config } from '../config/env';

export interface AIAnalysisResult {
  category: string;
  severity: IssueSeverity;
  priority: IssuePriority;
  analysis: AIAnalysis;
}

export interface GeminiIssueAnalysisResponse {
  category: string;
  priority: string;
  summary?: string;
  confidenceScore?: number;
  recommendedAction?: string;
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
   * Asynchronously calls Gemini with structured JSON output,
   * equipped with automatic model fallback to handle transient 503 high-demand spikes.
   */
  public async analyzeIssue(title: string, description: string): Promise<AIAnalysisResult> {
    const prompt = `You are an expert AI triage agent for the SmartFlow Issue Tracker.
Analyze the following issue report:
Title: "${title}"
Description: "${description}"

Evaluate the issue content and return ONLY a valid JSON object (no markdown, no code fences, no extra text) with the following structure:
{
  "category": "Frontend" | "Backend" | "Infrastructure" | "Database" | "Security" | "Performance" | "Network",
  "priority": "low" | "medium" | "high" | "critical",
  "summary": "Executive summary of the issue (1-2 sentences)",
  "confidenceScore": 0.95,
  "recommendedAction": "Concrete immediate steps recommended to resolve or mitigate this issue"
}`;

    if (this.client) {
      // Candidate models for graceful fallback if one model is congested (503)
      const candidateModels = Array.from(
        new Set([this.model, 'gemini-2.5-flash', 'gemini-3.6-flash'])
      );

      for (let i = 0; i < candidateModels.length; i++) {
        const currentModel = candidateModels[i];
        try {
          const response = await this.client.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          const rawText = response.text ? response.text.trim() : '';
          const parsed = this.parseGeminiResponse(rawText, title, description);
          return parsed;
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          const isBusyOrRateLimit = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429');

          if (isBusyOrRateLimit && i < candidateModels.length - 1) {
            const nextModel = candidateModels[i + 1];
            console.warn(
              `⚠️ Gemini model '${currentModel}' is temporarily experiencing high demand (503). Switching to fallback model '${nextModel}'...`
            );
            // Brief pause before trying next candidate
            await new Promise((res) => setTimeout(res, 300));
            continue;
          }

          if (isBusyOrRateLimit) {
            console.warn(
              '⚠️ All Gemini models are temporarily experiencing high cloud demand (503). Seamlessly applying smart fallback triage.'
            );
          } else {
            console.warn('⚠️ Gemini API call encountered an error. Applying smart fallback triage:', errMsg);
          }
          break;
        }
      }
    }

    // Fallback if client is unconfigured or all models are busy
    return this.fallbackAnalysis(title, description);
  }

  private parseGeminiResponse(
    jsonText: string,
    title: string,
    description: string
  ): AIAnalysisResult {
    try {
      // Clean possible markdown code fence wrappers (```json ... ```)
      const cleanJson = jsonText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const data: GeminiIssueAnalysisResponse = JSON.parse(cleanJson);

      const category = data.category || 'Backend';
      const rawPriority = (data.priority || 'medium').toLowerCase();
      const priority: IssuePriority = this.normalizePriority(rawPriority);
      const severity: IssueSeverity = priority;

      const summary =
        data.summary ||
        `${title}: ${description.slice(0, 100)}... Tagged with ${priority} priority in ${category}.`;

      const confidenceScore =
        typeof data.confidenceScore === 'number'
          ? Math.max(0, Math.min(1, data.confidenceScore))
          : 0.95;

      const recommendedAction =
        data.recommendedAction ||
        `Investigate ${category.toLowerCase()} logs and review recent changes related to ${title}.`;

      const analysis: AIAnalysis = {
        summary,
        detectedCategory: category,
        confidenceScore,
        recommendedAction
      };

      return {
        category,
        severity,
        priority,
        analysis
      };
    } catch {
      return this.fallbackAnalysis(title, description);
    }
  }

  private normalizePriority(raw: string): IssuePriority {
    if (raw.includes('crit')) return 'critical';
    if (raw.includes('high')) return 'high';
    if (raw.includes('low')) return 'low';
    return 'medium';
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
