import { EventEmitter } from 'events';

export interface PredictiveContext {
  currentText: string;
  previousSentences: string[];
  currentParagraph: string;
  documentContext: string;
  genre?: string;
  tone?: string;
  style?: string;
  recentWords: string[];
  timeOfDay: string;
  writingPace: number;
  emotionalState?: string;
}

export interface Prediction {
  id: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph' | 'scene';
  text: string;
  confidence: number;
  relevance: number;
  creativity: number;
  context: string;
  reasoning: string;
  alternatives?: string[];
  metadata?: {
    source?: string;
    pattern?: string;
    frequency?: number;
    userPreference?: number;
  };
}

export interface WritingPattern {
  id: string;
  type: 'syntax' | 'vocabulary' | 'structure' | 'rhythm' | 'transition';
  pattern: string;
  frequency: number;
  examples: string[];
  contexts: string[];
  lastUsed?: Date;
  effectiveness?: number;
}

export interface SmartCompletion {
  id: string;
  trigger: string;
  completions: string[];
  context: string;
  useCount: number;
  lastUsed?: Date;
  customizable: boolean;
  category: 'dialogue' | 'description' | 'action' | 'transition' | 'custom';
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'neural' | 'statistical' | 'hybrid' | 'custom';
  accuracy: number;
  trainingData: number;
  lastTrained: Date;
  parameters: ModelParameters;
  performance: ModelPerformance;
}

export interface ModelParameters {
  temperature: number;
  topK: number;
  topP: number;
  repetitionPenalty: number;
  contextWindow: number;
  beamSize: number;
  maxTokens: number;
}

export interface ModelPerformance {
  averageLatency: number;
  accuracyScore: number;
  userSatisfaction: number;
  predictionRate: number;
  acceptanceRate: number;
}

export interface AutoCompleteSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  predictions: Prediction[];
  accepted: number;
  rejected: number;
  modified: number;
  averageConfidence: number;
  userFeedback?: string;
}

export interface WritingIntention {
  id: string;
  type: 'describe' | 'dialogue' | 'action' | 'transition' | 'emotion' | 'conflict';
  detected: boolean;
  confidence: number;
  suggestedDirection?: string;
  alternatives?: string[];
}

export interface SmartSuggestion {
  id: string;
  type: 'improvement' | 'alternative' | 'expansion' | 'connection' | 'style';
  original: string;
  suggestion: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  accepted?: boolean;
  appliedAt?: Date;
}

export interface PredictiveSettings {
  enabled: boolean;
  autoComplete: boolean;
  suggestionDelay: number;
  minConfidence: number;
  maxSuggestions: number;
  learningEnabled: boolean;
  adaptiveMode: boolean;
  creativityLevel: number;
  contextSensitivity: number;
  preferredStyle?: string;
  blockedPhrases: string[];
}

