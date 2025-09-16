/**
 * OpenAI Service Integration
 * Real AI service implementation using OpenAI API
 */

import { env } from '@/config/env';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIServiceError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    this.apiKey = env.ai.openaiApiKey;
    this.baseUrl = env.ai.serviceUrl || 'https://api.openai.com/v1';
    this.model = env.ai.model;
    this.maxTokens = env.ai.maxTokens;
    this.temperature = env.ai.temperature;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && env.features.aiEnabled;
  }

  /**
   * Generate text completion using OpenAI
   */
  async generateCompletion(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service is not properly configured. Please check your API key.');
    }

    const messages: OpenAIMessage[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature ?? this.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData: AIServiceError = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No completion generated');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI service error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to generate completion');
    }
  }

  /**
   * Analyze text for writing improvements
   */
  async analyzeWriting(text: string): Promise<{
    suggestions: Array<{
      type: 'grammar' | 'style' | 'clarity' | 'tone';
      issue: string;
      suggestion: string;
      confidence: number;
    }>;
    overallScore: number;
    summary: string;
  }> {
    const systemPrompt = `You are an expert writing assistant. Analyze the provided text and return a JSON response with:
1. An array of specific suggestions for improvement
2. An overall writing quality score (0-100)
3. A brief summary of the text's strengths and areas for improvement

Format your response as valid JSON only, no additional text.`;

    const prompt = `Please analyze this text for writing quality and provide specific suggestions:

"${text}"

Return only a JSON object with the structure:
{
  "suggestions": [
    {
      "type": "grammar|style|clarity|tone",
      "issue": "description of the issue",
      "suggestion": "specific improvement suggestion",
      "confidence": 0.0-1.0
    }
  ],
  "overallScore": 0-100,
  "summary": "brief analysis summary"
}`;

    try {
      const response = await this.generateCompletion(prompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Parse JSON response
      const analysis = JSON.parse(response);
      return analysis;
    } catch (error) {
      console.error('Writing analysis error:', error);
      
      // Return fallback analysis
      return {
        suggestions: [],
        overallScore: 75,
        summary: 'Unable to analyze text at this time. Please try again later.',
      };
    }
  }

  /**
   * Generate content suggestions
   */
  async generateContentSuggestions(
    context: string,
    type: 'continuation' | 'expansion' | 'alternative' | 'opening' | 'conclusion'
  ): Promise<string[]> {
    const typePrompts = {
      continuation: 'Continue this text naturally, maintaining the same tone and style',
      expansion: 'Expand on this text with more detail, examples, or explanation',
      alternative: 'Rewrite this text in a different way while keeping the same meaning',
      opening: 'Create an engaging opening paragraph for this topic',
      conclusion: 'Write a strong conclusion that summarizes and closes this text',
    };

    const systemPrompt = `You are a creative writing assistant. Generate 3 different ${type} suggestions for the provided text. 
Each suggestion should be 1-3 sentences long and maintain consistency with the original writing style.
Return only a JSON array of strings, no additional formatting.`;

    const prompt = `${typePrompts[type]}:

"${context}"

Return 3 suggestions as a JSON array of strings.`;

    try {
      const response = await this.generateCompletion(prompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 300,
      });

      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [response];
    } catch (error) {
      console.error('Content generation error:', error);
      
      // Return fallback suggestions
      return [
        'Consider developing this idea further with more specific details.',
        'This point could be strengthened with a concrete example.',
        'You might explore the implications of this concept in more depth.',
      ];
    }
  }

  /**
   * Process custom prompts with context
   */
  async processCustomPrompt(
    prompt: string,
    context?: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      creativityLevel?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<string> {
    const creativityMap = {
      low: 0.3,
      medium: 0.7,
      high: 1.0,
    };

    const temperature = options.creativityLevel ? 
      creativityMap[options.creativityLevel] : 
      options.temperature || this.temperature;

    const systemPrompt = `You are a helpful writing assistant. Provide thoughtful, creative, and practical responses to writing-related prompts. 
If context is provided, use it to inform your response but don't repeat it unnecessarily.
Be concise but thorough, and maintain a supportive, encouraging tone.`;

    const fullPrompt = context ? 
      `Context: "${context}"\n\nPrompt: ${prompt}` : 
      prompt;

    return await this.generateCompletion(fullPrompt, {
      systemPrompt,
      temperature,
      maxTokens: options.maxTokens || 500,
    });
  }

  /**
   * Generate writing prompts and ideas
   */
  async generateWritingPrompts(
    category: 'creative' | 'personal' | 'professional' | 'academic',
    count: number = 5
  ): Promise<string[]> {
    const categoryPrompts = {
      creative: 'creative writing, fiction, poetry, and imaginative storytelling',
      personal: 'personal reflection, journaling, and self-discovery',
      professional: 'business writing, reports, and professional communication',
      academic: 'research, analysis, and scholarly writing',
    };

    const systemPrompt = `Generate ${count} inspiring and thought-provoking writing prompts for ${categoryPrompts[category]}.
Each prompt should be engaging, specific enough to provide direction, but open enough to allow creativity.
Return only a JSON array of strings.`;

    const prompt = `Create ${count} writing prompts for ${category} writing. Make them inspiring and actionable.`;

    try {
      const response = await this.generateCompletion(prompt, {
        systemPrompt,
        temperature: 0.8,
        maxTokens: 400,
      });

      const prompts = JSON.parse(response);
      return Array.isArray(prompts) ? prompts : [response];
    } catch (error) {
      console.error('Prompt generation error:', error);
      
      // Return fallback prompts
      const fallbackPrompts = {
        creative: [
          'Write about a character who discovers a hidden room in their house.',
          'Describe a world where colors have disappeared.',
          'Tell the story of an object that has been passed down through generations.',
        ],
        personal: [
          'Reflect on a moment that changed your perspective.',
          'Write about a skill you wish you had learned earlier.',
          'Describe your ideal day in detail.',
        ],
        professional: [
          'Analyze a recent industry trend and its implications.',
          'Propose a solution to a workplace challenge.',
          'Write about leadership lessons you\'ve learned.',
        ],
        academic: [
          'Examine the causes and effects of a historical event.',
          'Compare and contrast two different theories.',
          'Analyze the impact of technology on society.',
        ],
      };

      return fallbackPrompts[category] || fallbackPrompts.creative;
    }
  }
}

export const openaiService = new OpenAIService();