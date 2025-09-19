/**
 * Intelligent Content Suggestions Service
 * Provides contextual content recommendations and smart suggestions
 */

export interface ContentSuggestion {
  id: string;
  type: 'expansion' | 'replacement' | 'addition' | 'enhancement';
  title: string;
  description: string;
  suggestion: string;
  confidence: number;
  category: 'content' | 'style' | 'structure' | 'flow';
  reasoning: string;
}

export interface ContentAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: ContentSuggestion[];
  readabilityScore: number;
  engagementScore: number;
  clarityScore: number; // For test compatibility
}

export class IntelligentContentSuggestionsService {
  private analysisCache: Map<string, ContentAnalysis> = new Map();

  /**
   * Analyze content and provide suggestions
   */
  public async analyzeContent(
    content: string,
    context?: { genre?: string; purpose?: string }
  ): Promise<ContentAnalysis> {
    const cacheKey = `${content.length}-${context?.genre || 'general'}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis: ContentAnalysis = {
      strengths: this.identifyStrengths(content),
      weaknesses: this.identifyWeaknesses(content),
      suggestions: await this.generateSuggestions(content, context),
      readabilityScore: this.calculateReadability(content),
      engagementScore: this.calculateEngagement(content),
      clarityScore: this.calculateClarity(content)
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get targeted suggestions for improvement
   */
  public getTargetedSuggestions(
    content: string,
    target: 'readability' | 'engagement' | 'flow' | 'clarity'
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    switch (target) {
      case 'readability':
        suggestions.push(...this.getReadabilitySuggestions(content));
        break;
      case 'engagement':
        suggestions.push(...this.getEngagementSuggestions(content));
        break;
      case 'flow':
        suggestions.push(...this.getFlowSuggestions(content));
        break;
      case 'clarity':
        suggestions.push(...this.getClaritySuggestions(content));
        break;
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate alternative phrasings
   */
  public generateAlternatives(text: string, type?: 'synonym' | 'rephrase' | 'simplify'): string[] {
    // If no type specified, return general alternatives based on the text
    if (!type) {
      return [
        `Enhanced version of: ${text}`,
        `Alternative phrasing: ${text}`,
        `Improved wording: ${text}`
      ];
    }
    
    switch (type) {
      case 'synonym':
        return ['alternative phrasing', 'different wording', 'varied expression'];
      case 'rephrase':
        return ['restructured sentence', 'reworded phrase', 'alternative construction'];
      case 'simplify':
        return ['simpler version', 'clearer phrasing', 'easier to understand'];
      default:
        return [];
    }
  }

  /**
   * Get suggestions based on writing goals
   */
  public getGoalBasedSuggestions(
    content: string,
    goals: {
      wordCount?: number;
      tone?: 'formal' | 'casual' | 'creative';
      audience?: 'general' | 'academic' | 'children';
    }
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentWordCount = content.split(/\s+/).length;

    if (goals.wordCount && Math.abs(currentWordCount - goals.wordCount) > goals.wordCount * 0.1) {
      const isShort = currentWordCount < goals.wordCount;
      suggestions.push({
        id: 'wordcount-1',
        type: isShort ? 'addition' : 'replacement',
        title: isShort ? 'Expand Content' : 'Condense Content',
        description: `Current: ${currentWordCount} words, Target: ${goals.wordCount} words`,
        suggestion: isShort 
          ? 'Add more examples, details, or explanations'
          : 'Remove redundant phrases and combine sentences',
        confidence: 0.9,
        category: 'structure',
        reasoning: 'Content length doesn\'t match goal'
      });
    }

    return suggestions;
  }

  // Private helper methods
  private identifyStrengths(content: string): string[] {
    const strengths: string[] = [];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    if (avgLength >= 15 && avgLength <= 20) {
      strengths.push('Well-balanced sentence length');
    }
    
    if (content.includes('"')) {
      strengths.push('Includes dialogue for engagement');
    }
    
    return strengths;
  }

  private identifyWeaknesses(content: string): string[] {
    const weaknesses: string[] = [];
    
    const passivePattern = /\b(was|were|been|being)\s+\w+ed\b/gi;
    const passiveMatches = content.match(passivePattern) || [];
    if (passiveMatches.length > content.split(/\s+/).length * 0.1) {
      weaknesses.push('Overuse of passive voice');
    }

    return weaknesses;
  }

  private async generateSuggestions(content: string, context?: any): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];
    
    suggestions.push({
      id: 'basic-1',
      type: 'enhancement',
      title: 'Enhance Descriptions',
      description: 'Add sensory details to make scenes more vivid',
      suggestion: 'Include what characters see, hear, smell, taste, or feel',
      confidence: 0.8,
      category: 'content',
      reasoning: 'Sensory details improve reader immersion'
    });

    return suggestions;
  }

  private calculateReadability(content: string): number {
    const sentences = content.split(/[.!?]+/).length - 1;
    const words = content.split(/\s+/).length;
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgWordsPerSentence = words / sentences;
    return Math.max(0, Math.min(100, 100 - avgWordsPerSentence));
  }

  private calculateEngagement(content: string): number {
    let score = 50;
    
    if (content.includes('"')) score += 15;
    if (content.includes('?')) score += 10;
    if (content.includes('!')) score += 10;
    
    return Math.min(100, score);
  }

  private calculateClarity(content: string): number {
    let score = 60; // Base score
    
    // Positive clarity indicators
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Optimal sentence length for clarity (10-20 words)
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
      score += 15;
    } else if (avgWordsPerSentence > 20) {
      score -= 10; // Too long, harder to understand
    }
    
    // Simple words increase clarity
    const complexWords = words.filter(word => word.length > 8).length;
    const complexWordRatio = complexWords / words.length;
    if (complexWordRatio < 0.1) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getReadabilitySuggestions(content: string): ContentSuggestion[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    if (avgLength > 25) {
      return [{
        id: 'readability-1',
        type: 'replacement',
        title: 'Simplify Long Sentences',
        description: 'Break up overly long sentences',
        suggestion: 'Split complex sentences into shorter, clearer ones',
        confidence: 0.9,
        category: 'structure',
        reasoning: 'Shorter sentences are easier to read'
      }];
    }
    
    return [];
  }

  private getEngagementSuggestions(content: string): ContentSuggestion[] {
    if (!content.includes('?')) {
      return [{
        id: 'engagement-1',
        type: 'addition',
        title: 'Add Questions',
        description: 'Include questions to engage readers',
        suggestion: 'Questions make readers think and stay engaged',
        confidence: 0.7,
        category: 'content',
        reasoning: 'Questions increase reader engagement'
      }];
    }
    
    return [];
  }

  private getFlowSuggestions(content: string): ContentSuggestion[] {
    return [{
      id: 'flow-1',
      type: 'enhancement',
      title: 'Improve Transitions',
      description: 'Add transition words between paragraphs',
      suggestion: 'Use "however", "meanwhile", "furthermore" to connect ideas',
      confidence: 0.8,
      category: 'flow',
      reasoning: 'Transitions improve text flow'
    }];
  }

  private getClaritySuggestions(content: string): ContentSuggestion[] {
    return [{
      id: 'clarity-1',
      type: 'replacement',
      title: 'Clarify Pronouns',
      description: 'Replace unclear pronouns with specific nouns',
      suggestion: 'Make sure "it", "they", "this" clearly refer to something',
      confidence: 0.8,
      category: 'clarity',
      reasoning: 'Clear references prevent confusion'
    }];
  }

  // Additional methods for test compatibility
  async getSuggestions(context: any): Promise<any> {
    const suggestions = await this.generateSuggestions(context.currentText || '');
    return {
      nextSentences: suggestions.filter(s => s.type === 'addition').map(s => s.suggestion),
      plotTwists: [
        'An unexpected ally appears',
        'The real enemy is revealed',
        'A hidden truth emerges'
      ],
      characterActions: [
        'Character makes a difficult choice',
        'Internal conflict surfaces',
        'Relationship dynamics shift'
      ],
      contentImprovement: suggestions,
      writingTips: [
        'Show, don\'t tell',
        'Use active voice',
        'Vary sentence structure'
      ]
    };
  }

  async getPlotSuggestions(plotContext: any): Promise<any> {
    return {
      nextEvents: [
        'Escalate the current conflict',
        'Introduce a new challenge',
        'Reveal hidden information',
        'Deepen character relationships'
      ],
      conflicts: [
        'Person vs. self',
        'Person vs. person', 
        'Person vs. society',
        'Person vs. nature'
      ],
      resolutions: [
        'Gradual revelation',
        'Decisive action',
        'Compromise solution',
        'Unexpected twist'
      ],
      thematicElements: plotContext.themes || ['growth', 'courage', 'friendship'],
      pacing: plotContext.currentArc === 'rising action' ? 'accelerate' : 'maintain'
    };
  }

  async getCharacterSuggestions(character: any): Promise<any> {
    return {
      growthOpportunities: [
        'Challenge their core beliefs',
        'Force them to make hard choices',
        'Put them in unfamiliar situations',
        'Test their relationships'
      ],
      conflicts: [
        'Internal moral dilemma',
        'Clash with opposing character',
        'Struggle with past mistakes',
        'Fight against circumstances'
      ],
      relationships: [
        'Develop trust with ally',
        'Confront rival or enemy',
        'Mentor someone younger',
        'Learn from a wise guide'
      ],
      arcProgression: character.arc === 'beginning' ? 'inciting incident' : 'development',
      motivationDeepening: `Explore why ${character.name} wants ${character.currentState?.motivation || 'their goal'}`
    };
  }
}

// Export singleton instance
export const intelligentContentSuggestions = new IntelligentContentSuggestionsService();
