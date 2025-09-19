/**
 * AI Provider Service Unit Tests
 * Comprehensive testing for NovelCrafter's multi-provider AI integration system
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { aiProviderService, AIProvider, AIRequest, AIOptions, AIContext, AIResponse, AIStreamResponse } from '../../services/aiProviderService';
import { openaiService } from '../../services/ai/openaiService';

// Mock the OpenAI service
vi.mock('../../services/ai/openaiService', () => ({
  openaiService: {
    isConfigured: vi.fn(),
    generateCompletion: vi.fn(),
  },
}));

// Mock fetch for local LLM checks
global.fetch = vi.fn() as Mock;

describe('AIProviderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset service state
    aiProviderService['activeProvider'] = 'openai';
    aiProviderService['requestHistory'] = [];
    aiProviderService['usageStats'] = {};
  });

  describe('Provider Management', () => {
    test('should return all available providers', () => {
      const providers = aiProviderService.getProviders();
      
      expect(providers).toHaveLength(4); // openai, anthropic, google, local
      expect(providers.map(p => p.id)).toEqual(['openai', 'anthropic', 'google', 'local']);
    });

    test('should get provider by ID', () => {
      const openaiProvider = aiProviderService.getProvider('openai');
      
      expect(openaiProvider).toBeDefined();
      expect(openaiProvider?.id).toBe('openai');
      expect(openaiProvider?.name).toBe('OpenAI');
      expect(openaiProvider?.models).toHaveLength(3);
    });

    test('should return undefined for non-existent provider', () => {
      const provider = aiProviderService.getProvider('nonexistent');
      expect(provider).toBeUndefined();
    });

    test('should set and get active provider', () => {
      // Initially should be openai
      expect(aiProviderService.getActiveProvider()?.id).toBe('openai');

      // Set to anthropic
      aiProviderService.setActiveProvider('anthropic');
      expect(aiProviderService.getActiveProvider()?.id).toBe('anthropic');

      // Should not set invalid provider
      aiProviderService.setActiveProvider('invalid');
      expect(aiProviderService.getActiveProvider()?.id).toBe('anthropic');
    });

    test('should validate provider models and capabilities', () => {
      const openaiProvider = aiProviderService.getProvider('openai')!;
      
      // Check GPT-4 Turbo model
      const gpt4Turbo = openaiProvider.models.find(m => m.id === 'gpt-4-turbo');
      expect(gpt4Turbo).toBeDefined();
      expect(gpt4Turbo?.contextWindow).toBe(128000);
      expect(gpt4Turbo?.capabilities).toContainEqual({ type: 'creative', quality: 'excellent' });

      // Check provider features
      expect(openaiProvider.features).toContainEqual(
        expect.objectContaining({ id: 'function-calling', enabled: true })
      );
      expect(openaiProvider.supportsStreaming).toBe(true);
    });

    test('should validate Anthropic provider configuration', () => {
      const anthropicProvider = aiProviderService.getProvider('anthropic')!;
      
      expect(anthropicProvider.name).toBe('Anthropic Claude');
      expect(anthropicProvider.contextWindow).toBe(200000);
      expect(anthropicProvider.models).toHaveLength(2);
      
      const claude35 = anthropicProvider.models.find(m => m.id === 'claude-3-5-sonnet-20241022');
      expect(claude35?.displayName).toBe('Claude 3.5 Sonnet');
    });

    test('should validate Google provider configuration', () => {
      const googleProvider = aiProviderService.getProvider('google')!;
      
      expect(googleProvider.name).toBe('Google Gemini');
      expect(googleProvider.contextWindow).toBe(2000000);
      expect(googleProvider.features).toContainEqual(
        expect.objectContaining({ id: 'multimodal', enabled: true })
      );
    });

    test('should validate Local LLM provider configuration', () => {
      const localProvider = aiProviderService.getProvider('local')!;
      
      expect(localProvider.name).toBe('Local LLMs');
      expect(localProvider.costPerToken).toBe(0);
      expect(localProvider.features).toContainEqual(
        expect.objectContaining({ id: 'privacy', enabled: true })
      );
      
      const llama = localProvider.models.find(m => m.id === 'llama3.1:8b');
      expect(llama?.costPer1kTokens).toBe(0);
    });
  });

  describe('Provider Status Checking', () => {
    test('should check OpenAI provider status', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      
      const isAvailable = await aiProviderService.checkProviderStatus('openai');
      
      expect(isAvailable).toBe(true);
      expect(openaiService.isConfigured).toHaveBeenCalled();
    });

    test('should handle OpenAI not configured', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(false);
      
      const isAvailable = await aiProviderService.checkProviderStatus('openai');
      
      expect(isAvailable).toBe(false);
    });

    test('should check local LLM status via fetch', async () => {
      (fetch as Mock).mockResolvedValue({ ok: true });
      
      const isAvailable = await aiProviderService.checkProviderStatus('local');
      
      expect(isAvailable).toBe(true);
      expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    test('should handle local LLM not running', async () => {
      (fetch as Mock).mockRejectedValue(new Error('Connection refused'));
      
      const isAvailable = await aiProviderService.checkProviderStatus('local');
      
      expect(isAvailable).toBe(false);
    });

    test('should return false for unimplemented providers', async () => {
      const anthropicStatus = await aiProviderService.checkProviderStatus('anthropic');
      const googleStatus = await aiProviderService.checkProviderStatus('google');
      
      expect(anthropicStatus).toBe(false);
      expect(googleStatus).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      (openaiService.isConfigured as Mock).mockImplementation(() => {
        throw new Error('Configuration error');
      });
      
      const isAvailable = await aiProviderService.checkProviderStatus('openai');
      
      expect(isAvailable).toBe(false);
    });
  });

  describe('Completion Generation', () => {
    const mockRequest: AIRequest = {
      prompt: 'Write a story about a detective',
      systemPrompt: 'You are a creative writing assistant',
      options: {
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7,
      },
    };

    beforeEach(() => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue(
        'Detective Sarah Chen stepped into the dimly lit office, her keen eyes scanning for clues.'
      );
    });

    test('should generate completion with OpenAI provider', async () => {
      const response = await aiProviderService.generateCompletion(mockRequest);
      
      expect(response).toMatchObject({
        content: expect.stringContaining('Detective Sarah Chen'),
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        usage: expect.objectContaining({
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number),
        }),
      });
      expect(response.id).toMatch(/^ai_\d+_\w+$/);
      expect(response.timestamp).toBeGreaterThan(0);
    });

    test('should build contextual prompt correctly', () => {
      const requestWithContext: AIRequest = {
        prompt: 'Continue the story',
        context: {
          projectId: 'project-1',
          characters: [
            { id: 'char-1', name: 'Sarah Chen', traits: ['detective', 'observant'] },
            { id: 'char-2', name: 'John Doe', traits: ['suspect', 'nervous'] },
          ],
          worldbuilding: [
            { id: 'loc-1', name: 'City Police Station', description: 'Busy downtown precinct' },
          ],
          writingStyle: 'noir',
          genre: 'mystery',
          previousText: 'The case was more complex than initially thought.',
        },
      };

      const contextualPrompt = aiProviderService.buildContextualPrompt(requestWithContext);
      
      expect(contextualPrompt).toContain('Characters: Sarah Chen - detective, observant');
      expect(contextualPrompt).toContain('World: City Police Station: Busy downtown precinct');
      expect(contextualPrompt).toContain('Style: noir');
      expect(contextualPrompt).toContain('Genre: mystery');
      expect(contextualPrompt).toContain('Previous context: "The case was more complex');
      expect(contextualPrompt).toContain('Request: Continue the story');
    });

    test('should handle empty context gracefully', () => {
      const requestWithoutContext: AIRequest = {
        prompt: 'Write a story',
      };

      const prompt = aiProviderService.buildContextualPrompt(requestWithoutContext);
      
      expect(prompt).toBe('Write a story');
    });

    test('should throw error when no active provider', async () => {
      aiProviderService.clearActiveProvider();
      
      await expect(
        aiProviderService.generateCompletion(mockRequest)
      ).rejects.toThrow('No active AI provider configured');
    });

    test('should throw error when provider unavailable', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(false);
      
      await expect(
        aiProviderService.generateCompletion(mockRequest)
      ).rejects.toThrow('Provider OpenAI is not available');
    });

    test('should handle OpenAI service errors', async () => {
      (openaiService.generateCompletion as Mock).mockRejectedValue(
        new Error('OpenAI API error: Rate limit exceeded')
      );
      
      await expect(
        aiProviderService.generateCompletion(mockRequest)
      ).rejects.toThrow('OpenAI API error: Rate limit exceeded');
    });

    test('should track request history', async () => {
      await aiProviderService.generateCompletion(mockRequest);
      await aiProviderService.generateCompletion({ ...mockRequest, prompt: 'Another request' });
      
      const history = aiProviderService.getRequestHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].content).toContain('Detective Sarah Chen');
      expect(history[1].content).toContain('Detective Sarah Chen');
    });

    test('should update usage statistics', async () => {
      await aiProviderService.generateCompletion(mockRequest);
      
      const stats = aiProviderService.getUsageStats();
      
      expect(stats.openai).toBeDefined();
      expect(stats.openai.totalTokens).toBeGreaterThan(0);
      expect(stats.openai.promptTokens).toBeGreaterThan(0);
      expect(stats.openai.completionTokens).toBeGreaterThan(0);
    });

    test('should accumulate usage statistics across requests', async () => {
      // Check initial state - stats should be reset before each test
      const initialStats = aiProviderService.getUsageStats();
      expect(initialStats.openai?.totalTokens || 0).toBe(0);
      
      // First request
      await aiProviderService.generateCompletion(mockRequest);
      const stats1 = aiProviderService.getUsageStats();
      expect(stats1.openai).toBeDefined();
      expect(stats1.openai.totalTokens).toBeGreaterThan(0);
      const firstRequestTokens = stats1.openai.totalTokens;
      
      // Second request - should accumulate with first
      await aiProviderService.generateCompletion(mockRequest);
      const stats2 = aiProviderService.getUsageStats();
      expect(stats2.openai).toBeDefined();
      expect(stats2.openai.totalTokens).toBe(firstRequestTokens * 2);
    });
  });

  describe('Streaming Completion', () => {
    const mockRequest: AIRequest = {
      prompt: 'Write a story',
      options: { stream: true },
    };

    beforeEach(() => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('Generated content');
    });

    test('should generate streaming completion', async () => {
      const streamGenerator = aiProviderService.generateStreamingCompletion(mockRequest);
      const chunks: AIStreamResponse[] = [];
      
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toMatchObject({
        id: expect.stringMatching(/^ai_\d+_\w+$/),
        delta: 'Generated content',
        finished: true,
        usage: expect.objectContaining({
          totalTokens: expect.any(Number),
        }),
      });
    });

    test('should throw error for non-streaming provider', async () => {
      // Mock a provider that doesn't support streaming
      const provider = aiProviderService.getProvider('openai')!;
      provider.supportsStreaming = false;
      
      const generator = aiProviderService.generateStreamingCompletion(mockRequest);
      
      await expect(generator.next()).rejects.toThrow(
        'Provider OpenAI does not support streaming'
      );
      
      // Restore streaming support
      provider.supportsStreaming = true;
    });

    test('should throw error when provider unavailable for streaming', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(false);
      
      const generator = aiProviderService.generateStreamingCompletion(mockRequest);
      
      await expect(generator.next()).rejects.toThrow(
        'Provider OpenAI is not available'
      );
    });

    test('should handle unimplemented streaming providers', async () => {
      aiProviderService.setActiveProvider('anthropic');
      // Mock anthropic as available for this test
      vi.spyOn(aiProviderService, 'checkProviderStatus').mockResolvedValue(true);
      
      const generator = aiProviderService.generateStreamingCompletion(mockRequest);
      
      await expect(generator.next()).rejects.toThrow(
        'Anthropic streaming not yet implemented'
      );
    });
  });

  describe('Unimplemented Providers', () => {
    test('should throw error for Anthropic completion', async () => {
      aiProviderService.setActiveProvider('anthropic');
      vi.spyOn(aiProviderService, 'checkProviderStatus').mockResolvedValue(true);
      
      await expect(
        aiProviderService.generateCompletion({ prompt: 'test' })
      ).rejects.toThrow('Anthropic provider not yet implemented');
    });

    test('should throw error for Google completion', async () => {
      aiProviderService.setActiveProvider('google');
      vi.spyOn(aiProviderService, 'checkProviderStatus').mockResolvedValue(true);
      
      await expect(
        aiProviderService.generateCompletion({ prompt: 'test' })
      ).rejects.toThrow('Google provider not yet implemented');
    });

    test('should throw error for Local LLM completion', async () => {
      aiProviderService.setActiveProvider('local');
      vi.spyOn(aiProviderService, 'checkProviderStatus').mockResolvedValue(true);
      
      await expect(
        aiProviderService.generateCompletion({ prompt: 'test' })
      ).rejects.toThrow('Local LLM provider not yet implemented');
    });
  });

  describe('Utility Methods', () => {
    test('should estimate tokens correctly', () => {
      const shortText = 'Hello';
      const longText = 'This is a much longer text that should result in more tokens being estimated';
      
      const shortTokens = aiProviderService['estimateTokens'](shortText);
      const longTokens = aiProviderService['estimateTokens'](longText);
      
      expect(shortTokens).toBe(Math.ceil(shortText.length / 4));
      expect(longTokens).toBe(Math.ceil(longText.length / 4));
      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    test('should generate unique IDs', () => {
      const id1 = aiProviderService['generateId']();
      const id2 = aiProviderService['generateId']();
      
      expect(id1).toMatch(/^ai_\d+_\w+$/);
      expect(id2).toMatch(/^ai_\d+_\w+$/);
      expect(id1).not.toBe(id2);
    });

    test('should clear request history', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('test content');
      
      // Generate some requests
      await aiProviderService.generateCompletion({ prompt: 'test 1' });
      await aiProviderService.generateCompletion({ prompt: 'test 2' });
      
      expect(aiProviderService.getRequestHistory()).toHaveLength(2);
      
      aiProviderService.clearHistory();
      
      expect(aiProviderService.getRequestHistory()).toHaveLength(0);
    });

    test('should return immutable copies of history and stats', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('test content');
      
      await aiProviderService.generateCompletion({ prompt: 'test' });
      
      const history1 = aiProviderService.getRequestHistory();
      const history2 = aiProviderService.getRequestHistory();
      const stats1 = aiProviderService.getUsageStats();
      const stats2 = aiProviderService.getUsageStats();
      
      // Should be different objects (immutable copies)
      expect(history1).not.toBe(history2);
      expect(stats1).not.toBe(stats2);
      
      // But with same content
      expect(history1).toEqual(history2);
      expect(stats1).toEqual(stats2);
    });
  });

  describe('Context Building Edge Cases', () => {
    test('should handle partial context objects', () => {
      const requestWithPartialContext: AIRequest = {
        prompt: 'Test prompt',
        context: {
          writingStyle: 'formal',
          // Missing other context fields
        },
      };

      const prompt = aiProviderService.buildContextualPrompt(requestWithPartialContext);
      
      expect(prompt).toContain('Style: formal');
      expect(prompt).toContain('Request: Test prompt');
      expect(prompt).not.toContain('Characters:');
      expect(prompt).not.toContain('World:');
    });

    test('should handle empty arrays in context', () => {
      const requestWithEmptyArrays: AIRequest = {
        prompt: 'Test prompt',
        context: {
          characters: [],
          worldbuilding: [],
          genre: 'fantasy',
        },
      };

      const prompt = aiProviderService.buildContextualPrompt(requestWithEmptyArrays);
      
      expect(prompt).toContain('Genre: fantasy');
      expect(prompt).not.toContain('Characters:');
      expect(prompt).not.toContain('World:');
    });

    test('should handle undefined projectId with characters', () => {
      const requestWithoutProjectId: AIRequest = {
        prompt: 'Test prompt',
        context: {
          characters: [{ id: 'char-1', name: 'Hero', traits: ['brave'] }],
          // No projectId
        },
      };

      const prompt = aiProviderService.buildContextualPrompt(requestWithoutProjectId);
      
      // Should not include characters without projectId
      expect(prompt).not.toContain('Characters:');
      expect(prompt).toBe('Test prompt');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed OpenAI responses', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockRejectedValue(
        new Error('Invalid response format')
      );
      
      await expect(
        aiProviderService.generateCompletion({ prompt: 'test' })
      ).rejects.toThrow('Invalid response format');
    });

    test('should handle network timeouts', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockRejectedValue(
        new Error('Request timeout')
      );
      
      await expect(
        aiProviderService.generateCompletion({ prompt: 'test' })
      ).rejects.toThrow('Request timeout');
    });

    test('should handle unsupported models gracefully', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockRejectedValue(
        new Error('Model not found')
      );
      
      await expect(
        aiProviderService.generateCompletion({ 
          prompt: 'test',
          options: { model: 'nonexistent-model' }
        })
      ).rejects.toThrow('Model not found');
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests efficiently', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('Generated content');
      
      const requests = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Request ${i}`,
      }));
      
      const startTime = performance.now();
      const responses = await Promise.all(
        requests.map(req => aiProviderService.generateCompletion(req))
      );
      const endTime = performance.now();
      
      expect(responses).toHaveLength(10);
      expect(responses.every(r => r.content === 'Generated content')).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    test('should efficiently manage large request history', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('Content');
      
      // Generate many requests
      for (let i = 0; i < 100; i++) {
        await aiProviderService.generateCompletion({ prompt: `Request ${i}` });
      }
      
      const startTime = performance.now();
      const history = aiProviderService.getRequestHistory();
      const endTime = performance.now();
      
      expect(history).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    test('should handle large prompts efficiently', async () => {
      (openaiService.isConfigured as Mock).mockReturnValue(true);
      (openaiService.generateCompletion as Mock).mockResolvedValue('Generated content');
      
      const largePrompt = 'This is a very long prompt. '.repeat(1000);
      
      const startTime = performance.now();
      const response = await aiProviderService.generateCompletion({ prompt: largePrompt });
      const endTime = performance.now();
      
      expect(response.content).toBe('Generated content');
      expect(response.usage.promptTokens).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(500); // Token estimation should be fast
    });
  });
});