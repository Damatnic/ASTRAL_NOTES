/**
 * Emotional Intelligence Service
 * Analyzes and enhances emotional content in writing
 */

export interface EmotionalAnalysis {
  primaryEmotion: string;
  emotionalIntensity: number; // 0-100
  emotionalRange: string[];
  emotions: Record<string, number>; // For test compatibility - changed to object
  sentiment: 'positive' | 'negative' | 'neutral';
  empathyScore: number; // 0-100
  suggestions: string[];
  overallTone: string; // For test compatibility
}

export interface EmotionMapping {
  emotion: string;
  keywords: string[];
  intensity: 'low' | 'medium' | 'high';
  context: string;
}

export class EmotionalIntelligenceService {
  private emotionKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.initializeEmotionKeywords();
  }

  /**
   * Analyze emotional content of text
   */
  public analyzeEmotions(text: string): EmotionalAnalysis {
    const detectedEmotions = this.detectEmotions(text);
    const primaryEmotion = this.getPrimaryEmotion(detectedEmotions);
    const intensity = this.calculateIntensity(text, detectedEmotions);
    const sentiment = this.analyzeSentiment(text);
    const empathyScore = this.calculateEmpathyScore(text);
    
    return {
      primaryEmotion,
      emotionalIntensity: intensity,
      emotionalRange: Object.keys(detectedEmotions),
      emotions: detectedEmotions, // For test compatibility - return object 
      sentiment,
      empathyScore,
      suggestions: this.generateEmotionalSuggestions(primaryEmotion, intensity, empathyScore),
      overallTone: this.determineOverallTone(primaryEmotion, sentiment, intensity)
    };
  }

  /**
   * Analyze emotional tone (alias for analyzeEmotions for API compatibility)
   */
  public analyzeEmotionalTone(text: string): EmotionalAnalysis {
    return this.analyzeEmotions(text);
  }

  /**
   * Enhance emotional depth of text
   */
  public suggestEmotionalEnhancements(text: string, targetEmotion?: string): {
    currentLevel: 'low' | 'medium' | 'high';
    enhancements: string[];
    examples: string[];
  } {
    const analysis = this.analyzeEmotions(text);
    const currentLevel = analysis.emotionalIntensity > 70 ? 'high' : 
                        analysis.emotionalIntensity > 40 ? 'medium' : 'low';
    
    const enhancements = [];
    const examples = [];
    
    if (currentLevel === 'low') {
      enhancements.push('Add more emotional descriptors');
      enhancements.push('Include character reactions and feelings');
      examples.push('Instead of "he left", try "he stormed out, slamming the door"');
    }
    
    if (targetEmotion && targetEmotion !== analysis.primaryEmotion) {
      enhancements.push(`Incorporate more ${targetEmotion}-related language`);
      const keywords = this.emotionKeywords.get(targetEmotion) || [];
      examples.push(`Try using words like: ${keywords.slice(0, 3).join(', ')}`);
    }
    
    return { currentLevel, enhancements, examples };
  }

  /**
   * Get emotion-specific writing prompts
   */
  public getEmotionalPrompts(emotion: string): string[] {
    const prompts: Record<string, string[]> = {
      joy: [
        'Describe a moment when everything felt perfect',
        'Write about a surprise that made you smile',
        'Capture the feeling of achieving a long-held dream'
      ],
      sadness: [
        'Write about saying goodbye to something important',
        'Describe the weight of disappointment',
        'Explore the beauty found in melancholy moments'
      ],
      anger: [
        'Channel frustration into a character\'s dialogue',
        'Describe injustice through vivid imagery',
        'Write about standing up for what\'s right'
      ],
      fear: [
        'Explore what lurks in the shadows',
        'Write about facing your biggest worry',
        'Describe the moment before taking a big risk'
      ],
      love: [
        'Capture the feeling of deep connection',
        'Write about unconditional acceptance',
        'Describe love that transcends words'
      ]
    };
    
    return prompts[emotion.toLowerCase()] || [
      'Explore this emotion through a character\'s experience',
      'Write about a time you felt this way',
      'Describe how this emotion affects the body and mind'
    ];
  }

  /**
   * Get empathy suggestions for writing
   */
  public getEmpathySuggestions(textOrAnalysis: string | EmotionalAnalysis): string[] {
    let analysis: EmotionalAnalysis;
    
    if (typeof textOrAnalysis === 'string') {
      analysis = this.analyzeEmotions(textOrAnalysis);
    } else {
      analysis = textOrAnalysis;
    }
    
    const empathyLevel = analysis.empathyScore > 60 ? 'high' : 
                        analysis.empathyScore > 30 ? 'medium' : 'low';
    
    const suggestions = [
      'Show multiple perspectives on the situation',
      'Include character thoughts and feelings',
      'Use "I understand" or "I can imagine" language'
    ];
    
    if (empathyLevel === 'low') {
      suggestions.push('Try to connect with the emotional experience');
      suggestions.push('Use more empathetic language');
    }
    
    return suggestions;
  }

  /**
   * Adjust emotional tone of text
   */
  public adjustTone(text: string, targetTone: 'warmer' | 'cooler' | 'more_neutral' | 'formal'): string {
    if (targetTone === 'formal') {
      // Handle formal tone adjustment
      return text
        .replace(/I'm/g, 'I am')
        .replace(/gonna/g, 'going to')
        .replace(/\bsad\b/g, 'disappointed')
        .replace(/\bvery\b/g, 'quite');
    }
    
    return this.adjustToneDetailed(text, targetTone).adjustedText;
  }

  /**
   * Adjust emotional tone of text with detailed response
   */
  public adjustToneDetailed(text: string, targetTone: 'warmer' | 'cooler' | 'more_neutral'): {
    adjustedText: string;
    changes: string[];
    explanation: string;
  } {
    let adjustedText = text;
    const changes: string[] = [];
    
    switch (targetTone) {
      case 'warmer':
        if (!text.includes('feel')) {
          changes.push('Added emotional language');
        }
        break;
      case 'cooler':
        adjustedText = text.replace(/\b(amazing|wonderful|terrible|awful)\b/gi, 'significant');
        changes.push('Replaced emotional words with neutral terms');
        break;
      case 'more_neutral':
        adjustedText = text.replace(/[!]+/g, '.');
        changes.push('Reduced exclamation marks');
        break;
    }
    
    return {
      adjustedText,
      changes,
      explanation: `Adjusted text to be ${targetTone.replace('_', ' ')}`
    };
  }

  // Private helper methods
  private detectEmotions(text: string): Record<string, number> {
    const emotions: Record<string, number> = {};
    const words = text.toLowerCase().split(/\W+/);
    
    this.emotionKeywords.forEach((keywords, emotion) => {
      const matches = words.filter(word => keywords.includes(word)).length;
      if (matches > 0) {
        emotions[emotion] = matches;
      }
    });
    
    return emotions;
  }

  private getPrimaryEmotion(emotions: Record<string, number>): string {
    if (Object.keys(emotions).length === 0) return 'neutral';
    
    return Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  private calculateIntensity(text: string, emotions: Record<string, number>): number {
    const totalEmotionalWords = Object.values(emotions).reduce((sum, count) => sum + count, 0);
    const totalWords = text.split(/\W+/).length;
    
    if (totalWords === 0) return 0;
    
    const ratio = totalEmotionalWords / totalWords;
    return Math.min(100, Math.round(ratio * 200)); // Scale to 0-100
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['happy', 'joy', 'love', 'wonderful', 'amazing', 'great', 'excellent'];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'bad', 'horrible'];
    
    const words = text.toLowerCase().split(/\W+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateEmpathyScore(text: string): number {
    const empathyIndicators = [
      'understand', 'feel', 'empathize', 'relate', 'connect',
      'perspective', 'experience', 'struggle', 'journey'
    ];
    
    const words = text.toLowerCase().split(/\W+/);
    const empathyWords = words.filter(word => empathyIndicators.includes(word)).length;
    
    return Math.min(100, empathyWords * 15);
  }

  private determineOverallTone(primaryEmotion: string, sentiment: 'positive' | 'negative' | 'neutral', intensity: number): string {
    if (intensity < 20) {
      return 'neutral';
    }
    
    if (sentiment === 'positive') {
      return intensity > 60 ? 'enthusiastic' : 'positive';
    } else if (sentiment === 'negative') {
      return intensity > 60 ? 'distressed' : 'concerned';
    }
    
    return primaryEmotion || 'neutral';
  }

  private generateEmotionalSuggestions(emotion: string, intensity: number, empathy: number): string[] {
    const suggestions: string[] = [];
    
    if (intensity < 30) {
      suggestions.push('Consider adding more emotional depth to connect with readers');
      suggestions.push('Use sensory details to convey feelings');
    }
    
    if (empathy < 40) {
      suggestions.push('Try to show multiple perspectives on the situation');
      suggestions.push('Help readers understand character motivations');
    }
    
    if (emotion === 'neutral') {
      suggestions.push('Consider what emotions your characters or narrator might be feeling');
    }
    
    return suggestions.length > 0 ? suggestions : ['Your emotional expression is well-balanced'];
  }

  private initializeEmotionKeywords(): void {
    this.emotionKeywords.set('joy', [
      'happy', 'joyful', 'delighted', 'cheerful', 'elated', 'excited',
      'thrilled', 'overjoyed', 'blissful', 'euphoric', 'celebrate'
    ]);
    
    this.emotionKeywords.set('sadness', [
      'sad', 'depressed', 'melancholy', 'sorrowful', 'grief', 'mourn',
      'despair', 'heartbroken', 'dejected', 'gloomy', 'weep', 'cry'
    ]);
    
    this.emotionKeywords.set('anger', [
      'angry', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated',
      'mad', 'livid', 'outraged', 'incensed', 'hostile', 'resentful'
    ]);
    
    this.emotionKeywords.set('fear', [
      'afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous',
      'frightened', 'panic', 'dread', 'alarmed', 'apprehensive'
    ]);
    
    this.emotionKeywords.set('love', [
      'love', 'adore', 'cherish', 'treasure', 'devotion', 'affection',
      'passion', 'romance', 'tender', 'caring', 'beloved', 'darling'
    ]);
  }
}

// Export singleton instance
export const emotionalIntelligence = new EmotionalIntelligenceService();
