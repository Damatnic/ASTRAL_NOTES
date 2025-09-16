/**
 * AI Writing Assistance Service
 * Provides intelligent writing suggestions and improvements
 */

import { env } from '@/config/env';
import { openaiService } from './ai/openaiService';

export interface WritingSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'tone' | 'expansion' | 'structure';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  position: { start: number; end: number };
  confidence: number;
  reasoning: string;
}

export interface WritingAnalysis {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  readabilityScore: number;
  toneAnalysis: {
    formal: number;
    casual: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  suggestions: WritingSuggestion[];
  topIssues: string[];
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  category: 'creative' | 'analytical' | 'personal' | 'professional';
  prompt: string;
  description: string;
  variables: string[];
}

class AIWritingService {
  private suggestions: WritingSuggestion[] = [];
  private promptTemplates: AIPromptTemplate[] = [
    {
      id: 'creative-brainstorm',
      name: 'Creative Brainstorming',
      category: 'creative',
      prompt: 'Help me brainstorm creative ideas for: {topic}. Provide 5 unique perspectives or angles.',
      description: 'Generate creative ideas and unique perspectives',
      variables: ['topic']
    },
    {
      id: 'expand-idea',
      name: 'Expand This Idea',
      category: 'creative',
      prompt: 'Take this idea and expand it with more detail and examples: "{idea}"',
      description: 'Develop and elaborate on existing ideas',
      variables: ['idea']
    },
    {
      id: 'improve-clarity',
      name: 'Improve Clarity',
      category: 'professional',
      prompt: 'Rewrite this text to be clearer and more concise: "{text}"',
      description: 'Make writing clearer and more direct',
      variables: ['text']
    },
    {
      id: 'change-tone',
      name: 'Adjust Tone',
      category: 'professional',
      prompt: 'Rewrite this text in a {tone} tone: "{text}"',
      description: 'Change the tone while keeping the meaning',
      variables: ['text', 'tone']
    },
    {
      id: 'summarize',
      name: 'Summarize',
      category: 'analytical',
      prompt: 'Summarize this text in {length} sentences: "{text}"',
      description: 'Create concise summaries of longer content',
      variables: ['text', 'length']
    },
    {
      id: 'outline-creator',
      name: 'Create Outline',
      category: 'analytical',
      prompt: 'Create a detailed outline for: {topic}',
      description: 'Generate structured outlines for topics',
      variables: ['topic']
    }
  ];

