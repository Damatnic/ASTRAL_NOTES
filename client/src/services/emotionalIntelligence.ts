import { EventEmitter } from 'events';

export interface EmotionalState {
  id: string;
  timestamp: Date;
  primary: EmotionType;
  secondary?: EmotionType;
  intensity: number; // 0-1
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  confidence: number;
  triggers: string[];
  context: WritingContext;
}

export type EmotionType = 
  | 'joy' | 'excitement' | 'contentment' | 'love' | 'pride'
  | 'sadness' | 'grief' | 'melancholy' | 'loneliness'
  | 'anger' | 'frustration' | 'irritation'
  | 'fear' | 'anxiety' | 'worry' | 'nervousness'
  | 'surprise' | 'curiosity' | 'confusion'
  | 'neutral' | 'focused' | 'contemplative';

export interface WritingContext {
  genre?: string;
  theme?: string;
  tone?: string;
  pace?: number;
  complexity?: number;
  timeOfDay?: string;
  environment?: string;
  recentEvents?: string[];
}

export interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  emotions: EmotionType[];
  frequency: number;
  contexts: WritingContext[];
  impact: 'positive' | 'negative' | 'neutral';
  recommendations?: string[];
}

export interface MoodAwareSuggestion {
  id: string;
  type: 'content' | 'break' | 'exercise' | 'music' | 'environment';
  suggestion: string;
  reason: string;
  expectedImpact: {
    mood: number;
    productivity: number;
    creativity: number;
  };
  priority: 'low' | 'medium' | 'high';
  timing?: 'immediate' | 'soon' | 'later';
}

export interface EmotionalJourney {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  states: EmotionalState[];
  transitions: EmotionalTransition[];
  peakMoments: PeakMoment[];
  overallValence: number;
  emotionalRange: number;
  stability: number;
}

export interface EmotionalTransition {
  from: EmotionType;
  to: EmotionType;
  timestamp: Date;
  trigger?: string;
  smoothness: number; // 0-1, how smooth the transition was
}

export interface PeakMoment {
  timestamp: Date;
  emotion: EmotionType;
  intensity: number;
  context: string;
  wordCount?: number;
  quality?: number;
}

export interface EmotionalIntelligenceMetrics {
  awareness: number; // How well system understands emotions
  regulation: number; // How well system helps regulate emotions
  empathy: number; // How well system responds to emotions
  adaptation: number; // How well system adapts to emotional patterns
}

export interface WritingMoodProfile {
  optimal: {
    emotions: EmotionType[];
    valenceRange: [number, number];
    arousalRange: [number, number];
  };
  productive: {
    emotions: EmotionType[];
    conditions: string[];
  };
  challenging: {
    emotions: EmotionType[];
    triggers: string[];
    solutions: string[];
  };
}

export interface EmotionalIntervention {
  id: string;
  type: 'suggestion' | 'prompt' | 'break' | 'activity';
  triggered: boolean;
  condition: string;
  action: string;
  expectedOutcome: string;
  effectiveness?: number;
  userFeedback?: string;
}

class EmotionalIntelligenceService extends EventEmitter {
  private currentState: EmotionalState | null = null;
  private stateHistory: EmotionalState[] = [];
  private patterns: Map<string, EmotionalPattern> = new Map();
  private journeys: Map<string, EmotionalJourney> = new Map();
  private currentJourney: EmotionalJourney | null = null;
  private moodProfile: WritingMoodProfile;
  private interventions: Map<string, EmotionalIntervention> = new Map();
  private metrics: EmotionalIntelligenceMetrics = {
    awareness: 0.7,
    regulation: 0.6,
    empathy: 0.8,
    adaptation: 0.5
  };
  private emotionLexicon: Map<string, EmotionType> = new Map();
  private contextualTriggers: Map<string, EmotionType[]> = new Map();

  constructor() {
    super();
    this.moodProfile = this.initializeMoodProfile();
    this.initializeEmotionLexicon();
    this.loadHistoricalData();
  }

