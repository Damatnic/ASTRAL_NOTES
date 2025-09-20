/**
 * Intelligent Content Suggestions Engine
 * Provides context-aware writing completions and scene dynamics analysis
 */

import { openaiService } from './openaiService';
import { genreSpecificAssistants, type GenreContext } from './genreSpecificAssistants';
import { personalizedStyleAnalysis, type WritingDNAProfile } from './personalizedStyleAnalysis';
import { env } from '@/config/env';

export interface ContentContext {
  // Current Text Context
  precedingText: string;
  currentSentence: string;
  cursorPosition: number;
  
  // Story Context
  genre?: string;
  characters: Character[];
  plotPoints: PlotPoint[];
  worldElements: WorldElement[];
  themes: Theme[];
  
  // Scene Context
  currentScene: SceneContext;
  previousScenes: SceneContext[];
  
  // User Context
  writingDNAProfile?: WritingDNAProfile;
  userPreferences: UserPreferences;
  
  // Document Context
  documentStructure: DocumentStructure;
  metadata: DocumentMetadata;
}

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  traits: string[];
  goals: string[];
  conflicts: string[];
  arc: string;
  relationships: Record<string, string>;
  voice: VoiceProfile;
  knowledge: string[];
  currentState: CharacterState;
}

export interface VoiceProfile {
  formality: number;
  vocabulary: string[];
  speechPatterns: string[];
  dialects: string[];
  emotionalDefault: string;
  quirks: string[];
}

export interface CharacterState {
  location: string;
  emotionalState: string;
  motivation: string;
  knownInformation: string[];
  relationships: Record<string, string>;
}

export interface PlotPoint {
  id: string;
  type: 'setup' | 'inciting-incident' | 'rising-action' | 'climax' | 'falling-action' | 'resolution';
  description: string;
  chapter?: number;
  dependencies: string[];
  consequences: string[];
  foreshadowing: string[];
  status: 'planned' | 'in-progress' | 'completed';
}

export interface WorldElement {
  id: string;
  type: 'location' | 'culture' | 'technology' | 'magic-system' | 'politics' | 'economics';
  name: string;
  description: string;
  rules: string[];
  relationships: string[];
  history: string;
  currentState: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  manifestations: string[];
  symbols: string[];
  conflicts: string[];
  development: ThemeDevelopment[];
}

export interface ThemeDevelopment {
  chapter: number;
  manifestation: string;
  intensity: number;
  method: 'dialogue' | 'action' | 'symbolism' | 'setting' | 'internal-monologue';
}

export interface SceneContext {
  id: string;
  purpose: string;
  setting: Setting;
  characters: string[];
  conflicts: Conflict[];
  emotions: EmotionalArc;
  pacing: PacingProfile;
  dynamics: SceneDynamics;
  goals: string[];
  outcomes: string[];
}

export interface Setting {
  location: string;
  timeOfDay: string;
  weather?: string;
  atmosphere: string;
  sensoryDetails: SensoryDetails;
  significance: string;
}

export interface SensoryDetails {
  visual: string[];
  auditory: string[];
  tactile: string[];
  olfactory: string[];
  gustatory: string[];
}

export interface Conflict {
  type: 'internal' | 'interpersonal' | 'societal' | 'environmental' | 'supernatural';
  description: string;
  stakes: string;
  escalation: number;
  resolution?: string;
}

export interface EmotionalArc {
  startingEmotion: string;
  targetEmotion: string;
  progressionBeats: EmotionalBeat[];
  intensity: number;
  authenticity: number;
}

export interface EmotionalBeat {
  trigger: string;
  emotion: string;
  expression: string;
  impact: number;
}

export interface PacingProfile {
  overall: 'slow' | 'moderate' | 'fast' | 'variable';
  actionPacing: number;
  dialoguePacing: number;
  descriptionPacing: number;
  transitionPacing: number;
}

export interface SceneDynamics {
  tension: number;
  momentum: number;
  engagement: number;
  clarity: number;
  purpose: number;
}

export interface UserPreferences {
  suggestionTypes: string[];
  autocompletionLevel: 'minimal' | 'moderate' | 'extensive';
  creativityLevel: number;
  consistencyFocus: number;
  stylePreservation: number;
}

export interface DocumentStructure {
  type: 'novel' | 'short-story' | 'screenplay' | 'essay' | 'other';
  chapters: Chapter[];
  outline: OutlineNode[];
  wordCountTarget?: number;
  currentProgress: Progress;
}

