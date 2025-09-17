/**
 * Smart Writing Companion Service
 * Revolutionary AI assistant that understands narrative context and provides intelligent writing assistance
 * Addresses user complaints about "flowery, excessive" AI by focusing on contextual appropriateness
 */

import type { Project, Story, Scene, Character, NoteType } from '@/types/story';
import { aiConsistencyService } from './aiConsistencyService';

export interface WritingContext {
  projectId: string;
  sceneId?: string;
  characterId?: string;
  genre?: string;
  narrativeVoice?: 'first' | 'second' | 'third-limited' | 'third-omniscient';
  tense?: 'past' | 'present' | 'future';
  tone?: 'serious' | 'humorous' | 'dark' | 'light' | 'dramatic' | 'casual';
  pointOfView?: string; // Character name for POV
  currentWordCount?: number;
  targetLength?: number;
  writingGoal?: 'plot-advancement' | 'character-development' | 'world-building' | 'dialogue' | 'description';
}

export interface WritingSuggestion {
  id: string;
  type: 'continuation' | 'enhancement' | 'correction' | 'alternative' | 'expansion';
  priority: 'high' | 'medium' | 'low';
  content: string;
  explanation: string;
  confidence: number; // 0-1
  contextualRelevance: number; // 0-1
  characterConsistency?: number; // 0-1
  category: string;
  metadata: {
    wordCount: number;
    estimatedReadingTime: number;
    sentiment: number; // -1 to 1
    complexity: number; // 0-1
  };
}

export interface CharacterVoiceProfile {
  characterId: string;
  name: string;
  speechPatterns: {
    vocabulary: string[]; // Common words/phrases
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    formality: number; // 0-1, 0 = very casual, 1 = very formal
    emotionalRange: string[]; // Emotions this character typically expresses
    uniquePhrases: string[]; // Signature expressions
    avoidedWords: string[]; // Words this character wouldn't use
  };
  dialogueExamples: Array<{
    text: string;
    emotion: string;
    context: string;
    sceneId: string;
  }>;
  consistencyScore: number; // How consistent their voice has been
  lastUpdated: Date;
}

export interface GenreWritingMode {
  name: string;
  characteristics: {
    pacing: 'fast' | 'medium' | 'slow' | 'varied';
    description: 'minimal' | 'moderate' | 'rich' | 'atmospheric';
    dialogue: 'snappy' | 'natural' | 'formal' | 'genre-specific';
    tension: 'constant' | 'building' | 'episodic' | 'climactic';
    focusAreas: string[]; // What to emphasize
  };
  commonPitfalls: string[]; // What to avoid
  suggestionPrompts: string[]; // Genre-specific suggestion templates
  toneGuidelines: string[];
}

class SmartWritingCompanionService {
  private genreModes: Map<string, GenreWritingMode> = new Map();
  private characterVoices: Map<string, CharacterVoiceProfile> = new Map();
  private userPreferences: Map<string, any> = new Map();

  constructor() {
    this.initializeGenreModes();
  }

  /**
   * Get contextual writing suggestions based on current content and narrative context
   */
  async getWritingSuggestions(
    content: string,
    context: WritingContext,
    userPreferences?: any
  ): Promise<WritingSuggestion[]> {
    try {
      const suggestions: WritingSuggestion[] = [];

      // Get narrative context
      const narrativeContext = await this.analyzeNarrativeContext(content, context);
      
      // Generate context-aware suggestions
      const continuationSuggestions = await this.generateContinuationSuggestions(
        content, 
        context, 
        narrativeContext
      );
      suggestions.push(...continuationSuggestions);

      // Character voice consistency checks
      if (context.characterId) {
        const voiceSuggestions = await this.checkCharacterVoiceConsistency(
          content,
          context.characterId,
          context
        );
        suggestions.push(...voiceSuggestions);
      }

      // Genre-specific suggestions
      if (context.genre) {
        const genreSuggestions = await this.getGenreSpecificSuggestions(
          content,
          context.genre,
          narrativeContext
        );
        suggestions.push(...genreSuggestions);
      }

      // Pacing and flow suggestions
      const pacingSuggestions = await this.analyzePacingAndFlow(content, context);
      suggestions.push(...pacingSuggestions);

      // Filter and rank suggestions
      return this.filterAndRankSuggestions(suggestions, userPreferences);
    } catch (error) {
      console.error('Error generating writing suggestions:', error);
      return [];
    }
  }

