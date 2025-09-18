import { EventEmitter } from 'events';

export interface VoiceAnalysis {
  id: string;
  timestamp: Date;
  text: string;
  voiceProfile: VoiceProfile;
  styleMetrics: StyleMetrics;
  consistency: ConsistencyReport;
  recommendations: StyleRecommendation[];
  score: number;
}

export interface VoiceProfile {
  tone: ToneCharacteristics;
  personality: PersonalityTraits;
  distinctiveness: number; // 0-1
  maturity: number; // 0-1
  authenticity: number; // 0-1
  signature: VoiceSignature;
}

export interface ToneCharacteristics {
  formality: number; // 0 (casual) to 1 (formal)
  emotionality: number; // 0 (neutral) to 1 (emotional)
  authority: number; // 0 (tentative) to 1 (authoritative)
  warmth: number; // 0 (cold) to 1 (warm)
  energy: number; // 0 (subdued) to 1 (energetic)
}

export interface PersonalityTraits {
  humor: number;
  seriousness: number;
  creativity: number;
  analytical: number;
  empathy: number;
  confidence: number;
}

export interface VoiceSignature {
  id: string;
  characteristics: string[];
  strengths: string[];
  uniqueElements: string[];
  comparisons: AuthorComparison[];
}

export interface AuthorComparison {
  author: string;
  similarity: number;
  sharedTraits: string[];
  differences: string[];
}

export interface StyleMetrics {
  sentenceVariety: number;
  vocabularyRichness: number;
  rhythmScore: number;
  imageryDensity: number;
  dialogueEffectiveness: number;
  descriptionQuality: number;
  pacingControl: number;
  transitionSmoothness: number;
}

export interface ConsistencyReport {
  overall: number;
  toneConsistency: number;
  voiceConsistency: number;
  styleConsistency: number;
  inconsistencies: Inconsistency[];
  improvements: string[];
}

export interface Inconsistency {
  type: 'tone' | 'voice' | 'style' | 'vocabulary' | 'structure';
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  suggestion: string;
}

export interface StyleRecommendation {
  id: string;
  category: 'voice' | 'style' | 'technique' | 'structure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  examples: StyleExample[];
  exercises: WritingExercise[];
  expectedImpact: number;
}

export interface StyleExample {
  before: string;
  after: string;
  explanation: string;
  technique: string;
}

export interface WritingExercise {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  focus: string;
  instructions: string[];
  targetImprovement: string;
}

export interface RealTimeFeedback {
  id: string;
  timestamp: Date;
  text: string;
  type: 'style' | 'voice' | 'grammar' | 'flow' | 'consistency';
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  autoCorrect?: string;
  confidence: number;
}

export interface StyleGoal {
  id: string;
  name: string;
  description: string;
  targetMetrics: Partial<StyleMetrics>;
  targetVoice: Partial<VoiceProfile>;
  deadline?: Date;
  progress: number;
  milestones: StyleMilestone[];
  exercises: WritingExercise[];
}

export interface StyleMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  achieved: boolean;
  achievedAt?: Date;
}

export interface CoachingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  focus: string;
  initialAnalysis: VoiceAnalysis;
  finalAnalysis?: VoiceAnalysis;
  feedback: RealTimeFeedback[];
  improvements: string[];
  exercises: WritingExercise[];
  notes: string;
}

export interface StyleEvolution {
  id: string;
  userId: string;
  timeline: StyleSnapshot[];
  growthAreas: GrowthArea[];
  achievements: StyleAchievement[];
  currentLevel: 'novice' | 'developing' | 'competent' | 'proficient' | 'expert';
}

export interface StyleSnapshot {
  date: Date;
  voiceProfile: VoiceProfile;
  styleMetrics: StyleMetrics;
  wordsWritten: number;
  uniqueVocabulary: number;
  topStrengths: string[];
  topWeaknesses: string[];
}

export interface GrowthArea {
  name: string;
  startLevel: number;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  exercises: WritingExercise[];
  lastPracticed?: Date;
}

export interface StyleAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockedAt: Date;
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface VoiceModel {
  id: string;
  name: string;
  description: string;
  baseVoice: VoiceProfile;
  variations: VoiceVariation[];
  examples: string[];
  suitableFor: string[];
}

