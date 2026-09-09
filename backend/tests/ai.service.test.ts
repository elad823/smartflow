import { describe, expect, it, vi } from 'vitest';
import { AIService } from '../src/services/ai.service';
import { GoogleGenAI } from '@google/genai';

describe('AIService with Gemini Model', () => {
  it('sends prompt to Gemini model and parses structured JSON response correctly', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        category: 'Infrastructure',
        priority: 'critical',
        summary: 'Kubernetes ingress controller failing under load causing complete site outage.',
        confidenceScore: 0.97,
        recommendedAction: 'Scale ingress replicas and inspect cluster memory exhaustion.'
      })
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.analyzeIssue(
      'K8s cluster ingress outage',
      'All incoming requests are failing with 503 Service Unavailable.'
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.model).toBe('gemini-3.8-flash');
    expect(callArgs.contents).toContain('Title: "K8s cluster ingress outage"');
    expect(callArgs.contents).toContain('"category"');
    expect(callArgs.contents).toContain('"priority"');

    // Verify structured response assignment
    expect(result.category).toBe('Infrastructure');
    expect(result.priority).toBe('critical');
    expect(result.severity).toBe('critical');
    expect(result.analysis.detectedCategory).toBe('Infrastructure');
    expect(result.analysis.confidenceScore).toBe(0.97);
    expect(result.analysis.summary).toContain('Kubernetes ingress controller failing');
    expect(result.analysis.recommendedAction).toContain('Scale ingress replicas');
  });

  it('normalizes capitalization in priority returned by Gemini (e.g. "High" -> "high")', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        category: 'Frontend',
        priority: 'High',
        summary: 'CSS hydration error causing white screen on checkout page.',
        confidenceScore: 0.94,
        recommendedAction: 'Resolve SSR hydration mismatch in React checkout component.'
      })
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.analyzeIssue(
      'White screen on checkout',
      'React hydration error crashes DOM during render on mobile Safari.'
    );

    expect(result.category).toBe('Frontend');
    expect(result.priority).toBe('high');
    expect(result.severity).toBe('high');
  });

  it('handles markdown code fences in Gemini response cleanly', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: '```json\n{\n  "category": "Security",\n  "priority": "critical",\n  "summary": "Critical API authentication bypass.",\n  "confidenceScore": 0.99,\n  "recommendedAction": "Revoke keys."\n}\n```'
    });

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.analyzeIssue(
      'Security auth bypass',
      'Unauthenticated requests are granted admin privileges.'
    );

    expect(result.category).toBe('Security');
    expect(result.priority).toBe('critical');
  });

  it('falls back gracefully if Gemini API throws an error', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Network rate limit exceeded'));

    const mockClient = {
      models: {
        generateContent: mockGenerateContent
      }
    } as unknown as GoogleGenAI;

    const aiService = new AIService(mockClient, 'gemini-3.8-flash');
    const result = await aiService.analyzeIssue(
      'Database connection timeout',
      'PostgreSQL pool limit reached.'
    );

    expect(result.category).toBe('Database');
    expect(result.priority).toBe('high');
    expect(result.analysis).toBeDefined();
  });
});