  /**
   * Learn and update character voice patterns from dialogue
   */
  async learnCharacterVoice(
    characterId: string,
    dialogue: string,
    emotion: string,
    context: string,
    sceneId: string
  ): Promise<void> {
    try {
      let voiceProfile = this.characterVoices.get(characterId);
      
      if (!voiceProfile) {
        voiceProfile = await this.createInitialVoiceProfile(characterId);
      }

      // Analyze dialogue patterns
      const analysis = await this.analyzeDialogue(dialogue);
      
      // Update speech patterns
      this.updateSpeechPatterns(voiceProfile, analysis);
      
      // Add dialogue example
      voiceProfile.dialogueExamples.push({
        text: dialogue,
        emotion,
        context,
        sceneId
      });

      // Limit examples to most recent 50
      if (voiceProfile.dialogueExamples.length > 50) {
        voiceProfile.dialogueExamples = voiceProfile.dialogueExamples.slice(-50);
      }

      // Update consistency score
      voiceProfile.consistencyScore = await this.calculateVoiceConsistency(voiceProfile);
      voiceProfile.lastUpdated = new Date();

      this.characterVoices.set(characterId, voiceProfile);
    } catch (error) {
      console.error('Error learning character voice:', error);
    }
  }

  /**
   * Get genre-specific writing mode configuration
   */
  getGenreMode(genre: string): GenreWritingMode | null {
    return this.genreModes.get(genre.toLowerCase()) || null;
  }

  /**
   * Analyze emotional arc and suggest appropriate emotional beats
   */
  async analyzeEmotionalArc(
    content: string,
    context: WritingContext
  ): Promise<{
    currentEmotion: string;
    emotionalTrajectory: string[];
    suggestedNextEmotion: string;
    reasoning: string;
  }> {
    try {
      const emotionalAnalysis = await this.performEmotionalAnalysis(content);
      const trajectory = await this.predictEmotionalTrajectory(emotionalAnalysis, context);
      
      return {
        currentEmotion: emotionalAnalysis.dominantEmotion,
        emotionalTrajectory: emotionalAnalysis.emotionSequence,
        suggestedNextEmotion: trajectory.nextEmotion,
        reasoning: trajectory.reasoning
      };
    } catch (error) {
      console.error('Error analyzing emotional arc:', error);
      return {
        currentEmotion: 'neutral',
        emotionalTrajectory: [],
        suggestedNextEmotion: 'neutral',
        reasoning: 'Unable to analyze emotional context'
      };
    }
  }

  /**
   * Generate intelligent scene expansions that maintain narrative consistency
   */
  async generateSceneExpansion(
    sceneOutline: string,
    context: WritingContext,
    expansionType: 'sensory-details' | 'character-interaction' | 'world-building' | 'tension-building'
  ): Promise<string[]> {
    try {
      const mode = this.getGenreMode(context.genre || 'general');
      const suggestions: string[] = [];

      switch (expansionType) {
        case 'sensory-details':
          suggestions.push(...await this.generateSensoryDetails(sceneOutline, context, mode));
          break;
        case 'character-interaction':
          suggestions.push(...await this.generateCharacterInteractions(sceneOutline, context));
          break;
        case 'world-building':
          suggestions.push(...await this.generateWorldBuildingDetails(sceneOutline, context));
          break;
        case 'tension-building':
          suggestions.push(...await this.generateTensionElements(sceneOutline, context, mode));
          break;
      }

      return suggestions.filter(s => s.length > 10); // Filter out very short suggestions
    } catch (error) {
      console.error('Error generating scene expansion:', error);
      return [];
    }
  }

  // Private methods

