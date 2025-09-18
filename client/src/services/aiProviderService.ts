/**
 * Multi-Provider AI Service - Core AI integration system
 * Supports OpenAI, Anthropic Claude, Google Gemini, Meta Llama, and Local LLMs
 */

import { openaiService } from './ai/openaiService';

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  supportsStreaming: boolean;
  costPerToken: number;
  maxTokens: number;
  contextWindow: number;
  features: AIFeature[];
  status: 'available' | 'unavailable' | 'error';
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  maxTokens: number;
  contextWindow: number;
  costPer1kTokens: number;
  capabilities: AICapability[];
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AICapability {
  type: 'text' | 'code' | 'creative' | 'analysis' | 'multimodal';
  quality: 'basic' | 'good' | 'excellent';
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  context?: AIContext;
  options?: AIOptions;
}

export interface AIOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface AIContext {
  projectId?: string;
  storyId?: string;
  sceneId?: string;
  characters?: Array<{ id: string; name: string; traits: string[] }>;
  worldbuilding?: Array<{ id: string; name: string; description: string }>;
  previousText?: string;
  writingStyle?: string;
  genre?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage: AIUsage;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AIStreamResponse {
  id: string;
  delta: string;
  finished: boolean;
  usage?: AIUsage;
}

class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string = 'openai';
  private requestHistory: AIResponse[] = [];
  private usageStats: Record<string, AIUsage> = {};

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI Provider
    this.providers.set('openai', {
      id: 'openai',
      name: 'OpenAI',
      models: [
        {
          id: 'gpt-4-turbo',
          name: 'gpt-4-turbo',
          displayName: 'GPT-4 Turbo',
          maxTokens: 4096,
          contextWindow: 128000,
          costPer1kTokens: 0.01,
          capabilities: [
            { type: 'text', quality: 'excellent' },
            { type: 'creative', quality: 'excellent' },
            { type: 'analysis', quality: 'excellent' },
            { type: 'code', quality: 'excellent' }
          ]
        },
        {
          id: 'gpt-4',
          name: 'gpt-4',
          displayName: 'GPT-4',
          maxTokens: 8192,
          contextWindow: 8192,
          costPer1kTokens: 0.03,
          capabilities: [
            { type: 'text', quality: 'excellent' },
            { type: 'creative', quality: 'excellent' },
            { type: 'analysis', quality: 'excellent' }
          ]
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'gpt-3.5-turbo',
          displayName: 'GPT-3.5 Turbo',
          maxTokens: 4096,
          contextWindow: 16384,
          costPer1kTokens: 0.002,
          capabilities: [
            { type: 'text', quality: 'good' },
            { type: 'creative', quality: 'good' },
            { type: 'analysis', quality: 'good' }
          ]
        }
      ],
      supportsStreaming: true,
      costPerToken: 0.00001,
      maxTokens: 4096,
      contextWindow: 128000,
      features: [
        { id: 'function-calling', name: 'Function Calling', description: 'Execute structured function calls', enabled: true },
        { id: 'json-mode', name: 'JSON Mode', description: 'Force JSON output format', enabled: true },
        { id: 'vision', name: 'Vision', description: 'Analyze images and visual content', enabled: true }
      ],
      status: 'available'
    });

