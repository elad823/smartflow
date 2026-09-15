import { describe, expect, it, vi } from 'vitest';
import { AIService, validateClassificationOutput } from '../src/services/ai.service';
import { GoogleGenAI } from '@google/genai';

describe('Validation Function: validateClassificationOutput', () => {
  it('passes validation when both category and priority are valid', () => {
    const validOutput = {
      category: 'Database',
      priority: 'critical',
      summary: 'Deadlock in orders table',
      confidenceScore: 0.98,
      recommendedAction: 'Review query locks'
    };

    const result = validateClassificationOutput(validOutput, 'Deadlock', 'Orders table is locked');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data?.category).toBe('Database');
    expect(result.data?.priority).toBe('critical');
  });

  it('rejects output when category is missing', () => {
    const invalidOutput = {
      priority: 'high',
      summary: 'Missing category'
    };

    const result = validateClassificationOutput(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('category'))).toBe(true);
  });

  it('rejects output when priority is missing or invalid', () => {
    const invalidOutput = {
      category: 'Security',
      priority: 'super-urgent' // Not in valid priorities
    };

    const result = validateClassificationOutput(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
  });

  it('rejects non-object or null input', () => {
    expect(validateClassificationOutput(null).isValid).toBe(false);
    expect(validateClassificationOutput('not-json').isValid).toBe(false);
    expect(validateClassificationOutput([]).isValid).toBe(false);
  });
});

describe('Autonomous Agentic Loop (runAgenticLoop)', () => {
  it('succeeds on first iteration when model returns valid structured data', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        category: 'Infrastructure',
        priority: 'critical',
        summary: 'Ingress controller failure',
        confidenceScore: 0.97,
        recommendedAction: 'Scale ingress pods'
      })
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.runAgenticLoop(
      'K8s ingress outage',
      'All incoming requests are failing with 503 Service Unavailable.'
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(result.category).toBe('Infrastructure');
    expect(result.priority).toBe('critical');
    expect(result.iterations).toBe(1);
  });

  it('automatically retries with feedback when first attempt fails validation, succeeding on self-correction', async () => {
    // Attempt 1: Missing category and priority (invalid)
    // Attempt 2: Self-corrected valid JSON
    const mockGenerateContent = vi
      .fn()
      .mockResolvedValueOnce({
        text: JSON.stringify({
          summary: 'Incomplete response without mandatory fields'
        })
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          category: 'Security',
          priority: 'high',
          summary: 'JWT token signing failure',
          confidenceScore: 0.95,
          recommendedAction: 'Rotate keys'
        })
      });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.runAgenticLoop(
      'JWT token signing failure',
      'Token verification fails due to signature mismatch.'
    );

    // Verifies the loop retried
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    // Verify that the second prompt included the automated error feedback
    const secondCallPrompt = mockGenerateContent.mock.calls[1][0].contents;
    expect(secondCallPrompt).toContain('CRITICAL CORRECTION REQUIRED');
    expect(secondCallPrompt).toContain("Mandatory field 'category' is missing");
    expect(secondCallPrompt).toContain("Mandatory field 'priority' is missing");

    // Verify verified final data
    expect(result.category).toBe('Security');
    expect(result.priority).toBe('high');
    expect(result.iterations).toBe(2);
  });

  it('retries when model returns malformed JSON syntax and corrects on next attempt', async () => {
    // Attempt 1: Syntax error
    // Attempt 2: Valid JSON
    const mockGenerateContent = vi
      .fn()
      .mockResolvedValueOnce({
        text: 'This is not valid json at all {broken'
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          category: 'Frontend',
          priority: 'medium',
          summary: 'Button alignment shifted',
          confidenceScore: 0.9,
          recommendedAction: 'Adjust flexbox alignment'
        })
      });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.runAgenticLoop('Button misalignment', 'Button wraps on mobile.');

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.category).toBe('Frontend');
    expect(result.priority).toBe('medium');
    expect(result.iterations).toBe(2);
  });

  it('falls back gracefully when max retries are exhausted without valid structure', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({ unhelpfulField: 'still-missing-fields' })
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.runAgenticLoop(
      'Database connection timeout',
      'PostgreSQL pool limit reached.',
      2 // maxRetries = 2
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result.category).toBe('Database');
    expect(result.priority).toBe('high');
    expect(result.iterations).toBe(0); // fallback used
  });
});