export interface Chapter {
  id: string;
  title: string;
  purpose: string;
  wordCount: number;
  scenes: string[];
  plotPoints: string[];
  completed: boolean;
}

export interface OutlineNode {
  id: string;
  level: number;
  title: string;
  description: string;
  children: OutlineNode[];
  status: 'planned' | 'in-progress' | 'completed';
}

export interface Progress {
  totalWords: number;
  completedChapters: number;
  currentChapter: number;
  percentComplete: number;
}

export interface DocumentMetadata {
  genre: string;
  targetAudience: string;
  wordCountGoal: number;
  deadline?: Date;
  tags: string[];
  notes: string[];
}

export interface ContentSuggestion {
  id: string;
  type: 'completion' | 'continuation' | 'alternative' | 'enhancement' | 'transition';
  category: 'dialogue' | 'action' | 'description' | 'internal-thought' | 'transition' | 'plot-advancement';
  
  // Suggestion Content
  suggestion: string;
  alternatives: string[];
  
  // Context Integration
  contextAwareness: number;
  characterConsistency: number;
  plotRelevance: number;
  styleAlignment: number;
  
  // Quality Metrics
  confidence: number;
  creativity: number;
  appropriateness: number;
  
  // Metadata
  reasoning: string;
  impacts: ImpactAnalysis;
  source: 'ai-model' | 'pattern-analysis' | 'user-history' | 'genre-knowledge';
}

export interface ImpactAnalysis {
  plotImpact: number;
  characterImpact: number;
  paceImpact: number;
  toneImpact: number;
  themeImpact: number;
  futureImplications: string[];
}

export interface SceneAnalysis {
  sceneId: string;
  purpose: string;
  effectiveness: SceneEffectiveness;
  dynamics: SceneDynamics;
  improvements: SceneImprovement[];
  strengths: string[];
  weaknesses: string[];
  suggestions: SceneSuggestion[];
}

export interface SceneEffectiveness {
  purposeFulfillment: number;
  characterDevelopment: number;
  plotAdvancement: number;
  emotionalImpact: number;
  pacing: number;
  engagement: number;
}

export interface SceneImprovement {
  aspect: string;
  currentState: number;
  targetState: number;
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface SceneSuggestion {
  type: 'structure' | 'dialogue' | 'action' | 'description' | 'pacing' | 'emotion';
  description: string;
  example: string;
  rationale: string;
  impact: string;
}

export interface ContextualCompletion {
  text: string;
  confidence: number;
  contextRelevance: number;
  styleConsistency: number;
  alternatives: string[];
  reasoning: string;
}

class IntelligentContentSuggestions {
  private initialized = false;
  private cache: Map<string, ContentSuggestion[]> = new Map();
  private analysisCache: Map<string, SceneAnalysis> = new Map();

  /**
   * Generate intelligent content suggestions based on context
   */
  async generateSuggestions(context: ContentContext): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    // Generate different types of suggestions
    const completions = await this.generateCompletions(context);
    const continuations = await this.generateContinuations(context);
    const enhancements = await this.generateEnhancements(context);
    const alternatives = await this.generateAlternatives(context);

    suggestions.push(...completions, ...continuations, ...enhancements, ...alternatives);

    // Filter and rank suggestions
    const filteredSuggestions = this.filterSuggestions(suggestions, context);
    const rankedSuggestions = this.rankSuggestions(filteredSuggestions, context);

    return rankedSuggestions.slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Generate context-aware text completions
   */
  async generateCompletions(context: ContentContext): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    // Analyze current writing context
    const writingContext = this.analyzeWritingContext(context);
    
    // Generate completions based on different approaches
    if (env.features.aiEnabled && openaiService.isConfigured()) {
      try {
        const aiCompletions = await this.generateAICompletions(context, writingContext);
        suggestions.push(...aiCompletions);
      } catch (error) {
        console.warn('AI completion failed, using fallback methods:', error);
      }
    }

    // Pattern-based completions
    const patternCompletions = this.generatePatternCompletions(context, writingContext);
    suggestions.push(...patternCompletions);

    // Character-aware completions
    if (writingContext.isDialogue) {
      const dialogueCompletions = this.generateDialogueCompletions(context);
      suggestions.push(...dialogueCompletions);
    }

    return suggestions;
  }

  /**
   * Generate story continuations
   */
  async generateContinuations(context: ContentContext): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = [];

    // Analyze story momentum
    const momentum = this.analyzeStoryMomentum(context);
    