  private initializeMoodProfile(): WritingMoodProfile {
    return {
      optimal: {
        emotions: ['focused', 'contentment', 'excitement', 'curiosity'],
        valenceRange: [0.3, 0.8],
        arousalRange: [0.4, 0.7]
      },
      productive: {
        emotions: ['focused', 'contentment', 'pride', 'joy'],
        conditions: ['quiet environment', 'morning hours', 'after break', 'goal clarity']
      },
      challenging: {
        emotions: ['frustration', 'anxiety', 'sadness', 'anger'],
        triggers: ['writer\'s block', 'criticism', 'deadline pressure', 'fatigue'],
        solutions: ['take break', 'change environment', 'switch task', 'practice mindfulness']
      }
    };
  }

  private initializeEmotionLexicon(): void {
    // Positive emotions
    this.emotionLexicon.set('happy', 'joy');
    this.emotionLexicon.set('excited', 'excitement');
    this.emotionLexicon.set('proud', 'pride');
    this.emotionLexicon.set('satisfied', 'contentment');
    this.emotionLexicon.set('love', 'love');
    
    // Negative emotions
    this.emotionLexicon.set('sad', 'sadness');
    this.emotionLexicon.set('angry', 'anger');
    this.emotionLexicon.set('frustrated', 'frustration');
    this.emotionLexicon.set('anxious', 'anxiety');
    this.emotionLexicon.set('worried', 'worry');
    this.emotionLexicon.set('scared', 'fear');
    
    // Neutral/Focus states
    this.emotionLexicon.set('focused', 'focused');
    this.emotionLexicon.set('calm', 'neutral');
    this.emotionLexicon.set('thinking', 'contemplative');
    
    // Contextual triggers
    this.contextualTriggers.set('deadline', ['anxiety', 'worry', 'frustration']);
    this.contextualTriggers.set('achievement', ['pride', 'joy', 'excitement']);
    this.contextualTriggers.set('block', ['frustration', 'anxiety', 'sadness']);
    this.contextualTriggers.set('flow', ['focused', 'contentment', 'joy']);
  }

  private loadHistoricalData(): void {
    const savedStates = localStorage.getItem('emotionalStates');
    if (savedStates) {
      this.stateHistory = JSON.parse(savedStates);
    }

    const savedPatterns = localStorage.getItem('emotionalPatterns');
    if (savedPatterns) {
      const parsed = JSON.parse(savedPatterns);
      Object.entries(parsed).forEach(([id, pattern]) => {
        this.patterns.set(id, pattern as EmotionalPattern);
      });
    }

    const savedProfile = localStorage.getItem('writingMoodProfile');
    if (savedProfile) {
      this.moodProfile = JSON.parse(savedProfile);
    }

    const savedMetrics = localStorage.getItem('emotionalMetrics');
    if (savedMetrics) {
      this.metrics = JSON.parse(savedMetrics);
    }
  }

  private saveData(): void {
    localStorage.setItem('emotionalStates', JSON.stringify(this.stateHistory.slice(-100)));
    localStorage.setItem('emotionalPatterns', 
      JSON.stringify(Object.fromEntries(this.patterns))
    );
    localStorage.setItem('writingMoodProfile', JSON.stringify(this.moodProfile));
    localStorage.setItem('emotionalMetrics', JSON.stringify(this.metrics));
  }

  public detectEmotion(
    text: string,
    context: WritingContext,
    physiological?: { heartRate?: number; keystrokePattern?: string }
  ): EmotionalState {
    const emotions = this.analyzeTextEmotions(text);
    const contextualEmotion = this.analyzeContext(context);
    const physiologicalEmotion = physiological ? this.analyzePhysiological(physiological) : null;
    
    // Combine all signals
    const combinedEmotion = this.combineEmotionalSignals(
      emotions,
      contextualEmotion,
      physiologicalEmotion
    );

    const state: EmotionalState = {
      id: `emotion-${Date.now()}`,
      timestamp: new Date(),
      primary: combinedEmotion.primary,
      secondary: combinedEmotion.secondary,
      intensity: combinedEmotion.intensity,
      valence: this.calculateValence(combinedEmotion.primary),
      arousal: this.calculateArousal(combinedEmotion.primary, combinedEmotion.intensity),
      confidence: combinedEmotion.confidence,
      triggers: this.identifyTriggers(text, context),
      context
    };

    this.updateCurrentState(state);
    this.checkForInterventions(state);
    this.updatePatterns(state);

    return state;
  }

