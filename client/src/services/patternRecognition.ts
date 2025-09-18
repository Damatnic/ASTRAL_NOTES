import { EventEmitter } from 'events';

export interface WritingPattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  occurrences: PatternOccurrence[];
  frequency: number;
  strength: number; // 0-1, how consistent the pattern is
  impact: 'positive' | 'negative' | 'neutral';
  examples: string[];
  recommendations: string[];
  lastDetected?: Date;
  improvement?: ImprovementSuggestion;
}

export type PatternType = 
  | 'repetition' | 'vocabulary' | 'sentence-structure' | 'paragraph-structure'
  | 'pacing' | 'dialogue' | 'description' | 'transition' | 'character-voice'
  | 'plot-device' | 'theme' | 'tone' | 'style' | 'grammar' | 'punctuation';

export interface PatternOccurrence {
  id: string;
  patternId: string;
  location: TextLocation;
  context: string;
  timestamp: Date;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface TextLocation {
  start: number;
  end: number;
  line?: number;
  paragraph?: number;
  chapter?: string;
  document?: string;
}

export interface ImprovementSuggestion {
  id: string;
  patternId: string;
  type: 'enhancement' | 'correction' | 'alternative' | 'expansion';
  suggestion: string;
  rationale: string;
  examples: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: number; // 0-1
  resources?: LearningResource[];
}

export interface LearningResource {
  type: 'article' | 'video' | 'exercise' | 'example' | 'book';
  title: string;
  url?: string;
  description: string;
  duration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface PatternAnalysis {
  id: string;
  documentId: string;
  timestamp: Date;
  patterns: WritingPattern[];
  strengths: StrengthPattern[];
  weaknesses: WeaknessPattern[];
  opportunities: OpportunityPattern[];
  overallScore: number;
  recommendations: ImprovementPlan;
}

export interface StrengthPattern {
  pattern: WritingPattern;
  consistency: number;
  examples: string[];
  reinforcement?: string;
}

export interface WeaknessPattern {
  pattern: WritingPattern;
  severity: 'minor' | 'moderate' | 'major';
  frequency: number;
  impact: string;
  solution: ImprovementSuggestion;
}

export interface OpportunityPattern {
  type: string;
  description: string;
  potentialImpact: number;
  implementation: string[];
  examples?: string[];
}

export interface ImprovementPlan {
  immediate: ImprovementTask[];
  shortTerm: ImprovementTask[];
  longTerm: ImprovementTask[];
  focusAreas: string[];
  estimatedTimeframe: string;
}

export interface ImprovementTask {
  id: string;
  title: string;
  description: string;
  pattern?: WritingPattern;
  actions: string[];
  metrics: string[];
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completed?: boolean;
}

export interface PatternMetrics {
  totalPatterns: number;
  positivePatterns: number;
  negativePatterns: number;
  improvementRate: number;
  consistencyScore: number;
  diversityScore: number;
  sophisticationLevel: number;
}

export interface WritingFingerprint {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  signature: {
    vocabulary: VocabularySignature;
    structure: StructureSignature;
    style: StyleSignature;
    voice: VoiceSignature;
  };
  evolution: EvolutionTracker[];
}

export interface VocabularySignature {
  uniqueWords: number;
  averageWordLength: number;
  complexityScore: number;
  frequentWords: { word: string; count: number }[];
  rareWords: string[];
  technicalTerms: string[];
}

export interface StructureSignature {
  averageSentenceLength: number;
  averageParagraphLength: number;
  sentenceVariation: number;
  paragraphVariation: number;
  structurePatterns: string[];
}

export interface StyleSignature {
  formalityLevel: number;
  emotionalIntensity: number;
  descriptiveness: number;
  dialogueRatio: number;
  pacingScore: number;
}

export interface VoiceSignature {
  consistency: number;
  distinctiveness: number;
  maturity: number;
  characteristics: string[];
}

export interface EvolutionTracker {
  date: Date;
  metric: string;
  previousValue: number;
  currentValue: number;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

class PatternRecognitionService extends EventEmitter {
  private patterns: Map<string, WritingPattern> = new Map();
  private analyses: Map<string, PatternAnalysis> = new Map();
  private fingerprint: WritingFingerprint | null = null;
  private improvementTasks: Map<string, ImprovementTask> = new Map();
  private patternLibrary: Map<string, PatternTemplate> = new Map();
  private metrics: PatternMetrics = {
    totalPatterns: 0,
    positivePatterns: 0,
    negativePatterns: 0,
    improvementRate: 0,
    consistencyScore: 0,
    diversityScore: 0,
    sophisticationLevel: 0
  };