export interface VoiceVariation {
  name: string;
  adjustments: Partial<VoiceProfile>;
  useCase: string;
  example: string;
}

class VoiceStyleCoachService extends EventEmitter {
  private currentVoice: VoiceProfile | null = null;
  private analyses: Map<string, VoiceAnalysis> = new Map();
  private sessions: Map<string, CoachingSession> = new Map();
  private currentSession: CoachingSession | null = null;
  private evolution: StyleEvolution | null = null;
  private goals: Map<string, StyleGoal> = new Map();
  private voiceModels: Map<string, VoiceModel> = new Map();
  private realTimeFeedbackBuffer: RealTimeFeedback[] = [];
  private feedbackThrottle: number = 500; // ms
  private lastFeedbackTime: number = 0;

  constructor() {
    super();
    this.initializeVoiceModels();
    this.loadUserData();
  }

  private initializeVoiceModels(): void {
    const models: VoiceModel[] = [
      {
        id: 'literary-fiction',
        name: 'Literary Fiction',
        description: 'Sophisticated, nuanced voice for literary work',
        baseVoice: {
          tone: {
            formality: 0.7,
            emotionality: 0.6,
            authority: 0.8,
            warmth: 0.5,
            energy: 0.4
          },
          personality: {
            humor: 0.3,
            seriousness: 0.8,
            creativity: 0.9,
            analytical: 0.7,
            empathy: 0.8,
            confidence: 0.7
          },
          distinctiveness: 0.8,
          maturity: 0.9,
          authenticity: 0.85,
          signature: {
            id: 'lit-sig',
            characteristics: ['sophisticated', 'layered', 'symbolic'],
            strengths: ['depth', 'nuance', 'atmosphere'],
            uniqueElements: ['metaphorical language', 'complex themes'],
            comparisons: []
          }
        },
        variations: [
          {
            name: 'Introspective',
            adjustments: { tone: { emotionality: 0.8, energy: 0.3 } },
            useCase: 'Character inner thoughts',
            example: 'The weight of unspoken words settled between them...'
          }
        ],
        examples: [],
        suitableFor: ['novels', 'short stories', 'literary essays']
      },
      {
        id: 'thriller',
        name: 'Thriller/Suspense',
        description: 'Fast-paced, engaging voice for thrillers',
        baseVoice: {
          tone: {
            formality: 0.5,
            emotionality: 0.4,
            authority: 0.7,
            warmth: 0.3,
            energy: 0.9
          },
          personality: {
            humor: 0.2,
            seriousness: 0.7,
            creativity: 0.6,
            analytical: 0.5,
            empathy: 0.4,
            confidence: 0.8
          },
          distinctiveness: 0.7,
          maturity: 0.7,
          authenticity: 0.8,
          signature: {
            id: 'thriller-sig',
            characteristics: ['tense', 'immediate', 'gripping'],
            strengths: ['pacing', 'tension', 'action'],
            uniqueElements: ['short sentences', 'cliffhangers'],
            comparisons: []
          }
        },
        variations: [],
        examples: [],
        suitableFor: ['thrillers', 'mysteries', 'action']
      },
      {
        id: 'conversational',
        name: 'Conversational',
        description: 'Friendly, accessible voice for broad appeal',
        baseVoice: {
          tone: {
            formality: 0.3,
            emotionality: 0.6,
            authority: 0.5,
            warmth: 0.8,
            energy: 0.6
          },
          personality: {
            humor: 0.7,
            seriousness: 0.4,
            creativity: 0.6,
            analytical: 0.4,
            empathy: 0.8,
            confidence: 0.6
          },
          distinctiveness: 0.6,
          maturity: 0.6,
          authenticity: 0.9,
          signature: {
            id: 'conv-sig',
            characteristics: ['friendly', 'relatable', 'engaging'],
            strengths: ['accessibility', 'connection', 'clarity'],
            uniqueElements: ['direct address', 'colloquialisms'],
            comparisons: []
          }
        },
        variations: [],
        examples: [],
        suitableFor: ['blogs', 'memoirs', 'YA fiction']
      }
    ];

    models.forEach(model => {
      this.voiceModels.set(model.id, model);
    });
  }

