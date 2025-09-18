/**
 * Dialogue Workshop Service
 * Character voice development and dialogue analysis tools
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface CharacterVoice {
  id: string;
  characterId: string;
  characterName: string;
  voiceProfile: VoiceProfile;
  speechPatterns: SpeechPattern[];
  vocabularyLevel: 'simple' | 'average' | 'sophisticated' | 'technical';
  emotionalRange: EmotionalRange;
  dialects: string[];
  quirks: string[];
  examples: DialogueExample[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceProfile {
  age: number;
  background: string;
  education: string;
  personality: string[];
  speakingStyle: 'formal' | 'casual' | 'street' | 'poetic' | 'technical' | 'mixed';
  pace: 'fast' | 'normal' | 'slow' | 'varies';
  volume: 'quiet' | 'normal' | 'loud' | 'varies';
  tone: string[];
  accent: string;
  languageSkills: string[];
}

export interface SpeechPattern {
  type: 'filler_words' | 'repetition' | 'interruption' | 'question_style' | 'sentence_length' | 'formality';
  pattern: string;
  frequency: 'rare' | 'occasional' | 'common' | 'frequent';
  context: string;
  examples: string[];
}

export interface EmotionalRange {
  primaryEmotions: string[];
  emotionalExpression: 'subtle' | 'moderate' | 'dramatic' | 'explosive';
  comfortableTopics: string[];
  avoidedTopics: string[];
  stressResponses: string[];
  joyExpressions: string[];
}

export interface DialogueExample {
  id: string;
  text: string;
  context: string;
  emotion: string;
  purpose: 'characterization' | 'plot_advancement' | 'relationship' | 'exposition' | 'conflict';
  quality: 'excellent' | 'good' | 'needs_work';
  notes: string;
  createdAt: Date;
}

export interface DialogueExercise {
  id: string;
  title: string;
  description: string;
  type: 'voice_development' | 'relationship_dynamic' | 'conflict_resolution' | 'exposition_practice' | 'emotion_expression';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  prompts: ExercisePrompt[];
  characters: string[]; // Character IDs
  timeEstimate: number; // minutes
  learningGoals: string[];
  completed: boolean;
  results?: ExerciseResult;
}

export interface ExercisePrompt {
  id: string;
  text: string;
  constraints?: string[];
  targetEmotion?: string;
  targetOutcome?: string;
}

export interface ExerciseResult {
  dialogueWritten: string;
  feedback: DialogueFeedback;
  completedAt: Date;
  timeSpent: number;
  selfRating: number; // 1-5
  notes: string;
}

export interface DialogueFeedback {
  overallScore: number; // 1-100
  strengths: string[];
  improvements: string[];
  characterVoiceConsistency: number;
  naturalness: number;
  purposeClarity: number;
  emotionalResonance: number;
  suggestions: FeedbackSuggestion[];
}

export interface FeedbackSuggestion {
  type: 'voice_consistency' | 'word_choice' | 'rhythm' | 'subtext' | 'characterization';
  suggestion: string;
  example?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DialogueAnalysis {
  text: string;
  speakers: string[];
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  readabilityScore: number;
  emotionalTone: string[];
  speechPatterns: DetectedPattern[];
  voiceDistinction: number; // How distinct each character's voice is
  naturalness: number;
  pacing: 'too_fast' | 'good' | 'too_slow';
  suggestions: string[];
}

export interface DetectedPattern {
  characterId: string;
  pattern: string;
  frequency: number;
  context: string;
}

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  participants: ScenarioParticipant[];
  setting: string;
  conflict: string;
  goal: string;
  mood: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // minutes
  completed: boolean;
  result?: string;
}

export interface ScenarioParticipant {
  characterId: string;
  characterName: string;
  motivation: string;
  secretGoal?: string;
  emotionalState: string;
  powerDynamic: 'dominant' | 'equal' | 'submissive';
}

// Pre-defined exercises
const DIALOGUE_EXERCISES: Omit<DialogueExercise, 'id' | 'completed' | 'results'>[] = [
  {
    title: 'Voice Distinction Challenge',
    description: 'Write dialogue for multiple characters without using dialogue tags',
    type: 'voice_development',
    difficulty: 'intermediate',
    instructions: [
      'Choose 3-4 of your characters',
      'Write a conversation where each character says at least 3 lines',
      'Do not use any dialogue tags (he said, she replied, etc.)',
      'The reader should be able to identify each speaker by voice alone'
    ],
    prompts: [
      {
        id: '1',
        text: 'The characters are discussing a controversial decision that affects them all.',
        constraints: ['No dialogue tags', 'Each character must have a distinct opinion'],
        targetOutcome: 'Reader can identify speakers without tags'
      }
    ],
    characters: [],
    timeEstimate: 30,
    learningGoals: [
      'Develop distinct character voices',
      'Practice subtext and implication',
      'Strengthen character consistency'
    ]
  },
  {
    title: 'Subtext Master',
    description: 'Write dialogue where characters say one thing but mean another',
    type: 'relationship_dynamic',
    difficulty: 'advanced',
    instructions: [
      'Choose two characters with tension between them',
      'Write a conversation about a mundane topic',
      'Layer in subtext about their real conflict',
      'The surface conversation should be polite and normal'
    ],
    prompts: [
      {
        id: '1',
        text: 'Two former friends are planning a mutual friend\'s birthday party.',
        constraints: ['Surface topic: party planning', 'Subtext: unresolved betrayal'],
        targetEmotion: 'tension'
      }
    ],
    characters: [],
    timeEstimate: 25,
    learningGoals: [
      'Master subtext techniques',
      'Practice layered dialogue',
      'Develop tension without direct conflict'
    ]
  },
  {
    title: 'Emotional Escalation',
    description: 'Write a conversation that gradually builds emotional intensity',
    type: 'emotion_expression',
    difficulty: 'intermediate',
    instructions: [
      'Start with a calm, normal conversation',
      'Gradually increase emotional intensity',
      'Show escalation through word choice and rhythm',
      'End at peak emotional moment'
    ],
    prompts: [
      {
        id: '1',
        text: 'A parent and teenager discussing curfew that escalates into a deeper argument.',
        targetEmotion: 'anger, frustration',
        targetOutcome: 'Clear emotional progression'
      }
    ],
    characters: [],
    timeEstimate: 20,
    learningGoals: [
      'Practice emotional pacing',
      'Learn escalation techniques',
      'Develop realistic conflict progression'
    ]
  },
  {
    title: 'Exposition Integration',
    description: 'Deliver necessary information naturally through dialogue',
    type: 'exposition_practice',
    difficulty: 'advanced',
    instructions: [
      'Choose important backstory or world-building info to convey',
      'Write a conversation that reveals this information naturally',
      'Avoid info-dumping or obvious exposition',
      'Make the conversation feel organic and purposeful'
    ],
    prompts: [
      {
        id: '1',
        text: 'Characters need to discuss past events that shaped their current situation.',
        constraints: ['No obvious exposition', 'Information must feel natural'],
        targetOutcome: 'Reader learns key information without noticing'
      }
    ],
    characters: [],
    timeEstimate: 35,
    learningGoals: [
      'Master subtle exposition',
      'Practice information weaving',
      'Develop natural revelation techniques'
    ]
  }
];

// Pre-defined conversation scenarios
const CONVERSATION_SCENARIOS: Omit<ConversationScenario, 'id' | 'completed' | 'result'>[] = [
  {
    title: 'The Awkward Reunion',
    description: 'Former lovers meet unexpectedly at a coffee shop',
    participants: [],
    setting: 'Busy coffee shop, late afternoon',
    conflict: 'Unresolved feelings and awkward social situation',
    goal: 'Navigate the encounter without causing a scene',
    mood: 'tense, bittersweet',
    difficulty: 'medium'
  },
  {
    title: 'The Job Interview Deception',
    description: 'Candidate lies about their qualifications during an interview',
    participants: [],
    setting: 'Corporate conference room',
    conflict: 'Maintaining the lie while appearing competent',
    goal: 'Get the job without being discovered',
    mood: 'anxious, deceptive',
    difficulty: 'hard'
  },
  {
    title: 'The Family Secret',
    description: 'Siblings discover their parents have been hiding something major',
    participants: [],
    setting: 'Family living room',
    conflict: 'Confronting parents about the deception',
    goal: 'Get answers and decide how to move forward',
    mood: 'shocked, betrayed',
    difficulty: 'medium'
  },
  {
    title: 'The Workplace Confrontation',
    description: 'Employee confronts their boss about unfair treatment',
    participants: [],
    setting: 'Boss\'s office',
    conflict: 'Power imbalance and career risk',
    goal: 'Address the issue without losing their job',
    mood: 'nervous, determined',
    difficulty: 'hard'
  }
];

class DialogueWorkshopService {
  private static instance: DialogueWorkshopService;
  private eventEmitter: BrowserEventEmitter;
  
  private characterVoices: Map<string, CharacterVoice> = new Map();
  private exercises: Map<string, DialogueExercise> = new Map();
  private scenarios: Map<string, ConversationScenario> = new Map();
  private activeExercise: DialogueExercise | null = null;
  private exerciseStartTime: Date | null = null;

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.loadData();
    this.initializeDefaultExercises();
    this.initializeDefaultScenarios();
  }

  static getInstance(): DialogueWorkshopService {
    if (!DialogueWorkshopService.instance) {
      DialogueWorkshopService.instance = new DialogueWorkshopService();
    }
    return DialogueWorkshopService.instance;
  }

  // Character Voice Management
  createCharacterVoice(characterId: string, characterName: string, voiceData: Partial<CharacterVoice>): CharacterVoice {
    const voice: CharacterVoice = {
      id: this.generateId(),
      characterId,
      characterName,
      voiceProfile: voiceData.voiceProfile || this.createDefaultVoiceProfile(),
      speechPatterns: voiceData.speechPatterns || [],
      vocabularyLevel: voiceData.vocabularyLevel || 'average',
      emotionalRange: voiceData.emotionalRange || this.createDefaultEmotionalRange(),
      dialects: voiceData.dialects || [],
      quirks: voiceData.quirks || [],
      examples: voiceData.examples || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.characterVoices.set(voice.id, voice);
    this.saveData();
    
    this.eventEmitter.emit('voice:created', voice);
    return voice;
  }

  updateCharacterVoice(voiceId: string, updates: Partial<CharacterVoice>): void {
    const voice = this.characterVoices.get(voiceId);
    if (!voice) return;

    Object.assign(voice, updates, { updatedAt: new Date() });
    this.saveData();
    
    this.eventEmitter.emit('voice:updated', voice);
  }

  addDialogueExample(voiceId: string, example: Omit<DialogueExample, 'id' | 'createdAt'>): DialogueExample {
    const voice = this.characterVoices.get(voiceId);
    if (!voice) {
      throw new Error(`Character voice ${voiceId} not found`);
    }

    const dialogueExample: DialogueExample = {
      ...example,
      id: this.generateId(),
      createdAt: new Date()
    };

    voice.examples.push(dialogueExample);
    voice.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('example:added', { voiceId, example: dialogueExample });
    return dialogueExample;
  }

  // Exercise Management
  private initializeDefaultExercises(): void {
    DIALOGUE_EXERCISES.forEach(exerciseData => {
      const exercise: DialogueExercise = {
        ...exerciseData,
        id: this.generateId(),
        completed: false
      };
      this.exercises.set(exercise.id, exercise);
    });
  }

  startExercise(exerciseId: string): DialogueExercise {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    this.activeExercise = exercise;
    this.exerciseStartTime = new Date();
    
    this.eventEmitter.emit('exercise:started', exercise);
    return exercise;
  }

  completeExercise(exerciseId: string, result: Omit<ExerciseResult, 'completedAt' | 'timeSpent'>): void {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise || !this.exerciseStartTime) return;

    const timeSpent = Date.now() - this.exerciseStartTime.getTime();
    const feedback = this.analyzeDialogue(result.dialogueWritten);

    exercise.completed = true;
    exercise.results = {
      ...result,
      completedAt: new Date(),
      timeSpent: Math.floor(timeSpent / 1000 / 60), // minutes
      feedback
    };

    this.activeExercise = null;
    this.exerciseStartTime = null;
    this.saveData();
    
    this.eventEmitter.emit('exercise:completed', exercise);
  }

  // Scenario Management
  private initializeDefaultScenarios(): void {
    CONVERSATION_SCENARIOS.forEach(scenarioData => {
      const scenario: ConversationScenario = {
        ...scenarioData,
        id: this.generateId(),
        completed: false
      };
      this.scenarios.set(scenario.id, scenario);
    });
  }

  customizeScenario(scenarioId: string, participants: ScenarioParticipant[]): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return;

    scenario.participants = participants;
    this.saveData();
    
    this.eventEmitter.emit('scenario:customized', scenario);
  }

  completeScenario(scenarioId: string, dialogue: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return;

    scenario.completed = true;
    scenario.result = dialogue;
    this.saveData();
    
    this.eventEmitter.emit('scenario:completed', scenario);
  }

  // Analysis and Feedback
  analyzeDialogue(text: string, characterVoices?: CharacterVoice[]): DialogueFeedback {
    const analysis = this.performDialogueAnalysis(text);
    
    // Mock AI analysis - in production, use actual AI service
    const feedback: DialogueFeedback = {
      overallScore: this.calculateOverallScore(analysis),
      strengths: this.identifyStrengths(analysis),
      improvements: this.identifyImprovements(analysis),
      characterVoiceConsistency: this.analyzeVoiceConsistency(text, characterVoices),
      naturalness: this.analyzeNaturalness(analysis),
      purposeClarity: this.analyzePurposeClarity(text),
      emotionalResonance: this.analyzeEmotionalResonance(text),
      suggestions: this.generateSuggestions(analysis)
    };

    return feedback;
  }

  private performDialogueAnalysis(text: string): DialogueAnalysis {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      text,
      speakers: this.detectSpeakers(text),
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
      readabilityScore: this.calculateReadabilityScore(text),
      emotionalTone: this.detectEmotionalTone(text),
      speechPatterns: this.detectSpeechPatterns(text),
      voiceDistinction: this.calculateVoiceDistinction(text),
      naturalness: this.analyzeNaturalness({ text } as DialogueAnalysis),
      pacing: this.analyzePacing(text),
      suggestions: []
    };
  }

  private detectSpeakers(text: string): string[] {
    // Simple speaker detection - in production, use more sophisticated NLP
    const dialogueLines = text.split('\n').filter(line => 
      line.trim().startsWith('"') || line.trim().includes('said') || line.trim().includes(':')
    );
    
    return ['Character A', 'Character B']; // Simplified
  }

  private calculateReadabilityScore(text: string): number {
    // Simplified Flesch Reading Ease score
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    return Math.max(0, Math.min(100, 
      206.835 - (1.015 * words / sentences) - (84.6 * syllables / words)
    ));
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    return text.toLowerCase().split(/[aeiouy]+/).length - 1;
  }

  private detectEmotionalTone(text: string): string[] {
    const emotionWords = {
      anger: ['angry', 'furious', 'mad', 'rage', 'hate', 'damn'],
      joy: ['happy', 'excited', 'love', 'wonderful', 'amazing', 'great'],
      sadness: ['sad', 'crying', 'tears', 'depressed', 'hurt', 'broken'],
      fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'panic'],
      surprise: ['surprised', 'shocked', 'amazed', 'wow', 'unexpected']
    };

    const detectedEmotions: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(emotionWords).forEach(([emotion, words]) => {
      if (words.some(word => lowerText.includes(word))) {
        detectedEmotions.push(emotion);
      }
    });

    return detectedEmotions.length > 0 ? detectedEmotions : ['neutral'];
  }

  private detectSpeechPatterns(text: string): DetectedPattern[] {
    // Simplified pattern detection
    const patterns: DetectedPattern[] = [];
    
    if (text.includes('um') || text.includes('uh')) {
      patterns.push({
        characterId: 'unknown',
        pattern: 'Filler words (um, uh)',
        frequency: (text.match(/\b(um|uh)\b/gi) || []).length,
        context: 'Nervous or thinking'
      });
    }
    
    if (text.match(/\w+\s+\w+\s+\w+\./g)) {
      patterns.push({
        characterId: 'unknown',
        pattern: 'Short sentences',
        frequency: (text.match(/\w+\s+\w+\s+\w+\./g) || []).length,
        context: 'Terse or direct speaking style'
      });
    }

    return patterns;
  }

  private calculateVoiceDistinction(text: string): number {
    // Mock calculation - in production, use ML model
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  private analyzeNaturalness(analysis: DialogueAnalysis): number {
    let score = 80;
    
    // Penalize very long sentences
    if (analysis.averageSentenceLength > 20) {
      score -= 15;
    }
    
    // Reward good readability
    if (analysis.readabilityScore && analysis.readabilityScore > 60) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private analyzePurposeClarity(text: string): number {
    // Mock analysis - in production, use actual purpose detection
    return Math.floor(Math.random() * 30) + 70; // 70-100
  }

  private analyzeEmotionalResonance(text: string): number {
    const emotionalWords = text.match(/\b(feel|love|hate|scared|happy|sad|angry|excited|worried)\b/gi);
    const baseScore = 60;
    const emotionBonus = emotionalWords ? Math.min(30, emotionalWords.length * 5) : 0;
    
    return Math.min(100, baseScore + emotionBonus);
  }

  private analyzePacing(text: string): 'too_fast' | 'good' | 'too_slow' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    if (avgLength < 30) return 'too_fast';
    if (avgLength > 80) return 'too_slow';
    return 'good';
  }

  private analyzeVoiceConsistency(text: string, voices?: CharacterVoice[]): number {
    // Mock analysis - in production, compare against character voice profiles
    return Math.floor(Math.random() * 25) + 75; // 75-100
  }

  private calculateOverallScore(analysis: DialogueAnalysis): number {
    const scores = [
      analysis.naturalness,
      analysis.voiceDistinction,
      analysis.readabilityScore * 0.7, // Weight readability less
      this.analyzePurposeClarity(analysis.text),
      this.analyzeEmotionalResonance(analysis.text)
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private identifyStrengths(analysis: DialogueAnalysis): string[] {
    const strengths: string[] = [];
    
    if (analysis.naturalness > 80) {
      strengths.push('Natural, conversational flow');
    }
    
    if (analysis.voiceDistinction > 80) {
      strengths.push('Distinct character voices');
    }
    
    if (analysis.emotionalTone.length > 1) {
      strengths.push('Rich emotional range');
    }
    
    if (analysis.readabilityScore > 70) {
      strengths.push('Clear, readable dialogue');
    }
    
    return strengths.length > 0 ? strengths : ['Shows understanding of basic dialogue structure'];
  }

  private identifyImprovements(analysis: DialogueAnalysis): string[] {
    const improvements: string[] = [];
    
    if (analysis.naturalness < 60) {
      improvements.push('Make dialogue more natural and conversational');
    }
    
    if (analysis.voiceDistinction < 60) {
      improvements.push('Develop more distinct character voices');
    }
    
    if (analysis.averageSentenceLength > 25) {
      improvements.push('Break up long sentences for better flow');
    }
    
    if (analysis.emotionalTone.includes('neutral') && analysis.emotionalTone.length === 1) {
      improvements.push('Add more emotional depth and variety');
    }
    
    return improvements;
  }

  private generateSuggestions(analysis: DialogueAnalysis): FeedbackSuggestion[] {
    const suggestions: FeedbackSuggestion[] = [];
    
    if (analysis.averageSentenceLength > 20) {
      suggestions.push({
        type: 'rhythm',
        suggestion: 'Vary sentence length to create better dialogue rhythm',
        example: 'Mix short, punchy responses with longer explanations',
        priority: 'medium'
      });
    }
    
    if (analysis.speechPatterns.length === 0) {
      suggestions.push({
        type: 'characterization',
        suggestion: 'Add unique speech patterns to distinguish characters',
        example: 'Consider using specific vocabulary, grammar quirks, or verbal tics',
        priority: 'high'
      });
    }
    
    return suggestions;
  }

  // Voice Profile Helpers
  private createDefaultVoiceProfile(): VoiceProfile {
    return {
      age: 30,
      background: '',
      education: '',
      personality: [],
      speakingStyle: 'casual',
      pace: 'normal',
      volume: 'normal',
      tone: [],
      accent: '',
      languageSkills: []
    };
  }

  private createDefaultEmotionalRange(): EmotionalRange {
    return {
      primaryEmotions: [],
      emotionalExpression: 'moderate',
      comfortableTopics: [],
      avoidedTopics: [],
      stressResponses: [],
      joyExpressions: []
    };
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      characterVoices: Array.from(this.characterVoices.entries()),
      exercises: Array.from(this.exercises.entries()).filter(([_, ex]) => ex.completed || ex.results), // Only save completed custom exercises
      scenarios: Array.from(this.scenarios.entries()).filter(([_, sc]) => sc.completed), // Only save completed scenarios
      activeExercise: this.activeExercise?.id || null,
      exerciseStartTime: this.exerciseStartTime
    };
    localStorage.setItem('dialogueWorkshop', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('dialogueWorkshop');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.characterVoices) {
          this.characterVoices = new Map(data.characterVoices);
        }
        if (data.exercises) {
          // Merge with default exercises
          const customExercises = new Map(data.exercises);
          customExercises.forEach((exercise, id) => {
            this.exercises.set(id, exercise);
          });
        }
        if (data.scenarios) {
          // Merge with default scenarios
          const customScenarios = new Map(data.scenarios);
          customScenarios.forEach((scenario, id) => {
            this.scenarios.set(id, scenario);
          });
        }
        if (data.activeExercise) {
          this.activeExercise = this.exercises.get(data.activeExercise) || null;
        }
        if (data.exerciseStartTime) {
          this.exerciseStartTime = new Date(data.exerciseStartTime);
        }
      } catch (error) {
        console.error('Failed to load dialogue workshop data:', error);
      }
    }
  }

  // Public API
  getAllCharacterVoices(): CharacterVoice[] {
    return Array.from(this.characterVoices.values());
  }

  getCharacterVoice(voiceId: string): CharacterVoice | undefined {
    return this.characterVoices.get(voiceId);
  }

  getCharacterVoiceByCharacterId(characterId: string): CharacterVoice | undefined {
    return Array.from(this.characterVoices.values()).find(v => v.characterId === characterId);
  }

  getAllExercises(): DialogueExercise[] {
    return Array.from(this.exercises.values());
  }

  getExercise(exerciseId: string): DialogueExercise | undefined {
    return this.exercises.get(exerciseId);
  }

  getExercisesByType(type: DialogueExercise['type']): DialogueExercise[] {
    return Array.from(this.exercises.values()).filter(ex => ex.type === type);
  }

  getExercisesByDifficulty(difficulty: DialogueExercise['difficulty']): DialogueExercise[] {
    return Array.from(this.exercises.values()).filter(ex => ex.difficulty === difficulty);
  }

  getAllScenarios(): ConversationScenario[] {
    return Array.from(this.scenarios.values());
  }

  getScenario(scenarioId: string): ConversationScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  getActiveExercise(): DialogueExercise | null {
    return this.activeExercise;
  }

  cleanup(): void {
    // End any active exercise
    if (this.activeExercise && !this.activeExercise.completed) {
      this.completeExercise(this.activeExercise.id, {
        dialogueWritten: '',
        selfRating: 1,
        notes: 'Exercise ended automatically'
      });
    }
  }
}

export default new DialogueWorkshopService();

export const dialogueWorkshopService = DialogueWorkshopService.getInstance();