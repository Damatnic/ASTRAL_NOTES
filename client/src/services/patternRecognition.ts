/**
 * Pattern Recognition Service
 * Identifies writing patterns and provides insights
 */

export interface WritingPattern {
  id: string;
  type: 'repetition' | 'structure' | 'style' | 'habit';
  pattern: string;
  frequency: number;
  confidence: number;
  suggestion: string;
}

export interface PatternAnalysis {
  patterns: WritingPattern[];
  strengths: string[];
  improvements: string[];
  insights: string[];
}

export class PatternRecognitionService {
  private userPatterns: Map<string, WritingPattern[]> = new Map();

  /**
   * Analyze text for writing patterns
   */
  public analyzePatterns(text: string, userId?: string): PatternAnalysis {
    const patterns = this.identifyPatterns(text);
    const analysis: PatternAnalysis = {
      patterns,
      strengths: this.identifyStrengths(patterns),
      improvements: this.identifyImprovements(patterns),
      insights: this.generateInsights(patterns)
    };

    if (userId) {
      this.updateUserPatterns(userId, patterns);
    }

    return analysis;
  }

  /**
   * Analyze writing patterns (alias for analyzePatterns for API compatibility)
   */
  public analyzeWritingPatterns(text: string, userId?: string): WritingPattern[] {
    const analysis = this.analyzePatterns(text, userId);
    return analysis.patterns; // Return array directly for test compatibility
  }

  /**
   * Get pattern-based recommendations
   */
  public getRecommendations(userId: string): string[] {
    const userPatterns = this.userPatterns.get(userId) || [];
    const recommendations: string[] = [];

    const repetitionPatterns = userPatterns.filter(p => p.type === 'repetition');
    if (repetitionPatterns.length > 0) {
      recommendations.push('Try varying your word choices to avoid repetition');
    }

    const structurePatterns = userPatterns.filter(p => p.type === 'structure');
    if (structurePatterns.length > 2) {
      recommendations.push('Experiment with different sentence structures');
    }

    return recommendations.length > 0 ? recommendations : 
      ['Your writing shows good variety and pattern awareness'];
  }

  /**
   * Track writing habits over time
   */
  public getHabitAnalysis(userId: string): {
    consistentHabits: string[];
    improvingAreas: string[];
    suggestedFocus: string;
  } {
    const patterns = this.userPatterns.get(userId) || [];
    const habits = patterns.filter(p => p.type === 'habit');

    return {
      consistentHabits: habits.map(h => h.pattern),
      improvingAreas: ['Sentence variety', 'Vocabulary expansion'],
      suggestedFocus: habits.length > 0 ? 'Style consistency' : 'Pattern development'
    };
  }

  /**
   * Detect anomalies in writing patterns
   */
  public detectAnomalies(text: string, userId?: string): {
    anomalies: Array<{
      type: 'unusual_length' | 'style_deviation' | 'pattern_break';
      description: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    overallScore: number;
  } {
    const anomalies = [];
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for unusual sentence length
    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength > 40) {
      anomalies.push({
        type: 'unusual_length',
        description: 'Sentences are unusually long',
        severity: 'medium',
        suggestion: 'Consider breaking up longer sentences for clarity'
      });
    }
    
    return {
      anomalies,
      overallScore: Math.max(0, 100 - anomalies.length * 20)
    };
  }

  /**
   * Get stylistic recommendations based on text or patterns
   */
  public getStylisticRecommendations(input: string | WritingPattern[], targetStyle?: string): {
    immediate: string[];
    longTerm: string[];
    priorityAreas: string[];
  } {
    let patterns: WritingPattern[];
    
    // If input is a string, analyze it first
    if (typeof input === 'string') {
      patterns = this.analyzePatterns(input);
    } else {
      patterns = input;
    }
    
    // Ensure patterns is an array
    if (!Array.isArray(patterns)) {
      patterns = [];
    }
    
    const immediate = [];
    const longTerm = [];
    const priorityAreas = [];
    
    const repetitionPatterns = patterns.filter(p => p.type === 'repetition');
    const stylePatterns = patterns.filter(p => p.type === 'style');
    
    if (repetitionPatterns.length > 0) {
      immediate.push('Focus on word variety in your current draft');
      priorityAreas.push('Vocabulary expansion');
    }
    
    if (stylePatterns.length > 2) {
      longTerm.push('Develop consistent style guidelines');
      priorityAreas.push('Style consistency');
    }
    
    return {
      immediate: immediate.length > 0 ? immediate : ['Continue developing your unique voice'],
      longTerm: longTerm.length > 0 ? longTerm : ['Build writing momentum'],
      priorityAreas: priorityAreas.length > 0 ? priorityAreas : ['General improvement']
    };
  }