  private analyzeTextEmotions(text: string): { emotions: EmotionType[]; weights: number[] } {
    const words = text.toLowerCase().split(/\s+/);
    const emotionCounts: Map<EmotionType, number> = new Map();
    
    words.forEach(word => {
      for (const [keyword, emotion] of this.emotionLexicon) {
        if (word.includes(keyword)) {
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
        }
      }
    });

    const emotions: EmotionType[] = [];
    const weights: number[] = [];
    
    emotionCounts.forEach((count, emotion) => {
      emotions.push(emotion);
      weights.push(count / words.length);
    });

    // Add linguistic analysis
    if (text.includes('!')) {
      emotions.push('excitement');
      weights.push(0.2);
    }
    
    if (text.includes('?')) {
      emotions.push('curiosity');
      weights.push(0.15);
    }

    return { emotions, weights };
  }

  private analyzeContext(context: WritingContext): EmotionType | null {
    // Time-based emotions
    const hour = new Date().getHours();
    if (context.timeOfDay === 'late-night' || hour > 22) {
      return Math.random() > 0.5 ? 'contemplative' : 'melancholy';
    }
    
    // Genre-based emotions
    if (context.genre === 'thriller') {
      return 'anxiety';
    } else if (context.genre === 'romance') {
      return 'love';
    } else if (context.genre === 'comedy') {
      return 'joy';
    }
    
    // Pace-based emotions
    if (context.pace && context.pace > 0.8) {
      return 'excitement';
    } else if (context.pace && context.pace < 0.3) {
      return 'contemplative';
    }
    
    return null;
  }

  private analyzePhysiological(data: { heartRate?: number; keystrokePattern?: string }): EmotionType | null {
    if (data.heartRate) {
      if (data.heartRate > 100) return 'excitement';
      if (data.heartRate > 85) return 'anxiety';
      if (data.heartRate < 60) return 'contemplative';
    }
    
    if (data.keystrokePattern === 'rapid') return 'excitement';
    if (data.keystrokePattern === 'hesitant') return 'anxiety';
    if (data.keystrokePattern === 'steady') return 'focused';
    
    return null;
  }

  private combineEmotionalSignals(
    textEmotions: { emotions: EmotionType[]; weights: number[] },
    contextual: EmotionType | null,
    physiological: EmotionType | null
  ): { primary: EmotionType; secondary?: EmotionType; intensity: number; confidence: number } {
    const emotionScores: Map<EmotionType, number> = new Map();
    
    // Weight text emotions
    textEmotions.emotions.forEach((emotion, i) => {
      emotionScores.set(emotion, (emotionScores.get(emotion) || 0) + textEmotions.weights[i] * 0.5);
    });
    
    // Add contextual emotion
    if (contextual) {
      emotionScores.set(contextual, (emotionScores.get(contextual) || 0) + 0.3);
    }
    
    // Add physiological emotion
    if (physiological) {
      emotionScores.set(physiological, (emotionScores.get(physiological) || 0) + 0.2);
    }
    
    // Sort by score
    const sorted = Array.from(emotionScores.entries()).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
      return { primary: 'neutral', intensity: 0.5, confidence: 0.3 };
    }
    