  constructor() {
    super();
    this.initializePatternLibrary();
    this.loadHistoricalData();
  }

  private initializePatternLibrary(): void {
    const templates: PatternTemplate[] = [
      {
        id: 'repetitive-starts',
        type: 'sentence-structure',
        name: 'Repetitive Sentence Starts',
        detector: (text: string) => this.detectRepetitiveStarts(text),
        impact: 'negative',
        improvement: {
          suggestion: 'Vary your sentence openings',
          examples: ['Instead of "She walked", try "Walking slowly" or "With careful steps"'],
          difficulty: 'easy'
        }
      },
      {
        id: 'passive-voice',
        type: 'grammar',
        name: 'Excessive Passive Voice',
        detector: (text: string) => this.detectPassiveVoice(text),
        impact: 'negative',
        improvement: {
          suggestion: 'Use active voice for stronger writing',
          examples: ['Change "The ball was thrown by John" to "John threw the ball"'],
          difficulty: 'medium'
        }
      },
      {
        id: 'show-dont-tell',
        type: 'style',
        name: 'Telling Instead of Showing',
        detector: (text: string) => this.detectTelling(text),
        impact: 'negative',
        improvement: {
          suggestion: 'Show emotions and states through actions and details',
          examples: ['Instead of "She was angry", write "She clenched her fists, jaw tight"'],
          difficulty: 'hard'
        }
      },
      {
        id: 'varied-sentence-length',
        type: 'sentence-structure',
        name: 'Good Sentence Variation',
        detector: (text: string) => this.detectSentenceVariation(text),
        impact: 'positive',
        improvement: {
          suggestion: 'Maintain this excellent sentence rhythm',
          examples: [],
          difficulty: 'easy'
        }
      },
      {
        id: 'strong-verbs',
        type: 'vocabulary',
        name: 'Strong Verb Usage',
        detector: (text: string) => this.detectStrongVerbs(text),
        impact: 'positive',
        improvement: {
          suggestion: 'Continue using powerful, specific verbs',
          examples: [],
          difficulty: 'medium'
        }
      }
    ];

    templates.forEach(template => {
      this.patternLibrary.set(template.id, template);
    });
  }

  private loadHistoricalData(): void {
    const savedPatterns = localStorage.getItem('writingPatterns');
    if (savedPatterns) {
      const parsed = JSON.parse(savedPatterns);
      Object.entries(parsed).forEach(([id, pattern]) => {
        this.patterns.set(id, pattern as WritingPattern);
      });
    }

    const savedFingerprint = localStorage.getItem('writingFingerprint');
    if (savedFingerprint) {
      this.fingerprint = JSON.parse(savedFingerprint);
    }

    const savedTasks = localStorage.getItem('improvementTasks');
    if (savedTasks) {
      const parsed = JSON.parse(savedTasks);
      Object.entries(parsed).forEach(([id, task]) => {
        this.improvementTasks.set(id, task as ImprovementTask);
      });
    }

    const savedMetrics = localStorage.getItem('patternMetrics');
    if (savedMetrics) {
      this.metrics = JSON.parse(savedMetrics);
    }
  }