  // Private helper methods
  private identifyPatterns(text: string): WritingPattern[] {
    const patterns: WritingPattern[] = [];

    // Word repetition patterns
    patterns.push(...this.findRepetitionPatterns(text));
    
    // Sentence structure patterns
    patterns.push(...this.findStructurePatterns(text));
    
    // Style patterns
    patterns.push(...this.findStylePatterns(text));

    return patterns;
  }

  private findRepetitionPatterns(text: string): WritingPattern[] {
    const patterns: WritingPattern[] = [];
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const wordCounts = new Map<string, number>();

    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    wordCounts.forEach((count, word) => {
      if (count > 3) {
        patterns.push({
          id: `rep-${word}`,
          type: 'repetition',
          pattern: `Repeated word: "${word}"`,
          frequency: count,
          confidence: 0.8,
          suggestion: `Consider synonyms for "${word}" to add variety`
        });
      }
    });

    return patterns;
  }

  private findStructurePatterns(text: string): WritingPattern[] {
    const patterns: WritingPattern[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check for similar sentence starts
    const sentenceStarts = sentences.map(s => {
      const words = s.trim().split(/\s+/);
      return words.slice(0, 2).join(' ').toLowerCase();
    });

    const startCounts = new Map<string, number>();
    sentenceStarts.forEach(start => {
      if (start.length > 2) {
        startCounts.set(start, (startCounts.get(start) || 0) + 1);
      }
    });

    startCounts.forEach((count, start) => {
      if (count > 2) {
        patterns.push({
          id: `struct-${start.replace(/\s+/g, '-')}`,
          type: 'structure',
          pattern: `Repeated sentence start: "${start}"`,
          frequency: count,
          confidence: 0.7,
          suggestion: 'Try varying how you begin sentences'
        });
      }
    });

    return patterns;
  }

  private findStylePatterns(text: string): WritingPattern[] {
    const patterns: WritingPattern[] = [];
    
    // Check for passive voice pattern
    const passiveMatches = text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    if (passiveMatches.length > text.split(/\s+/).length * 0.1) {
      patterns.push({
        id: 'style-passive',
        type: 'style',
        pattern: 'Frequent passive voice usage',
        frequency: passiveMatches.length,
        confidence: 0.8,
        suggestion: 'Consider using more active voice for stronger writing'
      });
    }

    // Check for adverb overuse
    const adverbs = text.match(/\b\w+ly\b/gi) || [];
    if (adverbs.length > text.split(/\s+/).length * 0.05) {
      patterns.push({
        id: 'style-adverbs',
        type: 'style',
        pattern: 'High adverb usage',
        frequency: adverbs.length,
        confidence: 0.6,
        suggestion: 'Try using stronger verbs instead of adverbs'
      });
    }

    return patterns;
  }

  private identifyStrengths(patterns: WritingPattern[]): string[] {
    const strengths: string[] = [];
    
    if (patterns.filter(p => p.type === 'repetition').length === 0) {
      strengths.push('Good vocabulary variety');
    }
    
    if (patterns.filter(p => p.type === 'structure').length < 2) {
      strengths.push('Varied sentence structures');
    }
    
    return strengths.length > 0 ? strengths : ['Developing writing patterns'];
  }

  private identifyImprovements(patterns: WritingPattern[]): string[] {
    return patterns.map(p => p.suggestion).slice(0, 3);
  }

  private generateInsights(patterns: WritingPattern[]): string[] {
    const insights: string[] = [];
    
    if (patterns.length > 5) {
      insights.push('Your writing shows consistent patterns - focus on adding variety');
    } else if (patterns.length < 2) {
      insights.push('Your writing shows good natural variation');
    }
    
    const stylePatterns = patterns.filter(p => p.type === 'style');
    if (stylePatterns.length > 0) {
      insights.push('Pay attention to your stylistic tendencies for more polished prose');
    }
    
    return insights.length > 0 ? insights : ['Continue developing your unique writing style'];
  }

  private updateUserPatterns(userId: string, newPatterns: WritingPattern[]): void {
    const existingPatterns = this.userPatterns.get(userId) || [];
    const updatedPatterns = [...existingPatterns, ...newPatterns];
    
    // Keep only recent patterns (last 20)
    if (updatedPatterns.length > 20) {
      updatedPatterns.splice(0, updatedPatterns.length - 20);
    }
    
    this.userPatterns.set(userId, updatedPatterns);
  }
}

// Export singleton instance
export const patternRecognition = new PatternRecognitionService();