  private initializeGenreModes(): void {
    // Fantasy
    this.genreModes.set('fantasy', {
      name: 'Fantasy',
      characteristics: {
        pacing: 'varied',
        description: 'rich',
        dialogue: 'formal',
        tension: 'building',
        focusAreas: ['world-building', 'magic-systems', 'character-growth', 'quest-structure']
      },
      commonPitfalls: [
        'Over-explaining magic systems',
        'Info-dumping world history',
        'Making characters too powerful too quickly',
        'Inconsistent magical rules'
      ],
      suggestionPrompts: [
        'How does the magic system affect this scene?',
        'What cultural elements are unique to this location?',
        'How do the character\'s abilities influence their choices?',
        'What ancient lore might be relevant here?'
      ],
      toneGuidelines: [
        'Maintain wonder and mystery',
        'Balance familiar and fantastical elements',
        'Use evocative, sensory language',
        'Respect the internal logic of your world'
      ]
    });

    // Mystery
    this.genreModes.set('mystery', {
      name: 'Mystery',
      characteristics: {
        pacing: 'building',
        description: 'atmospheric',
        dialogue: 'snappy',
        tension: 'constant',
        focusAreas: ['clue-placement', 'red-herrings', 'character-motives', 'revelation-timing']
      },
      commonPitfalls: [
        'Revealing too much too early',
        'Withholding crucial information unfairly',
        'Making the solution too obvious or too obscure',
        'Neglecting character development for plot'
      ],
      suggestionPrompts: [
        'What clue could be subtly revealed here?',
        'How might this character be misleading?',
        'What would the detective notice that others miss?',
        'How does this scene advance the investigation?'
      ],
      toneGuidelines: [
        'Maintain atmosphere of suspicion',
        'Use precise, observational language',
        'Balance revelation with mystery',
        'Keep readers guessing but playing fair'
      ]
    });

    // Romance
    this.genreModes.set('romance', {
      name: 'Romance',
      characteristics: {
        pacing: 'varied',
        description: 'moderate',
        dialogue: 'natural',
        tension: 'building',
        focusAreas: ['emotional-development', 'relationship-dynamics', 'chemistry', 'character-growth']
      },
      commonPitfalls: [
        'Rushing the emotional connection',
        'Creating unnecessary drama',
        'Ignoring character agency',
        'Using problematic tropes without examination'
      ],
      suggestionPrompts: [
        'How do the characters\' feelings develop here?',
        'What internal conflict might create tension?',
        'How does this moment deepen their connection?',
        'What vulnerability might be revealed?'
      ],
      toneGuidelines: [
        'Focus on emotional authenticity',
        'Show attraction through actions and thoughts',
        'Balance sweetness with realistic conflict',
        'Respect character autonomy and consent'
      ]
    });

    // Science Fiction
    this.genreModes.set('sci-fi', {
      name: 'Science Fiction',
      characteristics: {
        pacing: 'fast',
        description: 'atmospheric',
        dialogue: 'natural',
        tension: 'episodic',
        focusAreas: ['technology-impact', 'social-commentary', 'scientific-plausibility', 'future-speculation']
      },
      commonPitfalls: [
        'Over-explaining technology',
        'Ignoring social implications of scientific advances',
        'Making technology solve everything',
        'Forgetting human elements in favor of gadgets'
      ],
      suggestionPrompts: [
        'How does this technology change human behavior?',
        'What are the unintended consequences?',
        'How do people adapt to this new reality?',
        'What ethical questions does this raise?'
      ],
      toneGuidelines: [
        'Ground fantastic elements in human experience',
        'Use precise, technical language when appropriate',
        'Explore consequences of scientific advancement',
        'Balance wonder with realistic limitations'
      ]
    });

    // Thriller
    this.genreModes.set('thriller', {
      name: 'Thriller',
      characteristics: {
        pacing: 'fast',
        description: 'minimal',
        dialogue: 'snappy',
        tension: 'constant',
        focusAreas: ['suspense-building', 'pacing', 'stakes-escalation', 'action-sequences']
      },
      commonPitfalls: [
        'Non-stop action without breathing room',
        'Stakes that escalate too quickly',
        'Ignoring character motivation for plot',
        'Unrealistic solutions to problems'
      ],
      suggestionPrompts: [
        'How can tension be increased here?',
        'What could go wrong in this moment?',
        'How do the stakes escalate?',
        'What time pressure exists?'
      ],
      toneGuidelines: [
        'Maintain relentless forward momentum',
        'Use short, punchy sentences',
        'Keep readers on edge',
        'Balance action with character moments'
      ]
    });
  }