  private saveData(): void {
    localStorage.setItem('writingPatterns', 
      JSON.stringify(Object.fromEntries(this.patterns))
    );
    
    if (this.fingerprint) {
      localStorage.setItem('writingFingerprint', JSON.stringify(this.fingerprint));
    }
    
    localStorage.setItem('improvementTasks', 
      JSON.stringify(Object.fromEntries(this.improvementTasks))
    );
    
    localStorage.setItem('patternMetrics', JSON.stringify(this.metrics));
  }

  public analyzeText(text: string, documentId?: string): PatternAnalysis {
    const detectedPatterns: WritingPattern[] = [];
    
    // Run all pattern detectors
    this.patternLibrary.forEach(template => {
      const occurrences = template.detector(text);
      if (occurrences.length > 0) {
        const pattern: WritingPattern = {
          id: `${template.id}-${Date.now()}`,
          type: template.type,
          name: template.name,
          description: `Detected ${occurrences.length} instances`,
          occurrences,
          frequency: occurrences.length / (text.length / 1000), // per 1000 chars
          strength: this.calculatePatternStrength(occurrences),
          impact: template.impact,
          examples: occurrences.slice(0, 3).map(o => o.context),
          recommendations: template.improvement ? [template.improvement.suggestion] : [],
          lastDetected: new Date(),
          improvement: template.improvement ? {
            id: `imp-${Date.now()}`,
            patternId: template.id,
            type: 'correction',
            suggestion: template.improvement.suggestion,
            rationale: 'Improve writing quality',
            examples: template.improvement.examples,
            difficulty: template.improvement.difficulty,
            estimatedImpact: 0.7
          } : undefined
        };
        
        detectedPatterns.push(pattern);
        this.patterns.set(pattern.id, pattern);
      }
    });

    // Categorize patterns
    const strengths = detectedPatterns
      .filter(p => p.impact === 'positive')
      .map(p => ({
        pattern: p,
        consistency: p.strength,
        examples: p.examples,
        reinforcement: `Keep up your ${p.name.toLowerCase()}`
      }));

    const weaknesses = detectedPatterns
      .filter(p => p.impact === 'negative')
      .map(p => ({
        pattern: p,
        severity: this.calculateSeverity(p),
        frequency: p.frequency,
        impact: `This pattern may weaken your writing's ${this.getImpactArea(p.type)}`,
        solution: p.improvement!
      }));

    const opportunities = this.identifyOpportunities(text, detectedPatterns);

    // Create improvement plan
    const recommendations = this.createImprovementPlan(strengths, weaknesses, opportunities);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(strengths, weaknesses);

    const analysis: PatternAnalysis = {
      id: `analysis-${Date.now()}`,
      documentId: documentId || 'unknown',
      timestamp: new Date(),
      patterns: detectedPatterns,
      strengths,
      weaknesses,
      opportunities,
      overallScore,
      recommendations
    };

    this.analyses.set(analysis.id, analysis);
    this.updateMetrics(analysis);
    this.updateFingerprint(text);
    this.saveData();
    
    this.emit('analysisComplete', analysis);
    
    return analysis;
  }

  private detectRepetitiveStarts(text: string): PatternOccurrence[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const occurrences: PatternOccurrence[] = [];
    const startWords: Map<string, number> = new Map();
    
    sentences.forEach((sentence, index) => {
      const firstWord = sentence.trim().split(' ')[0].toLowerCase();
      startWords.set(firstWord, (startWords.get(firstWord) || 0) + 1);
      
      if ((startWords.get(firstWord) || 0) > 2) {
        occurrences.push({
          id: `occ-${Date.now()}-${index}`,
          patternId: 'repetitive-starts',
          location: { start: 0, end: sentence.length },
          context: sentence.trim(),
          timestamp: new Date(),
          confidence: 0.8
        });
      }
    });
    
    return occurrences;
  }