    // Anthropic Claude Provider
    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'claude-3-5-sonnet',
          displayName: 'Claude 3.5 Sonnet',
          maxTokens: 8192,
          contextWindow: 200000,
          costPer1kTokens: 0.003,
          capabilities: [
            { type: 'text', quality: 'excellent' },
            { type: 'creative', quality: 'excellent' },
            { type: 'analysis', quality: 'excellent' },
            { type: 'code', quality: 'excellent' }
          ]
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'claude-3-haiku',
          displayName: 'Claude 3 Haiku',
          maxTokens: 4096,
          contextWindow: 200000,
          costPer1kTokens: 0.00025,
          capabilities: [
            { type: 'text', quality: 'good' },
            { type: 'creative', quality: 'good' },
            { type: 'analysis', quality: 'good' }
          ]
        }
      ],
      supportsStreaming: true,
      costPerToken: 0.000003,
      maxTokens: 8192,
      contextWindow: 200000,
      features: [
        { id: 'large-context', name: 'Large Context Window', description: '200K token context window', enabled: true },
        { id: 'constitutional-ai', name: 'Constitutional AI', description: 'Advanced safety and helpfulness', enabled: true }
      ],
      status: 'unavailable' // Will be available when API keys are configured
    });

    // Google Gemini Provider
    this.providers.set('google', {
      id: 'google',
      name: 'Google Gemini',
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'gemini-1.5-pro',
          displayName: 'Gemini 1.5 Pro',
          maxTokens: 8192,
          contextWindow: 2000000,
          costPer1kTokens: 0.0035,
          capabilities: [
            { type: 'text', quality: 'excellent' },
            { type: 'creative', quality: 'excellent' },
            { type: 'multimodal', quality: 'excellent' },
            { type: 'code', quality: 'excellent' }
          ]
        },
        {
          id: 'gemini-1.5-flash',
          name: 'gemini-1.5-flash',
          displayName: 'Gemini 1.5 Flash',
          maxTokens: 8192,
          contextWindow: 1000000,
          costPer1kTokens: 0.00035,
          capabilities: [
            { type: 'text', quality: 'good' },
            { type: 'creative', quality: 'good' },
            { type: 'multimodal', quality: 'good' }
          ]
        }
      ],
      supportsStreaming: true,
      costPerToken: 0.0000035,
      maxTokens: 8192,
      contextWindow: 2000000,
      features: [
        { id: 'ultra-large-context', name: 'Ultra Large Context', description: '2M token context window', enabled: true },
        { id: 'multimodal', name: 'Multimodal', description: 'Text, image, audio, and video processing', enabled: true },
        { id: 'code-execution', name: 'Code Execution', description: 'Execute and test code', enabled: true }
      ],
      status: 'unavailable'
    });

    // Local LLM Provider (Ollama, LM Studio, etc.)
    this.providers.set('local', {
      id: 'local',
      name: 'Local LLMs',
      models: [
        {
          id: 'llama3.1:8b',
          name: 'llama3.1:8b',
          displayName: 'Llama 3.1 8B',
          maxTokens: 4096,
          contextWindow: 128000,
          costPer1kTokens: 0,
          capabilities: [
            { type: 'text', quality: 'good' },
            { type: 'creative', quality: 'good' },
            { type: 'code', quality: 'good' }
          ]
        },
        {
          id: 'mistral:7b',
          name: 'mistral:7b',
          displayName: 'Mistral 7B',
          maxTokens: 4096,
          contextWindow: 32000,
          costPer1kTokens: 0,
          capabilities: [
            { type: 'text', quality: 'good' },
            { type: 'creative', quality: 'good' }
          ]
        },
        {
          id: 'codellama:13b',
          name: 'codellama:13b',
          displayName: 'Code Llama 13B',
          maxTokens: 4096,
          contextWindow: 16000,
          costPer1kTokens: 0,
          capabilities: [
            { type: 'code', quality: 'excellent' },
            { type: 'text', quality: 'good' }
          ]
        }
      ],
      supportsStreaming: true,
      costPerToken: 0,
      maxTokens: 4096,
      contextWindow: 128000,
      features: [
        { id: 'offline', name: 'Offline Operation', description: 'Works without internet connection', enabled: true },
        { id: 'privacy', name: 'Privacy', description: 'Data stays on your device', enabled: true },
        { id: 'customizable', name: 'Customizable', description: 'Fine-tune and customize models', enabled: true }
      ],
      status: 'unavailable'
    });
  }

  /**
   * Get all available providers
   */
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Set active provider
   */
  setActiveProvider(providerId: string): void {
    if (this.providers.has(providerId)) {
      this.activeProvider = providerId;
    }
  }

  /**
   * Get active provider
   */
  getActiveProvider(): AIProvider | undefined {
    return this.providers.get(this.activeProvider);
  }

  /**
   * Check if provider is available
   */
  async checkProviderStatus(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      switch (providerId) {
        case 'openai':
          return openaiService.isConfigured();
        case 'anthropic':
          // Check Anthropic configuration
          return false; // Will implement when API keys are available
        case 'google':
          // Check Google configuration
          return false; // Will implement when API keys are available
        case 'local':
          // Check if local LLM server is running
          return await this.checkLocalLLMStatus();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking provider ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Generate completion using active provider
   */
  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured');
    }

    const isAvailable = await this.checkProviderStatus(provider.id);
    if (!isAvailable) {
      throw new Error(`Provider ${provider.name} is not available`);
    }

    try {
      switch (provider.id) {
        case 'openai':
          return await this.generateOpenAICompletion(request);
        case 'anthropic':
          return await this.generateAnthropicCompletion(request);
        case 'google':
          return await this.generateGoogleCompletion(request);
        case 'local':
          return await this.generateLocalCompletion(request);
        default:
          throw new Error(`Unsupported provider: ${provider.id}`);
      }
    } catch (error) {
      console.error(`AI completion error (${provider.id}):`, error);
      throw error;
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateStreamingCompletion(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active AI provider configured');
    }

    if (!provider.supportsStreaming) {
      throw new Error(`Provider ${provider.name} does not support streaming`);
    }

    const isAvailable = await this.checkProviderStatus(provider.id);
    if (!isAvailable) {
      throw new Error(`Provider ${provider.name} is not available`);
    }

    try {
      switch (provider.id) {
        case 'openai':
          yield* this.generateOpenAIStreamingCompletion(request);
          break;
        case 'anthropic':
          yield* this.generateAnthropicStreamingCompletion(request);
          break;
        case 'google':
          yield* this.generateGoogleStreamingCompletion(request);
          break;
        case 'local':
          yield* this.generateLocalStreamingCompletion(request);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider.id}`);
      }
    } catch (error) {
      console.error(`AI streaming error (${provider.id}):`, error);
      throw error;
    }
  }

  /**
   * Build context-aware prompt
   */
  buildContextualPrompt(request: AIRequest): string {
    let prompt = request.prompt;
    
    if (request.context) {
      const contextParts: string[] = [];
      
      if (request.context.projectId && request.context.characters?.length) {
        contextParts.push(`Characters: ${request.context.characters.map(c => `${c.name} - ${c.traits.join(', ')}`).join('; ')}`);
      }
      
      if (request.context.worldbuilding?.length) {
        contextParts.push(`World: ${request.context.worldbuilding.map(w => `${w.name}: ${w.description}`).join('; ')}`);
      }
      
      if (request.context.writingStyle) {
        contextParts.push(`Style: ${request.context.writingStyle}`);
      }
      
      if (request.context.genre) {
        contextParts.push(`Genre: ${request.context.genre}`);
      }
      
      if (request.context.previousText) {
        contextParts.push(`Previous context: "${request.context.previousText}"`);
      }
      
      if (contextParts.length > 0) {
        prompt = `Context: ${contextParts.join('\n')}\n\nRequest: ${prompt}`;
      }
    }
    
    return prompt;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, AIUsage> {
    return { ...this.usageStats };
  }

  /**
   * Get request history
   */
  getRequestHistory(): AIResponse[] {
    return [...this.requestHistory];
  }

  /**
   * Clear request history
   */
  clearHistory(): void {
    this.requestHistory = [];
  }

  // Private methods for specific providers

  private async generateOpenAICompletion(request: AIRequest): Promise<AIResponse> {
    const contextualPrompt = this.buildContextualPrompt(request);
    const content = await openaiService.generateCompletion(contextualPrompt, {
      systemPrompt: request.systemPrompt,
      maxTokens: request.options?.maxTokens,
      temperature: request.options?.temperature
    });

    const response: AIResponse = {
      id: this.generateId(),
      content,
      model: request.options?.model || 'gpt-3.5-turbo',
      provider: 'openai',
      usage: {
        promptTokens: this.estimateTokens(contextualPrompt),
        completionTokens: this.estimateTokens(content),
        totalTokens: this.estimateTokens(contextualPrompt + content),
        cost: 0 // Will calculate based on actual usage
      },
      timestamp: Date.now()
    };

    this.requestHistory.push(response);
    this.updateUsageStats('openai', response.usage);
    
    return response;
  }

  private async generateAnthropicCompletion(request: AIRequest): Promise<AIResponse> {
    // Placeholder for Anthropic implementation
    throw new Error('Anthropic provider not yet implemented');
  }

  private async generateGoogleCompletion(request: AIRequest): Promise<AIResponse> {
    // Placeholder for Google implementation
    throw new Error('Google provider not yet implemented');
  }

  private async generateLocalCompletion(request: AIRequest): Promise<AIResponse> {
    // Placeholder for local LLM implementation
    throw new Error('Local LLM provider not yet implemented');
  }

  private async *generateOpenAIStreamingCompletion(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    // Placeholder for OpenAI streaming implementation
    const response = await this.generateOpenAICompletion(request);
    yield {
      id: response.id,
      delta: response.content,
      finished: true,
      usage: response.usage
    };
  }

  private async *generateAnthropicStreamingCompletion(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    throw new Error('Anthropic streaming not yet implemented');
  }

  private async *generateGoogleStreamingCompletion(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    throw new Error('Google streaming not yet implemented');
  }

  private async *generateLocalStreamingCompletion(request: AIRequest): AsyncGenerator<AIStreamResponse, void, unknown> {
    throw new Error('Local LLM streaming not yet implemented');
  }

  private async checkLocalLLMStatus(): Promise<boolean> {
    try {
      // Check if Ollama is running on default port
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private updateUsageStats(provider: string, usage: AIUsage): void {
    if (!this.usageStats[provider]) {
      this.usageStats[provider] = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0
      };
    }

    this.usageStats[provider].promptTokens += usage.promptTokens;
    this.usageStats[provider].completionTokens += usage.completionTokens;
    this.usageStats[provider].totalTokens += usage.totalTokens;
    this.usageStats[provider].cost += usage.cost;
  }
}

export const aiProviderService = new AIProviderService();