class PredictiveWritingAssistantService extends EventEmitter {
  private patterns: Map<string, WritingPattern> = new Map();
  private completions: Map<string, SmartCompletion> = new Map();
  private models: Map<string, PredictiveModel> = new Map();
  private sessions: Map<string, AutoCompleteSession> = new Map();
  private currentSession: AutoCompleteSession | null = null;
  private suggestions: SmartSuggestion[] = [];
  private settings: PredictiveSettings = {
    enabled: true,
    autoComplete: true,
    suggestionDelay: 500,
    minConfidence: 0.7,
    maxSuggestions: 5,
    learningEnabled: true,
    adaptiveMode: true,
    creativityLevel: 0.7,
    contextSensitivity: 0.8,
    blockedPhrases: []
  };
  private userVocabulary: Set<string> = new Set();
  private phraseCache: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.initializeModels();
    this.loadUserData();
  }

  private initializeModels(): void {
    const defaultModel: PredictiveModel = {
      id: 'default-model',
      name: 'ASTRAL Predictive Model',
      type: 'hybrid',
      accuracy: 0.85,
      trainingData: 1000000,
      lastTrained: new Date(),
      parameters: {
        temperature: 0.7,
        topK: 50,
        topP: 0.9,
        repetitionPenalty: 1.2,
        contextWindow: 2048,
        beamSize: 5,
        maxTokens: 100
      },
      performance: {
        averageLatency: 50,
        accuracyScore: 0.85,
        userSatisfaction: 0.9,
        predictionRate: 0.95,
        acceptanceRate: 0.6
      }
    };

    this.models.set(defaultModel.id, defaultModel);
  }

  private loadUserData(): void {
    const savedPatterns = localStorage.getItem('predictivePatterns');
    if (savedPatterns) {
      const parsed = JSON.parse(savedPatterns);
      Object.entries(parsed).forEach(([id, pattern]) => {
        this.patterns.set(id, pattern as WritingPattern);
      });
    }

    const savedCompletions = localStorage.getItem('smartCompletions');
    if (savedCompletions) {
      const parsed = JSON.parse(savedCompletions);
      Object.entries(parsed).forEach(([id, completion]) => {
        this.completions.set(id, completion as SmartCompletion);
      });
    }

    const savedVocabulary = localStorage.getItem('userVocabulary');
    if (savedVocabulary) {
      this.userVocabulary = new Set(JSON.parse(savedVocabulary));
    }

    const savedSettings = localStorage.getItem('predictiveSettings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  }

  private saveUserData(): void {
    localStorage.setItem('predictivePatterns', 
      JSON.stringify(Object.fromEntries(this.patterns))
    );
    localStorage.setItem('smartCompletions', 
      JSON.stringify(Object.fromEntries(this.completions))
    );
    localStorage.setItem('userVocabulary', 
      JSON.stringify(Array.from(this.userVocabulary))
    );
    localStorage.setItem('predictiveSettings', JSON.stringify(this.settings));
  }

  public async getPredictions(context: PredictiveContext): Promise<Prediction[]> {
    if (!this.settings.enabled) return [];

    const predictions: Prediction[] = [];
    
    // Start a new session if needed
    if (!this.currentSession) {
      this.startSession();
    }

    // Analyze context and detect intention
    const intention = this.detectWritingIntention(context);
    
    // Generate predictions based on multiple strategies
    const strategies = [
      this.predictNextWord(context),
      this.predictPhrase(context),
      this.predictSentenceCompletion(context),
      intention.detected ? this.predictBasedOnIntention(context, intention) : null,
      this.predictFromPatterns(context),
      this.predictCreative(context)
    ];

    const results = await Promise.all(strategies);
    results.forEach(result => {
      if (result) {
        if (Array.isArray(result)) {
          predictions.push(...result);
        } else {
          predictions.push(result);
        }
      }
    });

    // Filter and rank predictions
    const filtered = this.filterPredictions(predictions);
    const ranked = this.rankPredictions(filtered, context);

    // Limit to max suggestions
    const final = ranked.slice(0, this.settings.maxSuggestions);
    
    // Track predictions
    if (this.currentSession) {
      this.currentSession.predictions.push(...final);
      this.currentSession.averageConfidence = 
        final.reduce((sum, p) => sum + p.confidence, 0) / final.length;
    }

    // Learn from context if enabled
    if (this.settings.learningEnabled) {
      this.learnFromContext(context);
    }

    this.emit('predictions', final);
    return final;
  }

  private detectWritingIntention(context: PredictiveContext): WritingIntention {
    const lastWords = context.currentText.split(' ').slice(-5).join(' ').toLowerCase();
    
    const intentions: WritingIntention[] = [
      {
        id: 'describe',
        type: 'describe',
        detected: /\b(was|were|looked|seemed|appeared)\b/.test(lastWords),
        confidence: 0
      },
      {
        id: 'dialogue',
        type: 'dialogue',
        detected: /\b(said|asked|replied|shouted|whispered|")\b/.test(lastWords),
        confidence: 0
      },
      {
        id: 'action',
        type: 'action',
        detected: /\b(ran|walked|grabbed|pushed|pulled|moved)\b/.test(lastWords),
        confidence: 0
      },
      {
        id: 'transition',
        type: 'transition',
        detected: /\b(then|next|after|before|meanwhile|however)\b/.test(lastWords),
        confidence: 0
      },
      {
        id: 'emotion',
        type: 'emotion',
        detected: /\b(felt|feeling|happy|sad|angry|afraid)\b/.test(lastWords),
        confidence: 0
      }
    ];

    const detected = intentions.find(i => i.detected);
    if (detected) {
      detected.confidence = 0.8;
      detected.suggestedDirection = this.getSuggestedDirection(detected.type, context);
    }

    return detected || intentions[0];
  }

  private getSuggestedDirection(type: string, context: PredictiveContext): string {
    const suggestions: Record<string, string[]> = {
      describe: ['Add sensory details', 'Include atmosphere', 'Describe character reactions'],
      dialogue: ['Show character voice', 'Add dialogue tags', 'Include body language'],
      action: ['Increase pace', 'Add consequences', 'Show character motivation'],
      transition: ['Connect scenes smoothly', 'Show time passage', 'Maintain flow'],
      emotion: ['Show internal conflict', 'Add physical reactions', 'Deepen character insight']
    };

    const options = suggestions[type] || [];
    return options[Math.floor(Math.random() * options.length)];
  }

  private async predictNextWord(context: PredictiveContext): Promise<Prediction> {
    const lastWords = context.currentText.split(' ').slice(-3);
    const trigram = lastWords.join(' ').toLowerCase();
    
    // Check cache first
    const cached = this.phraseCache.get(trigram);
    if (cached && cached.length > 0) {
      return {
        id: `word-${Date.now()}`,
        type: 'word',
        text: cached[0],
        confidence: 0.85,
        relevance: 0.9,
        creativity: 0.3,
        context: 'common pattern',
        reasoning: 'Based on frequently used word combinations'
      };
    }

    // Generate prediction based on patterns
    const commonFollowers: Record<string, string[]> = {
      'in the': ['morning', 'evening', 'distance', 'end', 'beginning'],
      'at the': ['same', 'end', 'beginning', 'top', 'bottom'],
      'on the': ['table', 'floor', 'ground', 'surface', 'edge'],
      'with a': ['smile', 'sigh', 'nod', 'shrug', 'laugh'],
      'and then': ['she', 'he', 'they', 'it', 'suddenly']
    };

    const key = lastWords.slice(-2).join(' ').toLowerCase();
    const options = commonFollowers[key];

    if (options && options.length > 0) {
      return {
        id: `word-${Date.now()}`,
        type: 'word',
        text: options[Math.floor(Math.random() * options.length)],
        confidence: 0.75,
        relevance: 0.8,
        creativity: 0.4,
        context: 'pattern match',
        reasoning: 'Common word sequence detected',
        alternatives: options.slice(0, 3)
      };
    }

    return {
      id: `word-${Date.now()}`,
      type: 'word',
      text: '',
      confidence: 0,
      relevance: 0,
      creativity: 0,
      context: 'no match',
      reasoning: 'No pattern detected'
    };
  }

  private async predictPhrase(context: PredictiveContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const trigger = context.currentText.split(' ').slice(-2).join(' ').toLowerCase();
    
    const phrases = Array.from(this.completions.values())
      .filter(c => c.trigger.toLowerCase().startsWith(trigger));

    phrases.forEach(phrase => {
      phrase.completions.slice(0, 2).forEach(completion => {
        predictions.push({
          id: `phrase-${Date.now()}-${Math.random()}`,
          type: 'phrase',
          text: completion,
          confidence: 0.7 + (phrase.useCount * 0.01),
          relevance: 0.85,
          creativity: 0.5,
          context: phrase.category,
          reasoning: `Common ${phrase.category} phrase pattern`,
          metadata: {
            source: 'user patterns',
            frequency: phrase.useCount
          }
        });
      });
    });

    return predictions;
  }

  private async predictSentenceCompletion(context: PredictiveContext): Promise<Prediction | null> {
    const sentence = context.currentText.split('.').slice(-1)[0].trim();
    if (sentence.length < 10) return null;

    const sentenceStarters: Record<string, string[]> = {
      'she': ['walked toward', 'looked at', 'wondered if', 'realized that'],
      'he': ['turned to', 'reached for', 'thought about', 'decided to'],
      'they': ['moved together', 'agreed that', 'discovered', 'found themselves'],
      'the': ['room was', 'sound of', 'feeling of', 'moment when']
    };

    const firstWord = sentence.split(' ')[0].toLowerCase();
    const options = sentenceStarters[firstWord];

    if (options && sentence.split(' ').length < 5) {
      const completion = options[Math.floor(Math.random() * options.length)];
      return {
        id: `sentence-${Date.now()}`,
        type: 'sentence',
        text: completion,
        confidence: 0.65,
        relevance: 0.75,
        creativity: 0.6,
        context: 'sentence pattern',
        reasoning: 'Completing sentence structure',
        alternatives: options.slice(0, 2)
      };
    }

    return null;
  }

  private async predictBasedOnIntention(
    context: PredictiveContext,
    intention: WritingIntention
  ): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    const intentionPhrases: Record<string, string[]> = {
      describe: [
        'with its',
        'casting shadows',
        'filled with',
        'bathed in light',
        'tinged with'
      ],
      dialogue: [
        'her voice',
        'with a smile',
        'after a pause',
        'leaning forward',
        'eyes narrowing'
      ],
      action: [
        'without hesitation',
        'in one motion',
        'suddenly',
        'with force',
        'carefully'
      ],
      transition: [
        'moments later',
        'as time passed',
        'eventually',
        'in the distance',
        'without warning'
      ],
      emotion: [
        'overwhelming',
        'deep within',
        'washed over',
        'couldn\'t shake',
        'fighting against'
      ]
    };

    const phrases = intentionPhrases[intention.type] || [];
    phrases.slice(0, 2).forEach(phrase => {
      predictions.push({
        id: `intention-${Date.now()}-${Math.random()}`,
        type: 'phrase',
        text: phrase,
        confidence: intention.confidence * 0.9,
        relevance: 0.85,
        creativity: 0.7,
        context: `${intention.type} context`,
        reasoning: `Suggested for ${intention.type} writing`,
        metadata: {
          pattern: intention.type
        }
      });
    });

    return predictions;
  }

  private async predictFromPatterns(context: PredictiveContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const recentText = context.currentText.slice(-100);
    
    this.patterns.forEach(pattern => {
      if (pattern.frequency > 5 && pattern.effectiveness && pattern.effectiveness > 0.7) {
        const applicable = pattern.contexts.some(ctx => 
          recentText.toLowerCase().includes(ctx.toLowerCase())
        );
        
        if (applicable && pattern.examples.length > 0) {
          predictions.push({
            id: `pattern-${Date.now()}-${pattern.id}`,
            type: 'phrase',
            text: pattern.examples[0],
            confidence: pattern.effectiveness,
            relevance: 0.8,
            creativity: 0.5,
            context: pattern.type,
            reasoning: 'Based on your writing patterns',
            metadata: {
              pattern: pattern.pattern,
              frequency: pattern.frequency
            }
          });
        }
      }
    });

    return predictions.slice(0, 2);
  }

  private async predictCreative(context: PredictiveContext): Promise<Prediction | null> {
    if (this.settings.creativityLevel < 0.5) return null;

    const creativePrompts = [
      'like a',
      'as if',
      'reminiscent of',
      'echoing',
      'transforming into',
      'revealing',
      'concealing',
      'betraying'
    ];

    const lastWord = context.currentText.split(' ').slice(-1)[0].toLowerCase();
    if (lastWord.length > 3 && Math.random() < this.settings.creativityLevel) {
      const prompt = creativePrompts[Math.floor(Math.random() * creativePrompts.length)];
      
      return {
        id: `creative-${Date.now()}`,
        type: 'phrase',
        text: prompt,
        confidence: 0.6 * this.settings.creativityLevel,
        relevance: 0.6,
        creativity: 0.9,
        context: 'creative suggestion',
        reasoning: 'Creative writing enhancement',
        metadata: {
          source: 'creative engine'
        }
      };
    }

    return null;
  }

  private filterPredictions(predictions: Prediction[]): Prediction[] {
    return predictions.filter(p => {
      if (!p.text || p.text.trim() === '') return false;
      if (p.confidence < this.settings.minConfidence) return false;
      if (this.settings.blockedPhrases.some(blocked => 
        p.text.toLowerCase().includes(blocked.toLowerCase())
      )) return false;
      
      return true;
    });
  }

  private rankPredictions(predictions: Prediction[], context: PredictiveContext): Prediction[] {
    return predictions.sort((a, b) => {
      // Calculate weighted score
      const scoreA = 
        (a.confidence * 0.4) +
        (a.relevance * 0.35) +
        (a.creativity * this.settings.creativityLevel * 0.25);
      
      const scoreB = 
        (b.confidence * 0.4) +
        (b.relevance * 0.35) +
        (b.creativity * this.settings.creativityLevel * 0.25);
      
      return scoreB - scoreA;
    });
  }

  private learnFromContext(context: PredictiveContext): void {
    // Learn vocabulary
    const words = context.currentText.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) {
        this.userVocabulary.add(word.toLowerCase());
      }
    });

    // Learn phrases
    if (words.length >= 3) {
      for (let i = 0; i < words.length - 2; i++) {
        const trigram = words.slice(i, i + 3).join(' ').toLowerCase();
        const nextWord = words[i + 3];
        
        if (nextWord) {
          const cached = this.phraseCache.get(trigram) || [];
          if (!cached.includes(nextWord)) {
            cached.push(nextWord);
            this.phraseCache.set(trigram, cached.slice(0, 5));
          }
        }
      }
    }

    // Learn patterns
    this.detectAndStorePatterns(context);
    
    // Save periodically
    if (Math.random() < 0.1) {
      this.saveUserData();
    }
  }

  private detectAndStorePatterns(context: PredictiveContext): void {
    const text = context.currentText;
    
    // Detect sentence structure patterns
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (sentence.trim().length > 10) {
        const structure = this.analyzeSentenceStructure(sentence);
        if (structure) {
          const patternId = `struct-${structure.type}`;
          const existing = this.patterns.get(patternId);
          
          if (existing) {
            existing.frequency++;
            existing.examples.push(sentence.trim());
            existing.examples = existing.examples.slice(-5);
            existing.lastUsed = new Date();
          } else {
            this.patterns.set(patternId, {
              id: patternId,
              type: 'structure',
              pattern: structure.pattern,
              frequency: 1,
              examples: [sentence.trim()],
              contexts: [context.genre || 'general'],
              lastUsed: new Date()
            });
          }
        }
      }
    });
  }

  private analyzeSentenceStructure(sentence: string): { type: string; pattern: string } | null {
    const trimmed = sentence.trim();
    
    if (trimmed.startsWith('If ') && trimmed.includes(',')) {
      return { type: 'conditional', pattern: 'If X, then Y' };
    }
    
    if (trimmed.includes(' but ')) {
      return { type: 'contrast', pattern: 'X but Y' };
    }
    
    if (trimmed.includes(' because ')) {
      return { type: 'causal', pattern: 'X because Y' };
    }
    
    if (trimmed.startsWith('When ') || trimmed.startsWith('After ')) {
      return { type: 'temporal', pattern: 'When/After X, Y' };
    }
    
    return null;
  }

  public acceptPrediction(predictionId: string): void {
    if (this.currentSession) {
      this.currentSession.accepted++;
      
      const prediction = this.currentSession.predictions.find(p => p.id === predictionId);
      if (prediction && prediction.metadata?.pattern) {
        const pattern = this.patterns.get(prediction.metadata.pattern);
        if (pattern) {
          pattern.effectiveness = Math.min(1, (pattern.effectiveness || 0.5) + 0.05);
        }
      }
    }
    
    this.emit('predictionAccepted', predictionId);
    this.saveUserData();
  }

  public rejectPrediction(predictionId: string): void {
    if (this.currentSession) {
      this.currentSession.rejected++;
      
      const prediction = this.currentSession.predictions.find(p => p.id === predictionId);
      if (prediction && prediction.metadata?.pattern) {
        const pattern = this.patterns.get(prediction.metadata.pattern);
        if (pattern) {
          pattern.effectiveness = Math.max(0, (pattern.effectiveness || 0.5) - 0.02);
        }
      }
    }
    
    this.emit('predictionRejected', predictionId);
  }

  private startSession(): void {
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      predictions: [],
      accepted: 0,
      rejected: 0,
      modified: 0,
      averageConfidence: 0
    };
    
    this.sessions.set(this.currentSession.id, this.currentSession);
  }

  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.saveUserData();
      this.emit('sessionEnded', this.currentSession);
      this.currentSession = null;
    }
  }

  public updateSettings(settings: Partial<PredictiveSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveUserData();
    this.emit('settingsUpdated', this.settings);
  }

  public getStatistics(): {
    totalPredictions: number;
    acceptanceRate: number;
    averageConfidence: number;
    totalSessions: number;
    patternsLearned: number;
    vocabularySize: number;
  } {
    let totalPredictions = 0;
    let totalAccepted = 0;
    let totalConfidence = 0;
    
    this.sessions.forEach(session => {
      totalPredictions += session.predictions.length;
      totalAccepted += session.accepted;
      totalConfidence += session.averageConfidence * session.predictions.length;
    });
    
    return {
      totalPredictions,
      acceptanceRate: totalPredictions > 0 ? totalAccepted / totalPredictions : 0,
      averageConfidence: totalPredictions > 0 ? totalConfidence / totalPredictions : 0,
      totalSessions: this.sessions.size,
      patternsLearned: this.patterns.size,
      vocabularySize: this.userVocabulary.size
    };
  }

  public trainOnDocument(text: string): void {
    const context: PredictiveContext = {
      currentText: text,
      previousSentences: [],
      currentParagraph: text,
      documentContext: text,
      recentWords: text.split(/\s+/).slice(-20),
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening',
      writingPace: 0
    };
    
    this.learnFromContext(context);
    this.emit('trainingComplete', { wordsProcessed: text.split(/\s+/).length });
  }

  public exportModel(): string {
    return JSON.stringify({
      patterns: Array.from(this.patterns.values()),
      completions: Array.from(this.completions.values()),
      vocabulary: Array.from(this.userVocabulary),
      phraseCache: Array.from(this.phraseCache.entries()),
      settings: this.settings,
      statistics: this.getStatistics(),
      exportDate: new Date()
    }, null, 2);
  }

  public importModel(modelData: string): void {
    try {
      const parsed = JSON.parse(modelData);
      
      if (parsed.patterns) {
        parsed.patterns.forEach((pattern: WritingPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
      }
      
      if (parsed.completions) {
        parsed.completions.forEach((completion: SmartCompletion) => {
          this.completions.set(completion.id, completion);
        });
      }
      
      if (parsed.vocabulary) {
        this.userVocabulary = new Set(parsed.vocabulary);
      }
      
      if (parsed.phraseCache) {
        this.phraseCache = new Map(parsed.phraseCache);
      }
      
      if (parsed.settings) {
        this.settings = parsed.settings;
      }
      
      this.saveUserData();
      this.emit('modelImported', { success: true });
    } catch (error) {
      this.emit('modelImported', { success: false, error });
    }
  }
}

export const predictiveWritingAssistantService = new PredictiveWritingAssistantService();
export default predictiveWritingAssistantService;