  private loadUserData(): void {
    const savedAnalyses = localStorage.getItem('voiceAnalyses');
    if (savedAnalyses) {
      const parsed = JSON.parse(savedAnalyses);
      Object.entries(parsed).forEach(([id, analysis]) => {
        this.analyses.set(id, analysis as VoiceAnalysis);
      });
    }

    const savedEvolution = localStorage.getItem('styleEvolution');
    if (savedEvolution) {
      this.evolution = JSON.parse(savedEvolution);
    }

    const savedGoals = localStorage.getItem('styleGoals');
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      Object.entries(parsed).forEach(([id, goal]) => {
        this.goals.set(id, goal as StyleGoal);
      });
    }

    const savedVoice = localStorage.getItem('currentVoice');
    if (savedVoice) {
      this.currentVoice = JSON.parse(savedVoice);
    }
  }

  private saveData(): void {
    localStorage.setItem('voiceAnalyses', 
      JSON.stringify(Object.fromEntries(this.analyses))
    );
    
    if (this.evolution) {
      localStorage.setItem('styleEvolution', JSON.stringify(this.evolution));
    }
    
    localStorage.setItem('styleGoals', 
      JSON.stringify(Object.fromEntries(this.goals))
    );
    
    if (this.currentVoice) {
      localStorage.setItem('currentVoice', JSON.stringify(this.currentVoice));
    }
  }

  public analyzeVoice(text: string): VoiceAnalysis {
    const voiceProfile = this.extractVoiceProfile(text);
    const styleMetrics = this.calculateStyleMetrics(text);
    const consistency = this.assessConsistency(text, voiceProfile, styleMetrics);
    const recommendations = this.generateRecommendations(voiceProfile, styleMetrics, consistency);
    const score = this.calculateOverallScore(voiceProfile, styleMetrics, consistency);

    const analysis: VoiceAnalysis = {
      id: `analysis-${Date.now()}`,
      timestamp: new Date(),
      text,
      voiceProfile,
      styleMetrics,
      consistency,
      recommendations,
      score
    };

    this.analyses.set(analysis.id, analysis);
    this.currentVoice = voiceProfile;
    this.updateEvolution(analysis);
    this.saveData();

    this.emit('analysisComplete', analysis);
    return analysis;
  }

  private extractVoiceProfile(text: string): VoiceProfile {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // Analyze tone
    const tone: ToneCharacteristics = {
      formality: this.assessFormality(text),
      emotionality: this.assessEmotionality(text),
      authority: this.assessAuthority(text),
      warmth: this.assessWarmth(text),
      energy: this.assessEnergy(text)
    };

    // Analyze personality
    const personality: PersonalityTraits = {
      humor: this.detectHumor(text),
      seriousness: this.detectSeriousness(text),
      creativity: this.detectCreativity(text),
      analytical: this.detectAnalytical(text),
      empathy: this.detectEmpathy(text),
      confidence: this.detectConfidence(text)
    };

    // Calculate distinctiveness
    const distinctiveness = this.calculateDistinctiveness(text, tone, personality);
    
    // Calculate maturity
    const maturity = this.calculateMaturity(text, tone, personality);
    
    // Calculate authenticity
    const authenticity = this.calculateAuthenticity(tone, personality);

    // Create signature
    const signature = this.createVoiceSignature(text, tone, personality);

    return {
      tone,
      personality,
      distinctiveness,
      maturity,
      authenticity,
      signature
    };
  }

  private assessFormality(text: string): number {
    const contractions = (text.match(/\w+'\w+/g) || []).length;
    const formalWords = (text.match(/\b(furthermore|moreover|nevertheless|consequently|thereby)\b/gi) || []).length;
    const informalWords = (text.match(/\b(gonna|wanna|kinda|sorta|yeah)\b/gi) || []).length;
    
    const wordCount = text.split(/\s+/).length;
    const formalityScore = (formalWords * 2 - contractions - informalWords * 2) / wordCount;
    
    return Math.max(0, Math.min(1, 0.5 + formalityScore));
  }

  private assessEmotionality(text: string): number {
    const emotionalWords = (text.match(/\b(love|hate|fear|joy|anger|sad|happy|excited|worried|afraid)\b/gi) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    
    const wordCount = text.split(/\s+/).length;
    return Math.min(1, (emotionalWords * 2 + exclamations + questions) / wordCount * 10);
  }

  private assessAuthority(text: string): number {
    const assertiveWords = (text.match(/\b(must|will|certainly|definitely|clearly|obviously|undoubtedly)\b/gi) || []).length;
    const hedgingWords = (text.match(/\b(maybe|perhaps|might|could|possibly|seems|appears)\b/gi) || []).length;
    
    const wordCount = text.split(/\s+/).length;
    const authorityScore = (assertiveWords - hedgingWords) / wordCount;
    
    return Math.max(0, Math.min(1, 0.5 + authorityScore * 10));
  }

  private assessWarmth(text: string): number {
    const warmWords = (text.match(/\b(thank|please|appreciate|kind|gentle|warm|friend|dear|welcome)\b/gi) || []).length;
    const coldWords = (text.match(/\b(cold|harsh|cruel|bitter|indifferent)\b/gi) || []).length;
    
    const wordCount = text.split(/\s+/).length;
    const warmthScore = (warmWords - coldWords) / wordCount;
    
    return Math.max(0, Math.min(1, 0.5 + warmthScore * 10));
  }

  private assessEnergy(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 10).length;
    const actionVerbs = (text.match(/\b(run|jump|fight|dash|leap|crash|explode|rush)\b/gi) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    
    const energyScore = (shortSentences / sentences.length) * 0.5 + 
                        (actionVerbs / text.split(/\s+/).length) * 10 + 
                        (exclamations / sentences.length) * 0.3;
    
    return Math.min(1, energyScore);
  }

  private detectHumor(text: string): number {
    const humorIndicators = (text.match(/\b(joke|funny|laugh|humor|witty|amusing|hilarious|comic)\b/gi) || []).length;
    const wordplay = (text.match(/\b\w+ing\s+\w+ing\b/gi) || []).length; // Simple pattern
    
    return Math.min(1, (humorIndicators + wordplay) / text.split(/\s+/).length * 20);
  }

  private detectSeriousness(text: string): number {
    const seriousWords = (text.match(/\b(important|critical|serious|significant|vital|essential|crucial)\b/gi) || []).length;
    const formalStructures = (text.match(/\b(therefore|thus|hence|accordingly)\b/gi) || []).length;
    
    return Math.min(1, (seriousWords + formalStructures) / text.split(/\s+/).length * 15);
  }

  private detectCreativity(text: string): number {
    const metaphors = (text.match(/\b(like|as if|reminds of|similar to)\b/gi) || []).length;
    const unusualWords = this.countUnusualWords(text);
    const sentenceVariety = this.calculateSentenceVariety(text);
    
    return Math.min(1, (metaphors / 10 + unusualWords / 100 + sentenceVariety) / 3);
  }

  private detectAnalytical(text: string): number {
    const analyticalWords = (text.match(/\b(analyze|examine|investigate|consider|evaluate|assess)\b/gi) || []).length;
    const logicalConnectors = (text.match(/\b(because|therefore|thus|consequently|if.*then)\b/gi) || []).length;
    
    return Math.min(1, (analyticalWords + logicalConnectors) / text.split(/\s+/).length * 20);
  }

  private detectEmpathy(text: string): number {
    const empathyWords = (text.match(/\b(understand|feel|empathize|sympathize|care|support|help)\b/gi) || []).length;
    const pronouns = (text.match(/\b(you|your|we|our|us)\b/gi) || []).length;
    
    return Math.min(1, (empathyWords * 2 + pronouns) / text.split(/\s+/).length * 10);
  }

  private detectConfidence(text: string): number {
    const confidentWords = (text.match(/\b(know|certain|confident|sure|believe|trust)\b/gi) || []).length;
    const uncertainWords = (text.match(/\b(maybe|perhaps|might|unsure|doubt)\b/gi) || []).length;
    
    const confidenceScore = (confidentWords - uncertainWords) / text.split(/\s+/).length;
    return Math.max(0, Math.min(1, 0.5 + confidenceScore * 10));
  }

  private countUnusualWords(text: string): number {
    const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I']);
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 7 && !commonWords.has(w)).length;
  }

  private calculateSentenceVariety(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const lengths = sentences.map(s => s.split(/\s+/).length);
    
    if (lengths.length < 2) return 0.5;
    
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    
    return Math.min(1, variance / 100);
  }

  private calculateDistinctiveness(text: string, tone: ToneCharacteristics, personality: PersonalityTraits): number {
    // Calculate how distinctive the voice is
    const toneDeviation = Object.values(tone).reduce((sum, val) => sum + Math.abs(val - 0.5), 0) / 5;
    const personalityDeviation = Object.values(personality).reduce((sum, val) => sum + Math.abs(val - 0.5), 0) / 6;
    const vocabularyUniqueness = this.countUnusualWords(text) / text.split(/\s+/).length;
    
    return Math.min(1, (toneDeviation + personalityDeviation + vocabularyUniqueness * 5) / 3);
  }

  private calculateMaturity(text: string, tone: ToneCharacteristics, personality: PersonalityTraits): number {
    const complexSentences = text.match(/[^.!?]{50,}[.!?]/g)?.length || 0;
    const totalSentences = text.match(/[^.!?]+[.!?]+/g)?.length || 1;
    const complexityRatio = complexSentences / totalSentences;
    
    const maturityScore = (tone.formality + tone.authority + personality.analytical) / 3 * 0.7 + complexityRatio * 0.3;
    
    return Math.min(1, maturityScore);
  }

  private calculateAuthenticity(tone: ToneCharacteristics, personality: PersonalityTraits): number {
    // Check for internal consistency
    const toneValues = Object.values(tone);
    const personalityValues = Object.values(personality);
    
    const toneConsistency = 1 - (Math.max(...toneValues) - Math.min(...toneValues));
    const personalityConsistency = 1 - (Math.max(...personalityValues) - Math.min(...personalityValues));
    
    return (toneConsistency + personalityConsistency) / 2;
  }

  private createVoiceSignature(text: string, tone: ToneCharacteristics, personality: PersonalityTraits): VoiceSignature {
    const characteristics: string[] = [];
    
    // Tone characteristics
    if (tone.formality > 0.7) characteristics.push('formal');
    if (tone.emotionality > 0.7) characteristics.push('emotional');
    if (tone.authority > 0.7) characteristics.push('authoritative');
    if (tone.warmth > 0.7) characteristics.push('warm');
    if (tone.energy > 0.7) characteristics.push('energetic');
    
    // Personality characteristics
    if (personality.humor > 0.7) characteristics.push('humorous');
    if (personality.creativity > 0.7) characteristics.push('creative');
    if (personality.analytical > 0.7) characteristics.push('analytical');
    
    const strengths = this.identifyStrengths(tone, personality);
    const uniqueElements = this.identifyUniqueElements(text);
    const comparisons = this.compareToKnownAuthors(tone, personality);
    
    return {
      id: `sig-${Date.now()}`,
      characteristics,
      strengths,
      uniqueElements,
      comparisons
    };
  }

  private identifyStrengths(tone: ToneCharacteristics, personality: PersonalityTraits): string[] {
    const strengths: string[] = [];
    
    const allTraits = { ...tone, ...personality };
    const topTraits = Object.entries(allTraits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    topTraits.forEach(([trait, value]) => {
      if (value > 0.7) {
        strengths.push(trait);
      }
    });
    
    return strengths;
  }

  private identifyUniqueElements(text: string): string[] {
    const elements: string[] = [];
    
    if (text.includes('—')) elements.push('em-dash usage');
    if (text.match(/\.\.\./g)) elements.push('ellipsis for effect');
    if (text.match(/^[A-Z]{2,}/m)) elements.push('capitalization for emphasis');
    if (text.match(/".*?".*?".*?"/)) elements.push('nested dialogue');
    
    return elements;
  }

  private compareToKnownAuthors(tone: ToneCharacteristics, personality: PersonalityTraits): AuthorComparison[] {
    // Simplified author comparison
    return [
      {
        author: 'Ernest Hemingway',
        similarity: tone.formality < 0.4 && tone.emotionality < 0.4 ? 0.7 : 0.3,
        sharedTraits: ['concise', 'direct'],
        differences: ['modern vocabulary']
      }
    ];
  }

  private calculateStyleMetrics(text: string): StyleMetrics {
    return {
      sentenceVariety: this.calculateSentenceVariety(text),
      vocabularyRichness: this.calculateVocabularyRichness(text),
      rhythmScore: this.calculateRhythm(text),
      imageryDensity: this.calculateImagery(text),
      dialogueEffectiveness: this.calculateDialogueEffectiveness(text),
      descriptionQuality: this.calculateDescriptionQuality(text),
      pacingControl: this.calculatePacing(text),
      transitionSmoothness: this.calculateTransitions(text)
    };
  }

  private calculateVocabularyRichness(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words).size;
    return Math.min(1, uniqueWords / words.length * 2);
  }

  private calculateRhythm(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 2) return 0.5;
    
    const lengths = sentences.map(s => s.split(/\s+/).length);
    let rhythmScore = 0;
    
    for (let i = 1; i < lengths.length; i++) {
      const variation = Math.abs(lengths[i] - lengths[i-1]);
      rhythmScore += variation > 5 ? 0.1 : 0;
    }
    
    return Math.min(1, rhythmScore / lengths.length * 10);
  }

  private calculateImagery(text: string): number {
    const sensoryWords = (text.match(/\b(see|hear|feel|touch|taste|smell|bright|dark|loud|soft|rough|smooth)\b/gi) || []).length;
    const descriptiveAdjectives = (text.match(/\b\w+(?:ful|ous|ive|ing|ed)\b/gi) || []).length;
    
    return Math.min(1, (sensoryWords + descriptiveAdjectives) / text.split(/\s+/).length * 5);
  }

  private calculateDialogueEffectiveness(text: string): number {
    const dialogue = text.match(/"([^"]*)"/g) || [];
    if (dialogue.length === 0) return 0.5;
    
    const totalDialogue = dialogue.join('').length;
    const dialogueRatio = totalDialogue / text.length;
    
    // Good balance is around 30-40% dialogue
    const idealRatio = 0.35;
    const effectiveness = 1 - Math.abs(dialogueRatio - idealRatio) * 2;
    
    return Math.max(0, Math.min(1, effectiveness));
  }

  private calculateDescriptionQuality(text: string): number {
    const descriptiveWords = (text.match(/\b(beautiful|ugly|large|small|ancient|modern|bright|dark)\b/gi) || []).length;
    const specificDetails = (text.match(/\b\d+\s+\w+\b/g) || []).length;
    
    return Math.min(1, (descriptiveWords + specificDetails * 2) / text.split(/\s+/).length * 10);
  }

  private calculatePacing(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 10).length;
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
    
    const balance = 1 - Math.abs((shortSentences - longSentences) / sentences.length);
    return balance;
  }

  private calculateTransitions(text: string): number {
    const transitionWords = (text.match(/\b(however|therefore|furthermore|meanwhile|consequently|thus|then|next|finally)\b/gi) || []).length;
    const paragraphs = text.split(/\n\n+/).length;
    
    return Math.min(1, transitionWords / paragraphs * 0.3);
  }

  private assessConsistency(text: string, voice: VoiceProfile, metrics: StyleMetrics): ConsistencyReport {
    const inconsistencies: Inconsistency[] = [];
    
    // Check tone consistency
    const toneVariance = this.calculateToneVariance(text);
    if (toneVariance > 0.3) {
      inconsistencies.push({
        type: 'tone',
        location: 'Throughout',
        description: 'Tone shifts detected',
        severity: 'moderate',
        suggestion: 'Maintain consistent tone throughout'
      });
    }
    
    // Check voice consistency
    const voiceVariance = this.calculateVoiceVariance(text);
    if (voiceVariance > 0.25) {
      inconsistencies.push({
        type: 'voice',
        location: 'Multiple sections',
        description: 'Voice characteristics vary',
        severity: 'major',
        suggestion: 'Strengthen your unique voice'
      });
    }
    
    const overall = 1 - (toneVariance + voiceVariance) / 2;
    
    return {
      overall: Math.max(0, Math.min(1, overall)),
      toneConsistency: 1 - toneVariance,
      voiceConsistency: 1 - voiceVariance,
      styleConsistency: metrics.sentenceVariety,
      inconsistencies,
      improvements: this.suggestImprovements(inconsistencies)
    };
  }

  private calculateToneVariance(text: string): number {
    const sections = text.split(/\n\n+/);
    if (sections.length < 2) return 0;
    
    const tones = sections.map(section => this.assessFormality(section));
    const mean = tones.reduce((a, b) => a + b, 0) / tones.length;
    const variance = tones.reduce((sum, tone) => sum + Math.pow(tone - mean, 2), 0) / tones.length;
    
    return Math.sqrt(variance);
  }

  private calculateVoiceVariance(text: string): number {
    const sections = text.split(/\n\n+/);
    if (sections.length < 2) return 0;
    
    const energies = sections.map(section => this.assessEnergy(section));
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((sum, energy) => sum + Math.pow(energy - mean, 2), 0) / energies.length;
    
    return Math.sqrt(variance);
  }

  private suggestImprovements(inconsistencies: Inconsistency[]): string[] {
    const improvements: string[] = [];
    
    inconsistencies.forEach(issue => {
      improvements.push(issue.suggestion);
    });
    
    return improvements;
  }

  private generateRecommendations(
    voice: VoiceProfile,
    metrics: StyleMetrics,
    consistency: ConsistencyReport
  ): StyleRecommendation[] {
    const recommendations: StyleRecommendation[] = [];
    
    // Voice recommendations
    if (voice.distinctiveness < 0.5) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        category: 'voice',
        priority: 'high',
        title: 'Develop Your Unique Voice',
        description: 'Your voice could be more distinctive',
        examples: [
          {
            before: 'The day was nice.',
            after: 'Sunlight pooled on the sidewalk like spilled honey.',
            explanation: 'Use unique imagery and metaphors',
            technique: 'metaphorical language'
          }
        ],
        exercises: [
          {
            id: 'ex-1',
            title: 'Voice Imitation and Variation',
            description: 'Write the same scene in three different voices',
            duration: 30,
            difficulty: 'medium',
            focus: 'voice development',
            instructions: ['Choose a simple scene', 'Write it three ways', 'Identify differences'],
            targetImprovement: 'distinctiveness'
          }
        ],
        expectedImpact: 0.3
      });
    }
    
    // Style recommendations
    if (metrics.sentenceVariety < 0.5) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        category: 'style',
        priority: 'medium',
        title: 'Vary Your Sentence Structure',
        description: 'Mix short and long sentences for better rhythm',
        examples: [
          {
            before: 'She walked to the store. She bought milk. She came home.',
            after: 'She walked to the store. Along the way, she noticed the autumn leaves beginning to turn, their edges tinged with gold. Home again, milk in hand.',
            explanation: 'Combine variety in length and structure',
            technique: 'sentence variation'
          }
        ],
        exercises: [],
        expectedImpact: 0.25
      });
    }
    
    return recommendations;
  }

  private calculateOverallScore(
    voice: VoiceProfile,
    metrics: StyleMetrics,
    consistency: ConsistencyReport
  ): number {
    const voiceScore = (voice.distinctiveness + voice.maturity + voice.authenticity) / 3;
    const metricsScore = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.values(metrics).length;
    const consistencyScore = consistency.overall;
    
    return Math.round((voiceScore * 0.4 + metricsScore * 0.3 + consistencyScore * 0.3) * 100);
  }

  public provideFeedback(text: string): RealTimeFeedback | null {
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.feedbackThrottle) {
      return null;
    }
    
    this.lastFeedbackTime = now;
    
    // Quick analysis for real-time feedback
    const feedback = this.quickAnalyze(text);
    
    if (feedback) {
      this.realTimeFeedbackBuffer.push(feedback);
      
      if (this.currentSession) {
        this.currentSession.feedback.push(feedback);
      }
      
      this.emit('realTimeFeedback', feedback);
    }
    
    return feedback;
  }

  private quickAnalyze(text: string): RealTimeFeedback | null {
    const lastSentence = text.split(/[.!?]/).slice(-2, -1)[0];
    if (!lastSentence || lastSentence.trim().length < 10) return null;
    
    // Check for common issues
    if (lastSentence.toLowerCase().startsWith('there was') || lastSentence.toLowerCase().startsWith('there were')) {
      return {
        id: `feedback-${Date.now()}`,
        timestamp: new Date(),
        text: lastSentence,
        type: 'style',
        severity: 'suggestion',
        message: 'Consider a stronger opening',
        suggestion: 'Start with the subject performing an action',
        confidence: 0.8
      };
    }
    
    // Check for passive voice
    if (/\b(was|were|been|being)\s+\w+ed\b/i.test(lastSentence)) {
      return {
        id: `feedback-${Date.now()}`,
        timestamp: new Date(),
        text: lastSentence,
        type: 'voice',
        severity: 'suggestion',
        message: 'Passive voice detected',
        suggestion: 'Consider using active voice for more impact',
        confidence: 0.7
      };
    }
    
    return null;
  }

  private updateEvolution(analysis: VoiceAnalysis): void {
    if (!this.evolution) {
      this.evolution = {
        id: `evolution-${Date.now()}`,
        userId: 'current-user',
        timeline: [],
        growthAreas: [],
        achievements: [],
        currentLevel: 'novice'
      };
    }
    
    // Add snapshot
    this.evolution.timeline.push({
      date: new Date(),
      voiceProfile: analysis.voiceProfile,
      styleMetrics: analysis.styleMetrics,
      wordsWritten: analysis.text.split(/\s+/).length,
      uniqueVocabulary: new Set(analysis.text.toLowerCase().split(/\s+/)).size,
      topStrengths: analysis.voiceProfile.signature.strengths,
      topWeaknesses: analysis.recommendations.map(r => r.title)
    });
    
    // Update level
    if (analysis.score > 85) this.evolution.currentLevel = 'expert';
    else if (analysis.score > 70) this.evolution.currentLevel = 'proficient';
    else if (analysis.score > 55) this.evolution.currentLevel = 'competent';
    else if (analysis.score > 40) this.evolution.currentLevel = 'developing';
    else this.evolution.currentLevel = 'novice';
  }

  public startCoachingSession(focus: string): void {
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      focus,
      initialAnalysis: this.analyzeVoice(''), // Empty initial
      feedback: [],
      improvements: [],
      exercises: [],
      notes: ''
    };
    
    this.sessions.set(this.currentSession.id, this.currentSession);
    this.emit('sessionStarted', this.currentSession);
  }

  public endCoachingSession(finalText: string): CoachingSession | null {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = new Date();
    this.currentSession.finalAnalysis = this.analyzeVoice(finalText);
    
    // Calculate improvements
    if (this.currentSession.initialAnalysis && this.currentSession.finalAnalysis) {
      const improvements: string[] = [];
      
      if (this.currentSession.finalAnalysis.score > this.currentSession.initialAnalysis.score) {
        improvements.push(`Overall score improved by ${this.currentSession.finalAnalysis.score - this.currentSession.initialAnalysis.score} points`);
      }
    }
    
    this.currentSession.improvements = improvements;
    this.saveData();
    this.emit('sessionEnded', this.currentSession);
    
    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  public createStyleGoal(
    name: string,
    description: string,
    targetMetrics: Partial<StyleMetrics>,
    deadline?: Date
  ): StyleGoal {
    const goal: StyleGoal = {
      id: `goal-${Date.now()}`,
      name,
      description,
      targetMetrics,
      targetVoice: {},
      deadline,
      progress: 0,
      milestones: [],
      exercises: []
    };
    
    this.goals.set(goal.id, goal);
    this.saveData();
    this.emit('goalCreated', goal);
    
    return goal;
  }

  public selectVoiceModel(modelId: string): VoiceModel | undefined {
    const model = this.voiceModels.get(modelId);
    if (model) {
      this.currentVoice = model.baseVoice;
      this.saveData();
      this.emit('voiceModelSelected', model);
    }
    return model;
  }

  public exportAnalysis(): string {
    return JSON.stringify({
      currentVoice: this.currentVoice,
      analyses: Array.from(this.analyses.values()),
      evolution: this.evolution,
      sessions: Array.from(this.sessions.values()),
      goals: Array.from(this.goals.values()),
      exportDate: new Date()
    }, null, 2);
  }
}

export const voiceStyleCoachService = new VoiceStyleCoachService();
export default voiceStyleCoachService;