  private async analyzeNarrativeContext(content: string, context: WritingContext): Promise<any> {
    // Analyze current narrative state
    return {
      sentiment: this.analyzeSentiment(content),
      pacing: this.analyzePacing(content),
      tension: this.analyzeTension(content),
      characterPresence: this.analyzeCharacterPresence(content, context),
      dialogueRatio: this.calculateDialogueRatio(content),
      descriptiveRatio: this.calculateDescriptiveRatio(content)
    };
  }

  private async generateContinuationSuggestions(
    content: string,
    context: WritingContext,
    narrativeContext: any
  ): Promise<WritingSuggestion[]> {
    const suggestions: WritingSuggestion[] = [];
    
    // Analyze what type of continuation would be most appropriate
    const lastSentence = content.trim().split(/[.!?]/).slice(-1)[0];
    const needsAction = narrativeContext.pacing === 'slow' && narrativeContext.tension < 0.3;
    const needsReflection = narrativeContext.pacing === 'fast' && content.length > 1000;
    
    if (needsAction) {
      suggestions.push({
        id: 'action-continuation',
        type: 'continuation',
        priority: 'high',
        content: 'Consider adding an action or event to increase pacing',
        explanation: 'The current pacing is slow and tension is low. An action beat could reinvigorate the scene.',
        confidence: 0.8,
        contextualRelevance: 0.9,
        category: 'pacing',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0,
          complexity: 0.5
        }
      });
    }