  private detectPassiveVoice(text: string): PatternOccurrence[] {
    const passiveIndicators = /\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi;
    const occurrences: PatternOccurrence[] = [];
    let match;
    
    while ((match = passiveIndicators.exec(text)) !== null) {
      const context = text.substring(
        Math.max(0, match.index - 20),
        Math.min(text.length, match.index + match[0].length + 20)
      );
      
      occurrences.push({
        id: `occ-${Date.now()}-${match.index}`,
        patternId: 'passive-voice',
        location: { start: match.index, end: match.index + match[0].length },
        context,
        timestamp: new Date(),
        confidence: 0.7
      });
    }
    
    return occurrences;
  }

  private detectTelling(text: string): PatternOccurrence[] {
    const tellingPhrases = /\b(was|felt|thought|knew|realized|seemed|looked)\s+(happy|sad|angry|tired|excited|worried|scared)/gi;
    const occurrences: PatternOccurrence[] = [];
    let match;
    
    while ((match = tellingPhrases.exec(text)) !== null) {
      const context = text.substring(
        Math.max(0, match.index - 30),
        Math.min(text.length, match.index + match[0].length + 30)
      );
      
      occurrences.push({
        id: `occ-${Date.now()}-${match.index}`,
        patternId: 'show-dont-tell',
        location: { start: match.index, end: match.index + match[0].length },
        context,
        timestamp: new Date(),
        confidence: 0.75
      });
    }
    
    return occurrences;
  }

  private detectSentenceVariation(text: string): PatternOccurrence[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 3) return [];
    
    const lengths = sentences.map(s => s.split(' ').length);
    const variance = this.calculateVariance(lengths);
    
    if (variance > 20) {
      return [{
        id: `occ-${Date.now()}`,
        patternId: 'varied-sentence-length',
        location: { start: 0, end: text.length },
        context: 'Good sentence length variation detected',
        timestamp: new Date(),
        confidence: 0.9,
        metadata: { variance, averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length }
      }];
    }
    
    return [];
  }