    // Generate plot-advancing continuations
    if (momentum.needsPlotAdvancement) {
      const plotContinuations = this.generatePlotContinuations(context);
      suggestions.push(...plotContinuations);
    }

    // Generate character development continuations
    if (momentum.needsCharacterDevelopment) {
      const characterContinuations = this.generateCharacterContinuations(context);
      suggestions.push(...characterContinuations);
    }

    // Generate thematic continuations
    if (momentum.needsThematicDevelopment) {
      const thematicContinuations = this.generateThematicContinuations(context);
      suggestions.push(...thematicContinuations);
    }

    return suggestions;
  }

  /**
   * Analyze current scene dynamics
   */
  async analyzeSceneDynamics(sceneText: string, context: ContentContext): Promise<SceneAnalysis> {
    const cacheKey = `scene-${sceneText.slice(0, 100)}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Analyze scene components
    const purposeAnalysis = this.analyzePurposeFulfillment(sceneText, context.currentScene);
    const dynamicsAnalysis = this.analyzeSceneDynamicsDetailed(sceneText);
    const effectivenessAnalysis = this.analyzeSceneEffectiveness(sceneText, context);

    // Generate improvements and suggestions
    const improvements = this.identifySceneImprovements(effectivenessAnalysis, dynamicsAnalysis);
    const suggestions = this.generateSceneSuggestions(improvements, context);

    const analysis: SceneAnalysis = {
      sceneId: context.currentScene.id,
      purpose: context.currentScene.purpose,
      effectiveness: effectivenessAnalysis,
      dynamics: dynamicsAnalysis,
      improvements,
      strengths: this.identifySceneStrengths(effectivenessAnalysis),
      weaknesses: this.identifySceneWeaknesses(effectivenessAnalysis),
      suggestions
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Generate contextual auto-completions
   */
  async getContextualCompletions(
    text: string, 
    cursorPosition: number, 
    context: ContentContext
  ): Promise<ContextualCompletion[]> {
    const currentWord = this.getCurrentWord(text, cursorPosition);
    const precedingContext = text.substring(Math.max(0, cursorPosition - 500), cursorPosition);
    
    const completions: ContextualCompletion[] = [];

    // Character name completions
    if (this.isCharacterNameContext(precedingContext)) {
      const characterCompletions = this.generateCharacterNameCompletions(currentWord, context.characters);
      completions.push(...characterCompletions);
    }

    // World element completions
    if (this.isWorldElementContext(precedingContext)) {
      const worldCompletions = this.generateWorldElementCompletions(currentWord, context.worldElements);
      completions.push(...worldCompletions);
    }

    // Style-aware word completions
    if (context.writingDNAProfile) {
      const styleCompletions = this.generateStyleAwareCompletions(currentWord, precedingContext, context.writingDNAProfile);
      completions.push(...styleCompletions);
    }

    // Genre-specific completions
    if (context.genre) {
      const genreCompletions = this.generateGenreSpecificCompletions(currentWord, precedingContext, context.genre);
      completions.push(...genreCompletions);
    }

    return completions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze emotional progression in text
   */
  analyzeEmotionalProgression(text: string, targetArc?: EmotionalArc): EmotionalProgressionAnalysis {
    const sentences = this.extractSentences(text);
    const emotionalBeats = sentences.map(sentence => this.analyzeEmotionalContent(sentence));
    
    const progression = this.calculateEmotionalProgression(emotionalBeats);
    const consistency = this.calculateEmotionalConsistency(emotionalBeats, targetArc);
    
    return {
      overallProgression: progression,
      consistency,
      beats: emotionalBeats,
      suggestions: this.generateEmotionalSuggestions(progression, targetArc),
      authenticity: this.calculateEmotionalAuthenticity(emotionalBeats)
    };
  }

  /**
   * Generate dialogue improvements
   */
  async generateDialogueImprovements(dialogue: string, character: Character, context: ContentContext): Promise<DialogueImprovement[]> {
    const improvements: DialogueImprovement[] = [];

    // Voice consistency check
    const voiceConsistency = this.checkDialogueVoiceConsistency(dialogue, character.voice);
    if (voiceConsistency.score < 0.8) {
      improvements.push({
        type: 'voice-consistency',
        priority: 'high',
        description: 'Dialogue doesn\'t match character\'s established voice',
        suggestion: this.generateVoiceConsistentDialogue(dialogue, character.voice),
        rationale: voiceConsistency.issues.join(', ')
      });
    }

    // Subtext analysis
    const subtextAnalysis = this.analyzeDialogueSubtext(dialogue, context);
    if (subtextAnalysis.score < 0.6) {
      improvements.push({
        type: 'subtext',
        priority: 'medium',
        description: 'Dialogue could benefit from more subtext',
        suggestion: this.generateSubtextualDialogue(dialogue, character, context),
        rationale: 'Adding subtext makes dialogue more engaging and realistic'
      });
    }

    // Conflict integration
    const conflictIntegration = this.analyzeDialogueConflict(dialogue, context.currentScene.conflicts);
    if (conflictIntegration.score < 0.7) {
      improvements.push({
        type: 'conflict',
        priority: 'high',
        description: 'Dialogue doesn\'t advance scene conflict effectively',
        suggestion: this.generateConflictDrivenDialogue(dialogue, context.currentScene.conflicts),
        rationale: 'Dialogue should contribute to scene tension and conflict'
      });
    }

    return improvements;
  }

  // Helper methods for content analysis and generation

  private analyzeWritingContext(context: ContentContext): WritingContextAnalysis {
    const lastSentence = this.getLastSentence(context.precedingText);
    const lastParagraph = this.getLastParagraph(context.precedingText);
    
    return {
      isDialogue: this.isDialogueContext(lastSentence),
      isAction: this.isActionContext(lastSentence),
      isDescription: this.isDescriptionContext(lastSentence),
      isInternalThought: this.isInternalThoughtContext(lastSentence),
      currentTense: this.detectTense(lastSentence),
      currentPOV: this.detectPointOfView(lastParagraph),
      emotionalTone: this.detectEmotionalTone(lastParagraph),
      paceSignals: this.detectPaceSignals(lastParagraph)
    };
  }

  private async generateAICompletions(context: ContentContext, writingContext: WritingContextAnalysis): Promise<ContentSuggestion[]> {
    const prompt = this.constructCompletionPrompt(context, writingContext);
    
    try {
      const aiResponse = await openaiService.generateContent(prompt, {
        maxTokens: 150,
        temperature: 0.7,
        topP: 0.9
      });

      return this.parseAICompletions(aiResponse, context);
    } catch (error) {
      console.warn('AI completion generation failed:', error);
      return [];
    }
  }

  private generatePatternCompletions(context: ContentContext, writingContext: WritingContextAnalysis): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Sentence completion patterns
    if (writingContext.isDialogue) {
      suggestions.push(...this.generateDialoguePatterns(context));
    } else if (writingContext.isAction) {
      suggestions.push(...this.generateActionPatterns(context));
    } else if (writingContext.isDescription) {
      suggestions.push(...this.generateDescriptionPatterns(context));
    }

    return suggestions;
  }

  private generateDialogueCompletions(context: ContentContext): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentSpeaker = this.identifyCurrentSpeaker(context.precedingText, context.characters);
    
    if (currentSpeaker) {
      // Generate character-specific dialogue
      const characterDialogue = this.generateCharacterSpecificDialogue(currentSpeaker, context);
      suggestions.push(...characterDialogue);
    }

    return suggestions;
  }

  private analyzeStoryMomentum(context: ContentContext): StoryMomentumAnalysis {
    const recentPlotProgress = this.calculateRecentPlotProgress(context);
    const characterDevelopmentRate = this.calculateCharacterDevelopmentRate(context);
    const thematicProgression = this.calculateThematicProgression(context);
    
    return {
      needsPlotAdvancement: recentPlotProgress < 0.3,
      needsCharacterDevelopment: characterDevelopmentRate < 0.4,
      needsThematicDevelopment: thematicProgression < 0.5,
      paceBalance: this.calculatePaceBalance(context),
      momentumScore: (recentPlotProgress + characterDevelopmentRate + thematicProgression) / 3
    };
  }

  // Additional helper method implementations...
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private getCurrentWord(text: string, position: number): string {
    const beforeCursor = text.substring(0, position);
    const afterCursor = text.substring(position);
    
    const wordStart = beforeCursor.search(/\w+$/);
    const wordEnd = afterCursor.search(/\W/);
    
    return (beforeCursor.substring(wordStart) + afterCursor.substring(0, wordEnd)).trim();
  }

  private isCharacterNameContext(text: string): boolean {
    // Check if the context suggests a character name should follow
    const patterns = [/said\s*$/i, /asked\s*$/i, /replied\s*$/i, /shouted\s*$/i];
    return patterns.some(pattern => pattern.test(text));
  }

  private generateCharacterNameCompletions(partial: string, characters: Character[]): ContextualCompletion[] {
    return characters
      .filter(char => char.name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(char => ({
        text: char.name,
        confidence: 0.9,
        contextRelevance: 0.95,
        styleConsistency: 1.0,
        alternatives: [char.name.split(' ')[0]], // First name alternative
        reasoning: `Character name completion for ${char.name}`
      }));
  }

  // Simplified implementations for demonstration
  private filterSuggestions(suggestions: ContentSuggestion[], context: ContentContext): ContentSuggestion[] {
    return suggestions.filter(suggestion => 
      suggestion.confidence > 0.5 && 
      suggestion.appropriateness > 0.7
    );
  }

  private rankSuggestions(suggestions: ContentSuggestion[], context: ContentContext): ContentSuggestion[] {
    return suggestions.sort((a, b) => {
      const scoreA = this.calculateSuggestionScore(a, context);
      const scoreB = this.calculateSuggestionScore(b, context);
      return scoreB - scoreA;
    });
  }

  private calculateSuggestionScore(suggestion: ContentSuggestion, context: ContentContext): number {
    return (
      suggestion.confidence * 0.3 +
      suggestion.contextAwareness * 0.25 +
      suggestion.styleAlignment * 0.2 +
      suggestion.plotRelevance * 0.15 +
      suggestion.characterConsistency * 0.1
    );
  }

  // Additional simplified method implementations...
  private isDialogueContext(text: string): boolean {
    return /["']/.test(text) || /said|asked|replied|shouted/i.test(text);
  }

  private isActionContext(text: string): boolean {
    return /\b(ran|jumped|grabbed|pushed|pulled|struck)\b/i.test(text);
  }

  private isDescriptionContext(text: string): boolean {
    return /\b(was|were|seemed|appeared|looked)\b/i.test(text);
  }

  private isInternalThoughtContext(text: string): boolean {
    return /\b(thought|wondered|realized|remembered)\b/i.test(text);
  }

  private detectTense(text: string): 'past' | 'present' | 'future' {
    if (/\b(will|shall|going to)\b/i.test(text)) return 'future';
    if (/\b(is|are|am)\b/i.test(text)) return 'present';
    return 'past';
  }

  private detectPointOfView(text: string): 'first' | 'second' | 'third' {
    if (/\b(I|me|my|mine)\b/i.test(text)) return 'first';
    if (/\b(you|your|yours)\b/i.test(text)) return 'second';
    return 'third';
  }

  private detectEmotionalTone(text: string): string {
    // Simplified emotion detection
    if (/angry|furious|mad/i.test(text)) return 'anger';
    if (/sad|depressed|melancholy/i.test(text)) return 'sadness';
    if (/happy|joyful|elated/i.test(text)) return 'joy';
    if (/afraid|scared|terrified/i.test(text)) return 'fear';
    return 'neutral';
  }

  private detectPaceSignals(text: string): PaceSignal[] {
    const signals: PaceSignal[] = [];
    
    if (/suddenly|quickly|rapidly/i.test(text)) {
      signals.push({ type: 'acceleration', intensity: 0.8 });
    }
    if (/slowly|gradually|carefully/i.test(text)) {
      signals.push({ type: 'deceleration', intensity: 0.7 });
    }
    
    return signals;
  }

  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  isConfigured(): boolean {
    return this.initialized;
  }
}

// Additional interfaces
interface WritingContextAnalysis {
  isDialogue: boolean;
  isAction: boolean;
  isDescription: boolean;
  isInternalThought: boolean;
  currentTense: 'past' | 'present' | 'future';
  currentPOV: 'first' | 'second' | 'third';
  emotionalTone: string;
  paceSignals: PaceSignal[];
}

interface PaceSignal {
  type: 'acceleration' | 'deceleration' | 'neutral';
  intensity: number;
}

interface StoryMomentumAnalysis {
  needsPlotAdvancement: boolean;
  needsCharacterDevelopment: boolean;
  needsThematicDevelopment: boolean;
  paceBalance: number;
  momentumScore: number;
}

interface EmotionalProgressionAnalysis {
  overallProgression: number;
  consistency: number;
  beats: EmotionalBeat[];
  suggestions: string[];
  authenticity: number;
}

interface DialogueImprovement {
  type: 'voice-consistency' | 'subtext' | 'conflict' | 'naturalism';
  priority: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  rationale: string;
}

export const intelligentContentSuggestions = new IntelligentContentSuggestions();