    return {
      primary: sorted[0][0],
      secondary: sorted.length > 1 ? sorted[1][0] : undefined,
      intensity: Math.min(1, sorted[0][1]),
      confidence: Math.min(1, sorted[0][1] / (sorted.reduce((sum, [, score]) => sum + score, 0) || 1))
    };
  }

  private calculateValence(emotion: EmotionType): number {
    const valenceMap: Record<EmotionType, number> = {
      joy: 0.9, excitement: 0.8, contentment: 0.7, love: 0.85, pride: 0.75,
      sadness: -0.7, grief: -0.9, melancholy: -0.5, loneliness: -0.6,
      anger: -0.6, frustration: -0.5, irritation: -0.3,
      fear: -0.7, anxiety: -0.5, worry: -0.4, nervousness: -0.3,
      surprise: 0.1, curiosity: 0.3, confusion: -0.2,
      neutral: 0, focused: 0.2, contemplative: 0.1
    };
    
    return valenceMap[emotion] || 0;
  }

  private calculateArousal(emotion: EmotionType, intensity: number): number {
    const arousalMap: Record<EmotionType, number> = {
      joy: 0.7, excitement: 0.9, contentment: 0.3, love: 0.5, pride: 0.6,
      sadness: 0.2, grief: 0.3, melancholy: 0.2, loneliness: 0.2,
      anger: 0.8, frustration: 0.7, irritation: 0.5,
      fear: 0.9, anxiety: 0.8, worry: 0.6, nervousness: 0.7,
      surprise: 0.8, curiosity: 0.6, confusion: 0.5,
      neutral: 0.3, focused: 0.5, contemplative: 0.2
    };
    
    return (arousalMap[emotion] || 0.5) * intensity;
  }

  private identifyTriggers(text: string, context: WritingContext): string[] {
    const triggers: string[] = [];
    
    // Check for contextual triggers
    for (const [trigger, emotions] of this.contextualTriggers) {
      if (text.toLowerCase().includes(trigger) || context.recentEvents?.includes(trigger)) {
        triggers.push(trigger);
      }
    }
    
    // Check for specific patterns
    if (text.length < 50 && context.pace && context.pace < 0.2) {
      triggers.push('writer\'s block');
    }
    
    if (text.includes('delete') || text.includes('backspace')) {
      triggers.push('revision frustration');
    }
    
    return triggers;
  }

  private updateCurrentState(state: EmotionalState): void {
    this.currentState = state;
    this.stateHistory.push(state);
    
    // Update journey
    if (this.currentJourney) {
      this.currentJourney.states.push(state);
      
      // Track transition
      if (this.currentJourney.states.length > 1) {
        const previous = this.currentJourney.states[this.currentJourney.states.length - 2];
        this.currentJourney.transitions.push({
          from: previous.primary,
          to: state.primary,
          timestamp: state.timestamp,
          trigger: state.triggers[0],
          smoothness: this.calculateTransitionSmoothness(previous, state)
        });
      }
      
      // Check for peak moments
      if (state.intensity > 0.8) {
        this.currentJourney.peakMoments.push({
          timestamp: state.timestamp,
          emotion: state.primary,
          intensity: state.intensity,
          context: state.context.genre || 'general'
        });
      }
    }
    
    this.emit('emotionalStateChanged', state);
    this.saveData();
  }

  private calculateTransitionSmoothness(from: EmotionalState, to: EmotionalState): number {
    const valenceDiff = Math.abs(from.valence - to.valence);
    const arousalDiff = Math.abs(from.arousal - to.arousal);
    const timeDiff = (to.timestamp.getTime() - from.timestamp.getTime()) / 1000 / 60; // minutes
    
    // Smooth transitions have small emotional distance over reasonable time
    const emotionalDistance = Math.sqrt(valenceDiff ** 2 + arousalDiff ** 2);
    const timeFactoringleton = Math.min(1, timeDiff / 5); // 5 minutes for full smooth transition
    
    return Math.max(0, 1 - (emotionalDistance / timeFactoring));
  }

  private checkForInterventions(state: EmotionalState): void {
    // Check if intervention needed
    const needsIntervention = 
      state.valence < -0.3 ||
      state.arousal > 0.85 ||
      state.primary === 'frustration' ||
      state.primary === 'anxiety' ||
      state.triggers.includes('writer\'s block');
    
    if (needsIntervention) {
      const suggestions = this.generateMoodAwareSuggestions(state);
      suggestions.forEach(suggestion => {
        this.emit('interventionSuggested', suggestion);
      });
    }
  }

  private updatePatterns(state: EmotionalState): void {
    // Look for recurring patterns
    const recentStates = this.stateHistory.slice(-10);
    const emotionCounts: Map<EmotionType, number> = new Map();
    
    recentStates.forEach(s => {
      emotionCounts.set(s.primary, (emotionCounts.get(s.primary) || 0) + 1);
    });
    
    emotionCounts.forEach((count, emotion) => {
      if (count >= 3) {
        const patternId = `pattern-${emotion}`;
        const existing = this.patterns.get(patternId);
        
        if (existing) {
          existing.frequency++;
          existing.contexts.push(state.context);
        } else {
          this.patterns.set(patternId, {
            id: patternId,
            name: `Recurring ${emotion}`,
            description: `Frequent ${emotion} state detected`,
            emotions: [emotion],
            frequency: count,
            contexts: [state.context],
            impact: state.valence < 0 ? 'negative' : 'positive',
            recommendations: this.getPatternRecommendations(emotion)
          });
        }
      }
    });
  }

  private getPatternRecommendations(emotion: EmotionType): string[] {
    const recommendations: Record<EmotionType, string[]> = {
      frustration: [
        'Take a 5-minute break',
        'Try a writing sprint with no editing',
        'Switch to a different scene or chapter',
        'Do a quick brainstorming session'
      ],
      anxiety: [
        'Practice deep breathing',
        'Break task into smaller steps',
        'Focus on progress, not perfection',
        'Set a timer for 15 minutes and just write'
      ],
      sadness: [
        'Write about your feelings',
        'Listen to uplifting music',
        'Connect with your writing community',
        'Review past achievements'
      ],
      joy: [
        'Capture this energy in your writing',
        'Set an ambitious goal for today',
        'Share your progress',
        'Extend your writing session'
      ],
      focused: [
        'Maintain current environment',
        'Set a flow timer',
        'Minimize distractions',
        'Keep momentum going'
      ]
    };
    
    return recommendations[emotion] || ['Continue with awareness'];
  }

  public generateMoodAwareSuggestions(state: EmotionalState): MoodAwareSuggestion[] {
    const suggestions: MoodAwareSuggestion[] = [];
    
    if (state.valence < -0.3) {
      suggestions.push({
        id: `suggest-${Date.now()}-1`,
        type: 'break',
        suggestion: 'Take a 10-minute walk or stretch break',
        reason: 'Physical movement can help reset your emotional state',
        expectedImpact: { mood: 0.3, productivity: 0.2, creativity: 0.1 },
        priority: 'high',
        timing: 'immediate'
      });
    }
    
    if (state.arousal > 0.85) {
      suggestions.push({
        id: `suggest-${Date.now()}-2`,
        type: 'exercise',
        suggestion: 'Try a 5-minute breathing exercise',
        reason: 'Deep breathing can reduce arousal and improve focus',
        expectedImpact: { mood: 0.2, productivity: 0.3, creativity: 0.2 },
        priority: 'high',
        timing: 'immediate'
      });
    }
    
    if (state.primary === 'frustration') {
      suggestions.push({
        id: `suggest-${Date.now()}-3`,
        type: 'content',
        suggestion: 'Switch to freewriting for 10 minutes',
        reason: 'Freewriting can bypass perfectionism and unlock creativity',
        expectedImpact: { mood: 0.2, productivity: 0.1, creativity: 0.4 },
        priority: 'medium',
        timing: 'soon'
      });
    }
    
    if (state.intensity < 0.3) {
      suggestions.push({
        id: `suggest-${Date.now()}-4`,
        type: 'music',
        suggestion: 'Play energizing music or change your environment',
        reason: 'Environmental changes can boost energy and motivation',
        expectedImpact: { mood: 0.3, productivity: 0.3, creativity: 0.2 },
        priority: 'medium',
        timing: 'immediate'
      });
    }
    
    return suggestions;
  }

  public startEmotionalJourney(sessionId: string): void {
    this.currentJourney = {
      id: `journey-${Date.now()}`,
      sessionId,
      startTime: new Date(),
      states: [],
      transitions: [],
      peakMoments: [],
      overallValence: 0,
      emotionalRange: 0,
      stability: 0
    };
    
    this.journeys.set(this.currentJourney.id, this.currentJourney);
    this.emit('journeyStarted', this.currentJourney);
  }

  public endEmotionalJourney(): EmotionalJourney | null {
    if (!this.currentJourney) return null;
    
    this.currentJourney.endTime = new Date();
    
    // Calculate journey metrics
    if (this.currentJourney.states.length > 0) {
      this.currentJourney.overallValence = 
        this.currentJourney.states.reduce((sum, s) => sum + s.valence, 0) / 
        this.currentJourney.states.length;
      
      const valences = this.currentJourney.states.map(s => s.valence);
      this.currentJourney.emotionalRange = Math.max(...valences) - Math.min(...valences);
      
      const transitions = this.currentJourney.transitions;
      this.currentJourney.stability = transitions.length > 0
        ? transitions.reduce((sum, t) => sum + t.smoothness, 0) / transitions.length
        : 1;
    }
    
    this.saveData();
    this.emit('journeyEnded', this.currentJourney);
    
    const journey = this.currentJourney;
    this.currentJourney = null;
    return journey;
  }

  public getEmotionalInsights(): {
    dominantEmotion: EmotionType;
    emotionalBalance: number;
    productivityCorrelation: number;
    optimalConditions: string[];
    warnings: string[];
  } {
    const recentStates = this.stateHistory.slice(-50);
    
    // Find dominant emotion
    const emotionCounts: Map<EmotionType, number> = new Map();
    recentStates.forEach(state => {
      emotionCounts.set(state.primary, (emotionCounts.get(state.primary) || 0) + 1);
    });
    
    const dominantEmotion = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    // Calculate balance
    const positiveStates = recentStates.filter(s => s.valence > 0).length;
    const emotionalBalance = positiveStates / recentStates.length;
    
    // Productivity correlation (simplified)
    const focusedStates = recentStates.filter(s => s.primary === 'focused' || s.primary === 'contentment');
    const productivityCorrelation = focusedStates.length / recentStates.length;
    
    // Optimal conditions
    const optimalStates = recentStates.filter(s => 
      s.valence > 0.3 && s.arousal > 0.3 && s.arousal < 0.7
    );
    const optimalConditions = Array.from(new Set(
      optimalStates.flatMap(s => s.context.environment ? [s.context.environment] : [])
    ));
    
    // Warnings
    const warnings: string[] = [];
    if (emotionalBalance < 0.3) warnings.push('Low emotional balance detected');
    if (productivityCorrelation < 0.2) warnings.push('Productivity may be affected by emotional state');
    
    const anxietyCount = recentStates.filter(s => s.primary === 'anxiety').length;
    if (anxietyCount > recentStates.length * 0.3) warnings.push('High anxiety levels detected');
    
    return {
      dominantEmotion,
      emotionalBalance,
      productivityCorrelation,
      optimalConditions,
      warnings
    };
  }

  public updateMoodProfile(profile: Partial<WritingMoodProfile>): void {
    this.moodProfile = { ...this.moodProfile, ...profile };
    this.saveData();
    this.emit('profileUpdated', this.moodProfile);
  }

  public getMetrics(): EmotionalIntelligenceMetrics {
    return this.metrics;
  }

  public improveMetrics(feedback: { 
    accurate?: boolean; 
    helpful?: boolean; 
    responsive?: boolean 
  }): void {
    if (feedback.accurate !== undefined) {
      this.metrics.awareness = Math.min(1, this.metrics.awareness + (feedback.accurate ? 0.02 : -0.01));
    }
    
    if (feedback.helpful !== undefined) {
      this.metrics.regulation = Math.min(1, this.metrics.regulation + (feedback.helpful ? 0.02 : -0.01));
    }
    
    if (feedback.responsive !== undefined) {
      this.metrics.empathy = Math.min(1, this.metrics.empathy + (feedback.responsive ? 0.02 : -0.01));
    }
    
    // Adaptation improves over time
    this.metrics.adaptation = Math.min(1, this.metrics.adaptation + 0.001);
    
    this.saveData();
    this.emit('metricsUpdated', this.metrics);
  }

  public exportEmotionalData(): string {
    return JSON.stringify({
      stateHistory: this.stateHistory,
      patterns: Array.from(this.patterns.values()),
      journeys: Array.from(this.journeys.values()),
      moodProfile: this.moodProfile,
      metrics: this.metrics,
      exportDate: new Date()
    }, null, 2);
  }
}

export const emotionalIntelligenceService = new EmotionalIntelligenceService();
export default emotionalIntelligenceService;