  private detectStrongVerbs(text: string): PatternOccurrence[] {
    const strongVerbs = /\b(sprint|dash|glare|whisper|shriek|grasp|plunge|soar|crumble|ignite)\w*\b/gi;
    const occurrences: PatternOccurrence[] = [];
    let match;
    
    while ((match = strongVerbs.exec(text)) !== null) {
      occurrences.push({
        id: `occ-${Date.now()}-${match.index}`,
        patternId: 'strong-verbs',
        location: { start: match.index, end: match.index + match[0].length },
        context: match[0],
        timestamp: new Date(),
        confidence: 0.95
      });
    }
    
    return occurrences;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDifferences = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDifferences.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculatePatternStrength(occurrences: PatternOccurrence[]): number {
    if (occurrences.length === 0) return 0;
    
    const avgConfidence = occurrences.reduce((sum, o) => sum + o.confidence, 0) / occurrences.length;
    const frequency = Math.min(1, occurrences.length / 10);
    
    return (avgConfidence * 0.7) + (frequency * 0.3);
  }

  private calculateSeverity(pattern: WritingPattern): 'minor' | 'moderate' | 'major' {
    if (pattern.frequency < 2) return 'minor';
    if (pattern.frequency < 5) return 'moderate';
    return 'major';
  }

  private getImpactArea(type: PatternType): string {
    const impactMap: Record<PatternType, string> = {
      'repetition': 'variety and flow',
      'vocabulary': 'word choice and sophistication',
      'sentence-structure': 'readability and rhythm',
      'paragraph-structure': 'organization and coherence',
      'pacing': 'narrative momentum',
      'dialogue': 'character authenticity',
      'description': 'immersion and imagery',
      'transition': 'flow and connectivity',
      'character-voice': 'character consistency',
      'plot-device': 'story structure',
      'theme': 'thematic coherence',
      'tone': 'emotional consistency',
      'style': 'voice and personality',
      'grammar': 'clarity and correctness',
      'punctuation': 'rhythm and clarity'
    };
    
    return impactMap[type] || 'overall quality';
  }

  private identifyOpportunities(text: string, patterns: WritingPattern[]): OpportunityPattern[] {
    const opportunities: OpportunityPattern[] = [];
    
    // Check for missing elements
    if (!patterns.some(p => p.type === 'dialogue')) {
      opportunities.push({
        type: 'dialogue',
        description: 'Consider adding more dialogue to bring characters to life',
        potentialImpact: 0.7,
        implementation: [
          'Break up narrative with character conversations',
          'Use dialogue to reveal character personality',
          'Show conflict through verbal exchanges'
        ]
      });
    }
    
    // Check for description balance
    const descriptionRatio = text.match(/\b(looked|seemed|appeared|was|were)\b/gi)?.length || 0;
    if (descriptionRatio / (text.length / 100) < 2) {
      opportunities.push({
        type: 'sensory-details',
        description: 'Add more sensory details to enhance immersion',
        potentialImpact: 0.6,
        implementation: [
          'Include sight, sound, smell, touch, and taste',
          'Use specific, concrete details',
          'Connect sensory details to emotions'
        ]
      });
    }
    
    return opportunities;
  }

  private createImprovementPlan(
    strengths: StrengthPattern[],
    weaknesses: WeaknessPattern[],
    opportunities: OpportunityPattern[]
  ): ImprovementPlan {
    const immediate: ImprovementTask[] = weaknesses
      .filter(w => w.severity === 'major')
      .map(w => ({
        id: `task-${Date.now()}-${Math.random()}`,
        title: `Fix ${w.pattern.name}`,
        description: w.solution.suggestion,
        pattern: w.pattern,
        actions: w.solution.examples,
        metrics: [`Reduce ${w.pattern.type} issues by 50%`],
        priority: 'high' as const,
        completed: false
      }));

    const shortTerm: ImprovementTask[] = weaknesses
      .filter(w => w.severity === 'moderate')
      .map(w => ({
        id: `task-${Date.now()}-${Math.random()}`,
        title: `Improve ${w.pattern.name}`,
        description: w.solution.suggestion,
        pattern: w.pattern,
        actions: w.solution.examples,
        metrics: [`Address ${w.pattern.type} patterns`],
        priority: 'medium' as const,
        completed: false
      }));

    const longTerm: ImprovementTask[] = opportunities
      .map(o => ({
        id: `task-${Date.now()}-${Math.random()}`,
        title: `Develop ${o.type}`,
        description: o.description,
        actions: o.implementation,
        metrics: [`Implement ${o.type} improvements`],
        priority: 'low' as const,
        completed: false
      }));

    const focusAreas = [
      ...new Set([
        ...weaknesses.map(w => w.pattern.type),
        ...opportunities.map(o => o.type)
      ])
    ].slice(0, 3);

    return {
      immediate,
      shortTerm,
      longTerm,
      focusAreas,
      estimatedTimeframe: `${immediate.length} days for immediate, ${shortTerm.length} weeks for short-term`
    };
  }

  private calculateOverallScore(strengths: StrengthPattern[], weaknesses: WeaknessPattern[]): number {
    const strengthScore = strengths.reduce((sum, s) => sum + s.consistency, 0);
    const weaknessScore = weaknesses.reduce((sum, w) => {
      const severityMultiplier = w.severity === 'major' ? 3 : w.severity === 'moderate' ? 2 : 1;
      return sum + (severityMultiplier * w.frequency);
    }, 0);
    
    const rawScore = (strengthScore * 10) - (weaknessScore * 5);
    return Math.max(0, Math.min(100, 50 + rawScore));
  }

  private updateMetrics(analysis: PatternAnalysis): void {
    this.metrics.totalPatterns = analysis.patterns.length;
    this.metrics.positivePatterns = analysis.strengths.length;
    this.metrics.negativePatterns = analysis.weaknesses.length;
    
    // Track improvement over time
    const previousAnalyses = Array.from(this.analyses.values())
      .filter(a => a.id !== analysis.id)
      .slice(-5);
    
    if (previousAnalyses.length > 0) {
      const previousAvg = previousAnalyses.reduce((sum, a) => sum + a.overallScore, 0) / previousAnalyses.length;
      this.metrics.improvementRate = (analysis.overallScore - previousAvg) / previousAvg;
    }
    
    this.metrics.consistencyScore = analysis.overallScore / 100;
    this.metrics.diversityScore = Math.min(1, analysis.patterns.length / 20);
    this.metrics.sophisticationLevel = this.calculateSophistication(analysis);
  }

  private calculateSophistication(analysis: PatternAnalysis): number {
    let score = 0.5;
    
    if (analysis.strengths.some(s => s.pattern.type === 'vocabulary')) score += 0.1;
    if (analysis.strengths.some(s => s.pattern.type === 'sentence-structure')) score += 0.1;
    if (analysis.strengths.some(s => s.pattern.type === 'style')) score += 0.1;
    if (analysis.weaknesses.filter(w => w.severity === 'major').length === 0) score += 0.2;
    
    return Math.min(1, score);
  }

  private updateFingerprint(text: string): void {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs = text.split(/\n\n+/);
    
    const vocabulary: VocabularySignature = {
      uniqueWords: new Set(words).size,
      averageWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length,
      complexityScore: this.calculateComplexityScore(words),
      frequentWords: this.getFrequentWords(words),
      rareWords: this.getRareWords(words),
      technicalTerms: this.getTechnicalTerms(words)
    };
    
    const structure: StructureSignature = {
      averageSentenceLength: sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length,
      averageParagraphLength: paragraphs.reduce((sum, p) => sum + p.split(' ').length, 0) / paragraphs.length,
      sentenceVariation: this.calculateVariance(sentences.map(s => s.split(' ').length)),
      paragraphVariation: this.calculateVariance(paragraphs.map(p => p.split(' ').length)),
      structurePatterns: this.detectStructurePatterns(text)
    };
    
    const style: StyleSignature = {
      formalityLevel: this.calculateFormality(text),
      emotionalIntensity: this.calculateEmotionalIntensity(text),
      descriptiveness: this.calculateDescriptiveness(text),
      dialogueRatio: this.calculateDialogueRatio(text),
      pacingScore: this.calculatePacing(text)
    };
    
    const voice: VoiceSignature = {
      consistency: 0.8,
      distinctiveness: 0.7,
      maturity: 0.6,
      characteristics: this.identifyVoiceCharacteristics(text)
    };
    
    if (!this.fingerprint) {
      this.fingerprint = {
        id: `fingerprint-${Date.now()}`,
        userId: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        signature: { vocabulary, structure, style, voice },
        evolution: []
      };
    } else {
      // Track evolution
      const evolution: EvolutionTracker[] = [
        {
          date: new Date(),
          metric: 'vocabulary',
          previousValue: this.fingerprint.signature.vocabulary.uniqueWords,
          currentValue: vocabulary.uniqueWords,
          change: vocabulary.uniqueWords - this.fingerprint.signature.vocabulary.uniqueWords,
          trend: vocabulary.uniqueWords > this.fingerprint.signature.vocabulary.uniqueWords ? 'improving' : 'declining'
        }
      ];
      
      this.fingerprint.signature = { vocabulary, structure, style, voice };
      this.fingerprint.updatedAt = new Date();
      this.fingerprint.evolution.push(...evolution);
    }
  }

  private calculateComplexityScore(words: string[]): number {
    const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const longWords = words.filter(w => w.length > 7).length / words.length;
    return Math.min(1, (avgLength / 10) + (longWords * 2));
  }

  private getFrequentWords(words: string[]): { word: string; count: number }[] {
    const counts: Map<string, number> = new Map();
    words.forEach(word => {
      if (word.length > 3) {
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  private getRareWords(words: string[]): string[] {
    const commonWords = new Set(['the', 'and', 'but', 'for', 'with', 'from', 'that', 'this']);
    return words.filter(w => w.length > 7 && !commonWords.has(w)).slice(0, 10);
  }

  private getTechnicalTerms(words: string[]): string[] {
    return words.filter(w => w.length > 10 || /[A-Z]{2,}/.test(w)).slice(0, 10);
  }

  private detectStructurePatterns(text: string): string[] {
    const patterns: string[] = [];
    
    if (text.includes('First,') && text.includes('Second,')) patterns.push('enumeration');
    if (text.includes('However,') || text.includes('Nevertheless,')) patterns.push('contrast');
    if (text.includes('Therefore,') || text.includes('Thus,')) patterns.push('conclusion');
    if (text.includes('For example,') || text.includes('Such as')) patterns.push('exemplification');
    
    return patterns;
  }

  private calculateFormality(text: string): number {
    const contractions = text.match(/\w+'\w+/g)?.length || 0;
    const formalWords = text.match(/\b(furthermore|moreover|nevertheless|consequently)\b/gi)?.length || 0;
    
    return Math.min(1, (formalWords * 0.1) - (contractions * 0.05) + 0.5);
  }

  private calculateEmotionalIntensity(text: string): number {
    const emotionalWords = text.match(/\b(love|hate|amazing|terrible|wonderful|horrible)\b/gi)?.length || 0;
    const exclamations = text.match(/!/g)?.length || 0;
    
    return Math.min(1, (emotionalWords + exclamations) / (text.length / 100));
  }

  private calculateDescriptiveness(text: string): number {
    const adjectives = text.match(/\b(beautiful|large|small|bright|dark|soft|hard|quick|slow)\w*\b/gi)?.length || 0;
    const adverbs = text.match(/\b\w+ly\b/gi)?.length || 0;
    
    return Math.min(1, (adjectives + adverbs) / (text.length / 100));
  }

  private calculateDialogueRatio(text: string): number {
    const dialogue = text.match(/"[^"]+"/g)?.join('').length || 0;
    return dialogue / text.length;
  }

  private calculatePacing(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const shortSentences = sentences.filter(s => s.split(' ').length < 10).length;
    
    return shortSentences / sentences.length;
  }

  private identifyVoiceCharacteristics(text: string): string[] {
    const characteristics: string[] = [];
    
    if (this.calculateFormality(text) > 0.7) characteristics.push('formal');
    if (this.calculateEmotionalIntensity(text) > 0.5) characteristics.push('expressive');
    if (this.calculateDescriptiveness(text) > 0.6) characteristics.push('descriptive');
    if (this.calculatePacing(text) > 0.6) characteristics.push('fast-paced');
    
    return characteristics;
  }

  public getMetrics(): PatternMetrics {
    return this.metrics;
  }

  public getFingerprint(): WritingFingerprint | null {
    return this.fingerprint;
  }

  public getImprovementTasks(status?: 'pending' | 'completed'): ImprovementTask[] {
    const tasks = Array.from(this.improvementTasks.values());
    if (status === 'pending') return tasks.filter(t => !t.completed);
    if (status === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }

  public completeTask(taskId: string): void {
    const task = this.improvementTasks.get(taskId);
    if (task) {
      task.completed = true;
      this.saveData();
      this.emit('taskCompleted', task);
    }
  }

  public exportAnalysis(): string {
    return JSON.stringify({
      patterns: Array.from(this.patterns.values()),
      analyses: Array.from(this.analyses.values()),
      fingerprint: this.fingerprint,
      metrics: this.metrics,
      tasks: Array.from(this.improvementTasks.values()),
      exportDate: new Date()
    }, null, 2);
  }
}

export const patternRecognitionService = new PatternRecognitionService();
export default patternRecognitionService;

interface PatternTemplate {
  id: string;
  type: PatternType;
  name: string;
  detector: (text: string) => PatternOccurrence[];
  impact: 'positive' | 'negative' | 'neutral';
  improvement?: {
    suggestion: string;
    examples: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
}