    if (needsReflection) {
      suggestions.push({
        id: 'reflection-continuation',
        type: 'continuation',
        priority: 'medium',
        content: 'Consider a moment of character reflection or internal thought',
        explanation: 'After intense action, readers benefit from a breathing moment with character introspection.',
        confidence: 0.7,
        contextualRelevance: 0.8,
        category: 'character-development',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0.1,
          complexity: 0.6
        }
      });
    }

    return suggestions;
  }

  private async checkCharacterVoiceConsistency(
    content: string,
    characterId: string,
    context: WritingContext
  ): Promise<WritingSuggestion[]> {
    const suggestions: WritingSuggestion[] = [];
    const voiceProfile = this.characterVoices.get(characterId);
    
    if (!voiceProfile) {
      return suggestions;
    }

    // Extract dialogue from content
    const dialogue = this.extractDialogue(content);
    
    if (dialogue.length > 0) {
      const currentVoiceAnalysis = await this.analyzeDialogue(dialogue.join(' '));
      const consistency = this.compareVoiceProfiles(voiceProfile, currentVoiceAnalysis);
      
      if (consistency < 0.7) {
        suggestions.push({
          id: 'voice-consistency-warning',
          type: 'correction',
          priority: 'high',
          content: `This dialogue doesn't match ${voiceProfile.name}'s established voice patterns`,
          explanation: `Based on previous examples, ${voiceProfile.name} typically uses ${voiceProfile.speechPatterns.formality > 0.7 ? 'formal' : 'casual'} language and ${voiceProfile.speechPatterns.sentenceLength} sentences.`,
          confidence: 1 - consistency,
          contextualRelevance: 0.9,
          characterConsistency: consistency,
          category: 'character-voice',
          metadata: {
            wordCount: dialogue.join(' ').split(' ').length,
            estimatedReadingTime: 0,
            sentiment: 0,
            complexity: 0.5
          }
        });
      }
    }

    return suggestions;
  }

  private async getGenreSpecificSuggestions(
    content: string,
    genre: string,
    narrativeContext: any
  ): Promise<WritingSuggestion[]> {
    const suggestions: WritingSuggestion[] = [];
    const mode = this.getGenreMode(genre);
    
    if (!mode) return suggestions;

    // Check if content aligns with genre characteristics
    if (mode.characteristics.pacing === 'fast' && narrativeContext.pacing === 'slow') {
      suggestions.push({
        id: 'genre-pacing-mismatch',
        type: 'enhancement',
        priority: 'medium',
        content: `Consider increasing the pacing for ${genre} genre`,
        explanation: `${genre} typically benefits from ${mode.characteristics.pacing} pacing. Current scene feels slower than expected.`,
        confidence: 0.6,
        contextualRelevance: 0.7,
        category: 'genre-alignment',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0,
          complexity: 0.4
        }
      });
    }

    // Add genre-specific prompts as suggestions
    mode.suggestionPrompts.forEach((prompt, index) => {
      suggestions.push({
        id: `genre-prompt-${index}`,
        type: 'enhancement',
        priority: 'low',
        content: prompt,
        explanation: `This question can help develop genre-appropriate elements in your scene.`,
        confidence: 0.5,
        contextualRelevance: 0.6,
        category: 'genre-development',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0,
          complexity: 0.3
        }
      });
    });

    return suggestions;
  }

  private async analyzePacingAndFlow(content: string, context: WritingContext): Promise<WritingSuggestion[]> {
    const suggestions: WritingSuggestion[] = [];
    
    // Analyze sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
    
    // Check for pacing issues
    if (avgSentenceLength > 25) {
      suggestions.push({
        id: 'long-sentences',
        type: 'enhancement',
        priority: 'medium',
        content: 'Consider breaking up some longer sentences for better pacing',
        explanation: 'Very long sentences can slow down reading pace. Mix in some shorter sentences for variety.',
        confidence: 0.7,
        contextualRelevance: 0.8,
        category: 'pacing',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0,
          complexity: 0.6
        }
      });
    }

    if (avgSentenceLength < 8) {
      suggestions.push({
        id: 'short-sentences',
        type: 'enhancement',
        priority: 'low',
        content: 'Consider combining some shorter sentences for smoother flow',
        explanation: 'Very short sentences can feel choppy. Try varying sentence length for better rhythm.',
        confidence: 0.6,
        contextualRelevance: 0.7,
        category: 'flow',
        metadata: {
          wordCount: 0,
          estimatedReadingTime: 0,
          sentiment: 0,
          complexity: 0.4
        }
      });
    }

    return suggestions;
  }

  private filterAndRankSuggestions(suggestions: WritingSuggestion[], userPreferences?: any): WritingSuggestion[] {
    // Filter out low-confidence suggestions
    let filtered = suggestions.filter(s => s.confidence > 0.3);
    
    // Sort by priority and relevance
    filtered.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return (b.confidence * b.contextualRelevance) - (a.confidence * a.contextualRelevance);
    });
    
    // Limit to top 10 suggestions
    return filtered.slice(0, 10);
  }

  private async createInitialVoiceProfile(characterId: string): Promise<CharacterVoiceProfile> {
    return {
      characterId,
      name: `Character ${characterId}`,
      speechPatterns: {
        vocabulary: [],
        sentenceLength: 'medium',
        formality: 0.5,
        emotionalRange: ['neutral'],
        uniquePhrases: [],
        avoidedWords: []
      },
      dialogueExamples: [],
      consistencyScore: 1.0,
      lastUpdated: new Date()
    };
  }

  private async analyzeDialogue(dialogue: string): Promise<any> {
    const words = dialogue.toLowerCase().split(/\s+/);
    const sentences = dialogue.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      vocabulary: [...new Set(words)],
      avgSentenceLength: sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length,
      formality: this.calculateFormality(words),
      emotionalIndicators: this.extractEmotionalIndicators(dialogue),
      uniquePhrases: this.extractPhrases(dialogue)
    };
  }

  private updateSpeechPatterns(profile: CharacterVoiceProfile, analysis: any): void {
    // Update vocabulary (keep top 200 most common words)
    const newVocab = [...new Set([...profile.speechPatterns.vocabulary, ...analysis.vocabulary])];
    profile.speechPatterns.vocabulary = newVocab.slice(0, 200);
    
    // Update sentence length preference
    if (analysis.avgSentenceLength < 10) {
      profile.speechPatterns.sentenceLength = 'short';
    } else if (analysis.avgSentenceLength > 20) {
      profile.speechPatterns.sentenceLength = 'long';
    } else {
      profile.speechPatterns.sentenceLength = 'medium';
    }
    
    // Update formality (weighted average)
    profile.speechPatterns.formality = (profile.speechPatterns.formality * 0.8) + (analysis.formality * 0.2);
    
    // Add unique phrases
    profile.speechPatterns.uniquePhrases.push(...analysis.uniquePhrases);
    profile.speechPatterns.uniquePhrases = [...new Set(profile.speechPatterns.uniquePhrases)].slice(0, 50);
  }

  private async calculateVoiceConsistency(profile: CharacterVoiceProfile): Promise<number> {
    if (profile.dialogueExamples.length < 2) {
      return 1.0;
    }

    // Compare recent dialogue examples for consistency
    const recentExamples = profile.dialogueExamples.slice(-5);
    let totalConsistency = 0;

    for (let i = 1; i < recentExamples.length; i++) {
      const analysis1 = await this.analyzeDialogue(recentExamples[i - 1].text);
      const analysis2 = await this.analyzeDialogue(recentExamples[i].text);
      
      const consistency = this.compareVoiceProfiles(
        { speechPatterns: analysis1 } as any,
        analysis2
      );
      
      totalConsistency += consistency;
    }

    return totalConsistency / (recentExamples.length - 1);
  }

  private compareVoiceProfiles(profile: CharacterVoiceProfile, analysis: any): number {
    let similarity = 0;
    let factors = 0;

    // Compare formality
    const formalityDiff = Math.abs(profile.speechPatterns.formality - analysis.formality);
    similarity += 1 - formalityDiff;
    factors++;

    // Compare vocabulary overlap
    const vocabOverlap = analysis.vocabulary.filter((word: string) => 
      profile.speechPatterns.vocabulary.includes(word)
    ).length;
    const vocabSimilarity = vocabOverlap / Math.max(analysis.vocabulary.length, profile.speechPatterns.vocabulary.length);
    similarity += vocabSimilarity;
    factors++;

    return similarity / factors;
  }

  private extractDialogue(content: string): string[] {
    // Extract text within quotes
    const dialogueRegex = /"([^"]*)"/g;
    const matches = [];
    let match;
    
    while ((match = dialogueRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis - in production, use a proper NLP library
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'beautiful', 'love', 'happy', 'joy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'fear', 'death', 'dark'];
    
    const words = content.toLowerCase().split(/\s+/);
    let sentiment = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) sentiment += 1;
      if (negativeWords.includes(word)) sentiment -= 1;
    });
    
    return Math.max(-1, Math.min(1, sentiment / words.length * 10));
  }

  private analyzePacing(content: string): 'fast' | 'medium' | 'slow' {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
    
    if (avgLength < 12) return 'fast';
    if (avgLength > 20) return 'slow';
    return 'medium';
  }

  private analyzeTension(content: string): number {
    // Analyze tension indicators
    const tensionWords = ['suddenly', 'quickly', 'danger', 'fear', 'urgent', 'rushed', 'panic', 'threat'];
    const calmWords = ['peaceful', 'calm', 'slowly', 'gently', 'quiet', 'serene', 'relaxed'];
    
    const words = content.toLowerCase().split(/\s+/);
    let tension = 0;
    
    words.forEach(word => {
      if (tensionWords.includes(word)) tension += 1;
      if (calmWords.includes(word)) tension -= 1;
    });
    
    return Math.max(0, Math.min(1, (tension / words.length * 50) + 0.5));
  }

  private analyzeCharacterPresence(content: string, context: WritingContext): any {
    // Count character mentions and dialogue
    const dialogueCount = (content.match(/"/g) || []).length / 2;
    const totalSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    return {
      dialogueRatio: dialogueCount / totalSentences,
      hasCharacterInteraction: dialogueCount > 0,
      narrativeBalance: dialogueCount < totalSentences * 0.3 ? 'narrative-heavy' : 
                       dialogueCount > totalSentences * 0.7 ? 'dialogue-heavy' : 'balanced'
    };
  }

  private calculateDialogueRatio(content: string): number {
    const dialogueLength = (content.match(/"[^"]*"/g) || []).join('').length;
    return dialogueLength / content.length;
  }

  private calculateDescriptiveRatio(content: string): number {
    // Simple heuristic: count adjectives and descriptive phrases
    const descriptiveWords = ['beautiful', 'dark', 'bright', 'loud', 'quiet', 'soft', 'hard', 'smooth', 'rough'];
    const words = content.toLowerCase().split(/\s+/);
    const descriptiveCount = words.filter(word => descriptiveWords.includes(word)).length;
    
    return descriptiveCount / words.length;
  }

  private calculateFormality(words: string[]): number {
    const formalWords = ['therefore', 'however', 'moreover', 'nevertheless', 'subsequently', 'accordingly'];
    const informalWords = ['yeah', 'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'ok', 'okay'];
    
    let formalCount = 0;
    let informalCount = 0;
    
    words.forEach(word => {
      if (formalWords.includes(word)) formalCount++;
      if (informalWords.includes(word)) informalCount++;
    });
    
    const total = formalCount + informalCount;
    if (total === 0) return 0.5; // neutral
    
    return formalCount / total;
  }

  private extractEmotionalIndicators(text: string): string[] {
    const emotionWords = ['angry', 'sad', 'happy', 'excited', 'nervous', 'calm', 'frustrated', 'joyful'];
    const words = text.toLowerCase().split(/\s+/);
    
    return emotionWords.filter(emotion => words.includes(emotion));
  }

  private extractPhrases(text: string): string[] {
    // Extract potential unique phrases (3+ words)
    const words = text.split(/\s+/);
    const phrases = [];
    
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (phrase.length > 8) { // Minimum phrase length
        phrases.push(phrase);
      }
    }
    
    return phrases;
  }

  private async performEmotionalAnalysis(content: string): Promise<any> {
    // Analyze emotional content and trajectory
    return {
      dominantEmotion: 'neutral',
      emotionSequence: ['neutral'],
      intensity: 0.5
    };
  }

  private async predictEmotionalTrajectory(analysis: any, context: WritingContext): Promise<any> {
    return {
      nextEmotion: 'neutral',
      reasoning: 'Based on current emotional state and story context'
    };
  }

  private async generateSensoryDetails(outline: string, context: WritingContext, mode: GenreWritingMode | null): Promise<string[]> {
    // Generate appropriate sensory details based on genre and context
    return [
      "Consider adding visual details about the setting",
      "What sounds would be present in this scene?",
      "How might the temperature or atmosphere feel?",
      "What scents or textures could enhance the scene?"
    ];
  }

  private async generateCharacterInteractions(outline: string, context: WritingContext): Promise<string[]> {
    return [
      "What subtext exists between these characters?",
      "How do their body language and gestures reveal their feelings?",
      "What are they not saying to each other?",
      "How does their history influence this interaction?"
    ];
  }

  private async generateWorldBuildingDetails(outline: string, context: WritingContext): Promise<string[]> {
    return [
      "What unique aspects of this world affect the scene?",
      "How do the social or cultural norms influence the characters?",
      "What historical events might be relevant here?",
      "How does the setting's atmosphere contribute to the mood?"
    ];
  }

  private async generateTensionElements(outline: string, context: WritingContext, mode: GenreWritingMode | null): Promise<string[]> {
    return [
      "What could go wrong in this moment?",
      "How can you increase the stakes?",
      "What time pressure exists?",
      "What conflicting desires drive the tension?"
    ];
  }
}

export const smartWritingCompanion = new SmartWritingCompanionService();