  /**
   * Analyze text for writing quality and suggestions
   */
  async analyzeText(text: string): Promise<WritingAnalysis> {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Calculate readability (simplified Flesch formula)
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgSentenceLength) - (84.6 * this.calculateSyllables(words) / wordCount)
    ));

    let suggestions: WritingSuggestion[] = [];
    let toneAnalysis = this.analyzeTone(text);

    // Use real AI service if available and configured
    if (env.features.aiEnabled && openaiService.isConfigured() && text.length > 100) {
      try {
        const aiAnalysis = await openaiService.analyzeWriting(text);
        
        // Convert AI suggestions to our format
        suggestions = aiAnalysis.suggestions.map((suggestion, index) => ({
          id: `ai-${Date.now()}-${index}`,
          type: suggestion.type as WritingSuggestion['type'],
          title: suggestion.issue,
          description: suggestion.suggestion,
          originalText: text.substring(0, 50) + '...',
          suggestedText: suggestion.suggestion,
          position: { start: 0, end: text.length },
          confidence: suggestion.confidence,
          reasoning: 'AI-powered analysis'
        }));
      } catch (error) {
        console.warn('AI analysis failed, falling back to local analysis:', error);
        suggestions = this.generateSuggestions(text);
      }
    } else {
      // Fall back to local analysis
      suggestions = this.generateSuggestions(text);
    }

    return {
      wordCount,
      sentenceCount,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
      toneAnalysis,
      suggestions,
      topIssues: this.identifyTopIssues(suggestions)
    };
  }

  /**
   * Generate writing suggestions based on text analysis
   */
  private generateSuggestions(text: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    
    // Grammar suggestions
    const grammarIssues = this.detectGrammarIssues(text);
    suggestions.push(...grammarIssues);
    
    // Style suggestions
    const styleIssues = this.detectStyleIssues(text);
    suggestions.push(...styleIssues);
    
    // Clarity suggestions
    const clarityIssues = this.detectClarityIssues(text);
    suggestions.push(...clarityIssues);

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect grammar issues (simplified patterns)
   */
  private detectGrammarIssues(text: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    
    // Common grammar patterns
    const patterns = [
      {
        regex: /\b(it's)\s+(own|time|way|place)\b/gi,
        type: 'grammar' as const,
        title: 'Possessive vs Contraction',
        description: 'Use "its" (possessive) instead of "it\'s" (contraction)',
        replacement: (match: string) => match.replace(/it's/i, 'its')
      },
      {
        regex: /\b(there|their|they're)\b/gi,
        type: 'grammar' as const,
        title: 'There/Their/They\'re Usage',
        description: 'Check if the correct form is being used',
        replacement: null
      }
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        suggestions.push({
          id: `grammar-${Date.now()}-${Math.random()}`,
          type: pattern.type,
          title: pattern.title,
          description: pattern.description,
          originalText: match[0],
          suggestedText: pattern.replacement ? pattern.replacement(match[0]) : match[0],
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.8,
          reasoning: 'Common grammar pattern detected'
        });
      }
    });

    return suggestions;
  }

  /**
   * Detect style issues
   */
  private detectStyleIssues(text: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    
    // Detect passive voice
    const passivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
    let match;
    while ((match = passivePattern.exec(text)) !== null) {
      suggestions.push({
        id: `style-passive-${Date.now()}-${Math.random()}`,
        type: 'style',
        title: 'Passive Voice',
        description: 'Consider using active voice for stronger writing',
        originalText: match[0],
        suggestedText: 'Consider rephrasing in active voice',
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.6,
        reasoning: 'Passive voice can make writing less direct'
      });
    }

    // Detect redundant phrases
    const redundantPhrases = [
      { phrase: /\bin order to\b/gi, suggestion: 'to' },
      { phrase: /\bdue to the fact that\b/gi, suggestion: 'because' },
      { phrase: /\bat this point in time\b/gi, suggestion: 'now' }
    ];

    redundantPhrases.forEach(({ phrase, suggestion }) => {
      let match;
      while ((match = phrase.exec(text)) !== null) {
        suggestions.push({
          id: `style-redundant-${Date.now()}-${Math.random()}`,
          type: 'style',
          title: 'Redundant Phrase',
          description: `Consider replacing with "${suggestion}"`,
          originalText: match[0],
          suggestedText: suggestion,
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.7,
          reasoning: 'Simpler phrasing improves clarity'
        });
      }
    });

    return suggestions;
  }

  /**
   * Detect clarity issues
   */
  private detectClarityIssues(text: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    
    // Detect overly long sentences
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length > 25) {
        const sentenceStart = text.indexOf(sentence.trim());
        suggestions.push({
          id: `clarity-long-sentence-${index}`,
          type: 'clarity',
          title: 'Long Sentence',
          description: 'Consider breaking this sentence into shorter ones',
          originalText: sentence.trim(),
          suggestedText: 'Consider splitting into multiple sentences',
          position: { start: sentenceStart, end: sentenceStart + sentence.length },
          confidence: 0.7,
          reasoning: 'Shorter sentences improve readability'
        });
      }
    });

    return suggestions;
  }

  /**
   * Analyze tone of the text
   */
  private analyzeTone(text: string): WritingAnalysis['toneAnalysis'] {
    const words = text.toLowerCase().split(/\s+/);
    
    const formalWords = ['therefore', 'furthermore', 'consequently', 'nevertheless', 'moreover'];
    const casualWords = ['gonna', 'kinda', 'yeah', 'okay', 'cool', 'awesome'];
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor'];
    
    const formal = this.calculateWordScore(words, formalWords);
    const casual = this.calculateWordScore(words, casualWords);
    const positive = this.calculateWordScore(words, positiveWords);
    const negative = this.calculateWordScore(words, negativeWords);
    const neutral = Math.max(0, 1 - formal - casual - positive - negative);

    return { formal, casual, positive, negative, neutral };
  }

  /**
   * Calculate word score based on presence of specific words
   */
  private calculateWordScore(words: string[], targetWords: string[]): number {
    const matches = words.filter(word => targetWords.includes(word)).length;
    return Math.min(1, matches / Math.max(1, words.length / 10));
  }

  /**
   * Calculate syllables in words (simplified)
   */
  private calculateSyllables(words: string[]): number {
    return words.reduce((total, word) => {
      const syllables = word.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]{1,2}/g);
      return total + Math.max(1, syllables ? syllables.length : 1);
    }, 0);
  }

  /**
   * Identify top issues from suggestions
   */
  private identifyTopIssues(suggestions: WritingSuggestion[]): string[] {
    const issueCounts = suggestions.reduce((counts, suggestion) => {
      counts[suggestion.type] = (counts[suggestion.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  /**
   * Get prompt templates by category
   */
  getPromptTemplates(category?: string): AIPromptTemplate[] {
    if (category) {
      return this.promptTemplates.filter(template => template.category === category);
    }
    return this.promptTemplates;
  }

  /**
   * Process AI prompt with variables
   */
  processPrompt(templateId: string, variables: Record<string, string>): string {
    const template = this.promptTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let processedPrompt = template.prompt;
    Object.entries(variables).forEach(([key, value]) => {
      processedPrompt = processedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return processedPrompt;
  }

  /**
   * Generate content suggestions based on context
   */
  async generateContentSuggestions(context: string, type: 'continuation' | 'expansion' | 'alternative'): Promise<string[]> {
    // Use real AI service if available and configured
    if (env.features.aiEnabled && openaiService.isConfigured() && context.length > 50) {
      try {
        return await openaiService.generateContentSuggestions(context, type);
      } catch (error) {
        console.warn('AI content generation failed, falling back to mock suggestions:', error);
      }
    }

    // Fall back to mock suggestions
    const suggestions = [];
    
    switch (type) {
      case 'continuation':
        suggestions.push(
          'Based on the context, you might continue with...',
          'This could lead to an exploration of...',
          'Consider developing this theme further by...'
        );
        break;
      case 'expansion':
        suggestions.push(
          'Add more detail about the emotional impact...',
          'Include specific examples to illustrate...',
          'Explain the broader implications of...'
        );
        break;
      case 'alternative':
        suggestions.push(
          'An alternative perspective might be...',
          'You could approach this differently by...',
          'Consider reframing this as...'
        );
        break;
    }

    return suggestions;
  }

  /**
   * Smart word suggestions based on context
   */
  getWordSuggestions(word: string, context: string): string[] {
    // Simplified word suggestion logic
    const synonyms: Record<string, string[]> = {
      'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb'],
      'bad': ['poor', 'inadequate', 'disappointing', 'substandard', 'inferior'],
      'big': ['large', 'enormous', 'massive', 'substantial', 'significant'],
      'small': ['tiny', 'minute', 'compact', 'petite', 'minimal'],
      'said': ['stated', 'declared', 'mentioned', 'expressed', 'articulated'],
      'very': ['extremely', 'exceptionally', 'remarkably', 'significantly', 'particularly']
    };

    return synonyms[word.toLowerCase()] || [];
  }
}

export const aiWritingService = new AIWritingService();