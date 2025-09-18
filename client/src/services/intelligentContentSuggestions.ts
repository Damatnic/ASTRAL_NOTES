/**
 * Intelligent Content Suggestions Service
 * Provides personalized writing assistance, auto-completion, and creative prompts
 * Tailored for individual writers to enhance creativity and overcome writer's block
 */

import { EventEmitter } from 'events';

export interface ContentSuggestion {
  id: string;
  type: 'completion' | 'alternative' | 'expansion' | 'transition' | 'dialogue' | 'description';
  text: string;
  confidence: number;
  reasoning: string;
  context: {
    before: string;
    after: string;
    position: number;
  };
  category: 'grammar' | 'style' | 'creativity' | 'flow' | 'character' | 'plot';
  personalityMatch: number; // How well this matches the user's writing style
}

export interface WritingPrompt {
  id: string;
  prompt: string;
  type: 'character' | 'scene' | 'dialogue' | 'conflict' | 'setting' | 'emotion';
  difficulty: 'easy' | 'medium' | 'hard';
  genre?: string;
  estimatedTime: number; // minutes
  inspiration: string;
  tags: string[];
}

export interface PersonalWritingProfile {
  preferredGenres: string[];
  writingStyle: {
    formalityLevel: number; // 0-1
    creativityLevel: number; // 0-1
    verbosityLevel: number; // 0-1
    emotionalIntensity: number; // 0-1
  };
  vocabulary: {
    commonWords: Set<string>;
    favoriteWords: Set<string>;
    avoidedWords: Set<string>;
  };
  patterns: {
    averageSentenceLength: number;
    paragraphStructure: 'short' | 'medium' | 'long' | 'varied';
    dialogueStyle: 'minimal' | 'conversational' | 'dramatic';
    narrativeVoice: 'first' | 'third-limited' | 'third-omniscient' | 'mixed';
  };
  preferences: {
    suggestionsFrequency: 'minimal' | 'moderate' | 'frequent';
    creativityBoosts: boolean;
    grammarCorrections: boolean;
    styleImprovement: boolean;
  };
}

export interface CreativeBoost {
  id: string;
  trigger: 'stuck' | 'repetitive' | 'bland' | 'transition' | 'dialogue';
  suggestions: string[];
  type: 'word_alternatives' | 'sentence_starters' | 'plot_twists' | 'character_actions' | 'sensory_details';
  inspirationSource: string;
}

class IntelligentContentSuggestionsService extends EventEmitter {
  private personalProfile: PersonalWritingProfile;
  private recentSuggestions: ContentSuggestion[] = [];
  private acceptedSuggestions: ContentSuggestion[] = [];
  private rejectedSuggestions: ContentSuggestion[] = [];
  private writingContext: {
    currentProject?: string;
    currentScene?: string;
    genre?: string;
    mood?: string;
    targetAudience?: string;
  } = {};

  // Personal vocabulary learned from user's writing
  private personalVocabulary = new Map<string, {
    frequency: number;
    contexts: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    lastUsed: Date;
  }>();

  // Writing patterns learned from user's style
  private stylisticPatterns = {
    sentenceStarters: new Map<string, number>(),
    transitionPhrases: new Map<string, number>(),
    descriptiveWords: new Map<string, number>(),
    dialogueTags: new Map<string, number>()
  };

  constructor() {
    super();
    this.initializePersonalProfile();
    this.loadPersonalData();
  }

  // Initialize with default personal profile
  private initializePersonalProfile(): void {
    this.personalProfile = {
      preferredGenres: [],
      writingStyle: {
        formalityLevel: 0.5,
        creativityLevel: 0.7,
        verbosityLevel: 0.6,
        emotionalIntensity: 0.5
      },
      vocabulary: {
        commonWords: new Set(),
        favoriteWords: new Set(),
        avoidedWords: new Set()
      },
      patterns: {
        averageSentenceLength: 18,
        paragraphStructure: 'medium',
        dialogueStyle: 'conversational',
        narrativeVoice: 'third-limited'
      },
      preferences: {
        suggestionsFrequency: 'moderate',
        creativityBoosts: true,
        grammarCorrections: true,
        styleImprovement: true
      }
    };
  }

  // Learn from user's writing to improve personalization
  public learnFromText(text: string, context?: {
    project?: string;
    scene?: string;
    genre?: string;
  }): void {
    this.analyzeVocabulary(text);
    this.analyzeStylisticPatterns(text);
    this.updateWritingStyle(text);
    
    if (context) {
      this.writingContext = { ...this.writingContext, ...context };
    }

    this.emit('profileUpdated', this.personalProfile);
  }

  // Generate intelligent suggestions for current text
  public generateSuggestions(
    text: string, 
    cursorPosition: number,
    context: {
      before: string;
      after: string;
      fullText: string;
    }
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    // Auto-completion suggestions
    const completionSuggestions = this.generateCompletionSuggestions(text, cursorPosition, context);
    suggestions.push(...completionSuggestions);

    // Style improvement suggestions
    if (this.personalProfile.preferences.styleImprovement) {
      const styleSuggestions = this.generateStyleSuggestions(context.before, context.after);
      suggestions.push(...styleSuggestions);
    }

    // Creative enhancement suggestions
    if (this.personalProfile.preferences.creativityBoosts) {
      const creativeSuggestions = this.generateCreativeSuggestions(context.before, context.after);
      suggestions.push(...creativeSuggestions);
    }

    // Transition suggestions
    const transitionSuggestions = this.generateTransitionSuggestions(context.before, context.after);
    suggestions.push(...transitionSuggestions);

    // Personalize suggestions based on user's style
    const personalizedSuggestions = this.personalizesuggestions(suggestions);

    this.recentSuggestions = personalizedSuggestions;
    return personalizedSuggestions;
  }

  // Generate creative boosts for overcoming writer's block
  public generateCreativeBoost(trigger: CreativeBoost['trigger'], currentText: string): CreativeBoost {
    const boosts: Record<CreativeBoost['trigger'], () => CreativeBoost> = {
      stuck: () => this.generateStuckBoost(currentText),
      repetitive: () => this.generateRepetitiveBoost(currentText),
      bland: () => this.generateBlandBoost(currentText),
      transition: () => this.generateTransitionBoost(currentText),
      dialogue: () => this.generateDialogueBoost(currentText)
    };

    return boosts[trigger]();
  }

  // Generate writing prompts tailored to user's style and preferences
  public generatePersonalWritingPrompts(count: number = 5): WritingPrompt[] {
    const prompts: WritingPrompt[] = [];
    const genres = this.personalProfile.preferredGenres.length > 0 
      ? this.personalProfile.preferredGenres 
      : ['general'];

    for (let i = 0; i < count; i++) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const prompt = this.createPersonalizedPrompt(genre);
      prompts.push(prompt);
    }

    return prompts;
  }

  // Track user feedback on suggestions
  public provideFeedback(suggestionId: string, feedback: 'accept' | 'reject' | 'modify', modification?: string): void {
    const suggestion = this.recentSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    if (feedback === 'accept') {
      this.acceptedSuggestions.push(suggestion);
      this.learnFromAcceptedSuggestion(suggestion);
    } else if (feedback === 'reject') {
      this.rejectedSuggestions.push(suggestion);
      this.learnFromRejectedSuggestion(suggestion);
    } else if (feedback === 'modify' && modification) {
      this.learnFromModification(suggestion, modification);
    }

    this.updatePersonalPreferences();
    this.emit('feedbackReceived', { suggestionId, feedback, modification });
  }

  // Private methods for generating specific types of suggestions

  private generateCompletionSuggestions(
    text: string, 
    cursorPosition: number, 
    context: { before: string; after: string; fullText: string }
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const currentWord = this.getCurrentWord(text, cursorPosition);
    const sentence = this.getCurrentSentence(context.before);

    // Word completion based on personal vocabulary
    if (currentWord.length > 2) {
      const wordSuggestions = this.getPersonalWordCompletions(currentWord);
      wordSuggestions.forEach(word => {
        suggestions.push({
          id: `completion-${Date.now()}-${Math.random()}`,
          type: 'completion',
          text: word,
          confidence: this.calculatePersonalWordConfidence(word, currentWord),
          reasoning: 'Based on your writing patterns',
          context: { before: context.before, after: context.after, position: cursorPosition },
          category: 'style',
          personalityMatch: this.calculatePersonalityMatch(word)
        });
      });
    }

    // Sentence completion based on context
    if (sentence.length > 10) {
      const sentenceCompletions = this.generateSentenceCompletions(sentence, context.fullText);
      suggestions.push(...sentenceCompletions);
    }

    return suggestions;
  }

  private generateStyleSuggestions(before: string, after: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const lastSentence = this.getLastCompleteSentence(before);

    if (lastSentence) {
      // Check for repetitive sentence starters
      const starterWords = this.extractSentenceStarter(lastSentence);
      if (this.isRepetitiveStarter(starterWords, before)) {
        const alternatives = this.generateAlternativeStarters(starterWords);
        alternatives.forEach(alt => {
          suggestions.push({
            id: `style-starter-${Date.now()}-${Math.random()}`,
            type: 'alternative',
            text: alt,
            confidence: 0.8,
            reasoning: 'Vary sentence beginnings for better flow',
            context: { before, after, position: before.length - lastSentence.length },
            category: 'style',
            personalityMatch: this.calculatePersonalityMatch(alt)
          });
        });
      }

      // Check for passive voice
      if (this.containsPassiveVoice(lastSentence)) {
        const activeAlternative = this.convertToActiveVoice(lastSentence);
        if (activeAlternative) {
          suggestions.push({
            id: `style-active-${Date.now()}`,
            type: 'alternative',
            text: activeAlternative,
            confidence: 0.9,
            reasoning: 'Active voice is more engaging',
            context: { before, after, position: before.length - lastSentence.length },
            category: 'style',
            personalityMatch: 0.8
          });
        }
      }
    }

    return suggestions;
  }

  private generateCreativeSuggestions(before: string, after: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const context = this.analyzeCreativeContext(before);

    // Suggest sensory details
    if (context.needsSensoryDetail) {
      const sensoryDetails = this.generateSensoryDetails(context.scene, context.mood);
      sensoryDetails.forEach(detail => {
        suggestions.push({
          id: `creative-sensory-${Date.now()}-${Math.random()}`,
          type: 'expansion',
          text: detail,
          confidence: 0.7,
          reasoning: 'Add sensory details to engage readers',
          context: { before, after, position: before.length },
          category: 'creativity',
          personalityMatch: this.calculatePersonalityMatch(detail)
        });
      });
    }

    // Suggest dialogue enhancement
    if (context.hasDialogue && context.needsDialogueTag) {
      const dialogueTags = this.generatePersonalizedDialogueTags();
      dialogueTags.forEach(tag => {
        suggestions.push({
          id: `creative-dialogue-${Date.now()}-${Math.random()}`,
          type: 'expansion',
          text: tag,
          confidence: 0.6,
          reasoning: 'Enhance dialogue with descriptive tags',
          context: { before, after, position: before.length },
          category: 'creativity',
          personalityMatch: this.calculatePersonalityMatch(tag)
        });
      });
    }

    return suggestions;
  }

  private generateTransitionSuggestions(before: string, after: string): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    if (this.needsTransition(before, after)) {
      const transitions = this.getPersonalizedTransitions();
      transitions.forEach(transition => {
        suggestions.push({
          id: `transition-${Date.now()}-${Math.random()}`,
          type: 'transition',
          text: transition,
          confidence: 0.8,
          reasoning: 'Smooth transition between ideas',
          context: { before, after, position: before.length },
          category: 'flow',
          personalityMatch: this.calculatePersonalityMatch(transition)
        });
      });
    }

    return suggestions;
  }

  // Creative boost generators

  private generateStuckBoost(currentText: string): CreativeBoost {
    const lastSentence = this.getLastCompleteSentence(currentText);
    const suggestions = [
      "What if the opposite happened?",
      "Add a sensory detail that wasn't there before",
      "What is your character feeling right now?",
      "Introduce an unexpected element",
      "Change the perspective or point of view"
    ];

    return {
      id: `boost-stuck-${Date.now()}`,
      trigger: 'stuck',
      suggestions,
      type: 'plot_twists',
      inspirationSource: 'Creative writing techniques'
    };
  }

  private generateRepetitiveBoost(currentText: string): CreativeBoost {
    const repetitiveWords = this.findRepetitiveWords(currentText);
    const alternatives = repetitiveWords.flatMap(word => 
      this.getPersonalSynonyms(word).slice(0, 3)
    );

    return {
      id: `boost-repetitive-${Date.now()}`,
      trigger: 'repetitive',
      suggestions: alternatives,
      type: 'word_alternatives',
      inspirationSource: 'Personal vocabulary expansion'
    };
  }

  private generateBlandBoost(currentText: string): CreativeBoost {
    const suggestions = [
      "She felt the weight of unspoken words",
      "The silence stretched between them like a taut wire",
      "His voice carried the echo of old regrets",
      "The room held its breath",
      "Time seemed to fold in on itself"
    ];

    return {
      id: `boost-bland-${Date.now()}`,
      trigger: 'bland',
      suggestions: this.personalizeDescriptivePhrases(suggestions),
      type: 'sensory_details',
      inspirationSource: 'Evocative imagery collection'
    };
  }

  private generateTransitionBoost(currentText: string): CreativeBoost {
    const personalTransitions = Array.from(this.stylisticPatterns.transitionPhrases.keys());
    const defaultTransitions = [
      "Meanwhile",
      "In the distance",
      "Suddenly",
      "Hours later",
      "Without warning"
    ];

    const suggestions = personalTransitions.length > 0 ? personalTransitions : defaultTransitions;

    return {
      id: `boost-transition-${Date.now()}`,
      trigger: 'transition',
      suggestions: suggestions.slice(0, 5),
      type: 'sentence_starters',
      inspirationSource: 'Personal transition patterns'
    };
  }

  private generateDialogueBoost(currentText: string): CreativeBoost {
    const suggestions = [
      "What aren't they saying?",
      "Add subtext to the conversation",
      "Show emotion through action, not words",
      "What does their body language reveal?",
      "Let the silence speak volumes"
    ];

    return {
      id: `boost-dialogue-${Date.now()}`,
      trigger: 'dialogue',
      suggestions,
      type: 'character_actions',
      inspirationSource: 'Dialogue enhancement techniques'
    };
  }

  // Personal learning and analysis methods

  private analyzeVocabulary(text: string): void {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = text.split(/[.!?]+/);
    
    words.forEach(word => {
      if (word.length > 3) {
        const existing = this.personalVocabulary.get(word);
        if (existing) {
          existing.frequency++;
          existing.lastUsed = new Date();
        } else {
          this.personalVocabulary.set(word, {
            frequency: 1,
            contexts: [this.getWordContext(text, word)],
            sentiment: this.analyzeSentiment(word),
            lastUsed: new Date()
          });
        }
      }
    });

    // Update favorite words (high frequency, recent use)
    this.updateFavoriteWords();
  }

  private analyzeStylisticPatterns(text: string): void {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        // Analyze sentence starters
        const starter = this.extractSentenceStarter(trimmed);
        this.stylisticPatterns.sentenceStarters.set(
          starter,
          (this.stylisticPatterns.sentenceStarters.get(starter) || 0) + 1
        );

        // Analyze descriptive words
        const descriptiveWords = this.extractDescriptiveWords(trimmed);
        descriptiveWords.forEach(word => {
          this.stylisticPatterns.descriptiveWords.set(
            word,
            (this.stylisticPatterns.descriptiveWords.get(word) || 0) + 1
          );
        });
      }
    });

    // Analyze transitions
    this.analyzeTransitions(text);
  }

  private updateWritingStyle(text: string): void {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    
    // Update average sentence length
    const avgSentenceLength = words.length / sentences.length;
    this.personalProfile.patterns.averageSentenceLength = 
      (this.personalProfile.patterns.averageSentenceLength + avgSentenceLength) / 2;

    // Update formality level
    const formalWords = words.filter(word => this.isFormalWord(word));
    const formalityLevel = formalWords.length / words.length;
    this.personalProfile.writingStyle.formalityLevel = 
      (this.personalProfile.writingStyle.formalityLevel + formalityLevel) / 2;

    // Update verbosity level
    const verbosityLevel = words.length / sentences.length / 20; // Normalize to 0-1
    this.personalProfile.writingStyle.verbosityLevel = 
      Math.min(1, (this.personalProfile.writingStyle.verbosityLevel + verbosityLevel) / 2);
  }

  private personalizesuggestions(suggestions: ContentSuggestion[]): ContentSuggestion[] {
    return suggestions
      .map(suggestion => ({
        ...suggestion,
        personalityMatch: this.calculatePersonalityMatch(suggestion.text)
      }))
      .sort((a, b) => {
        // Sort by confidence and personality match
        const aScore = a.confidence * 0.6 + a.personalityMatch * 0.4;
        const bScore = b.confidence * 0.6 + b.personalityMatch * 0.4;
        return bScore - aScore;
      })
      .slice(0, 8); // Limit to top 8 suggestions
  }

  private calculatePersonalityMatch(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let match = 0.5; // Base score

    // Check against favorite words
    words.forEach(word => {
      if (this.personalProfile.vocabulary.favoriteWords.has(word)) {
        match += 0.1;
      }
      if (this.personalProfile.vocabulary.avoidedWords.has(word)) {
        match -= 0.2;
      }
    });

    // Check formality match
    const formalWords = words.filter(word => this.isFormalWord(word));
    const textFormality = formalWords.length / words.length;
    const formalityDiff = Math.abs(textFormality - this.personalProfile.writingStyle.formalityLevel);
    match -= formalityDiff * 0.3;

    return Math.max(0, Math.min(1, match));
  }

  // Helper methods

  private getCurrentWord(text: string, position: number): string {
    const beforeCursor = text.substring(0, position);
    const match = beforeCursor.match(/\b\w+$/);
    return match ? match[0] : '';
  }

  private getCurrentSentence(text: string): string {
    const sentences = text.split(/[.!?]+/);
    return sentences[sentences.length - 1] || '';
  }

  private getLastCompleteSentence(text: string): string | null {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length > 1 ? sentences[sentences.length - 2].trim() : null;
  }

  private extractSentenceStarter(sentence: string): string {
    const words = sentence.trim().split(/\s+/);
    return words.slice(0, 2).join(' ').toLowerCase();
  }

  private isRepetitiveStarter(starter: string, text: string): boolean {
    const sentences = text.split(/[.!?]+/);
    const starterCount = sentences.filter(s => 
      s.trim().toLowerCase().startsWith(starter)
    ).length;
    return starterCount > 2;
  }

  private generateAlternativeStarters(starter: string): string[] {
    const alternatives = new Map([
      ['the', ['This', 'That', 'A', 'One']],
      ['he', ['John', 'The man', 'His face', 'With a']],
      ['she', ['Sarah', 'The woman', 'Her eyes', 'Suddenly']],
      ['i', ['My heart', 'The moment', 'Without thinking', 'Despite']],
      ['it', ['The thing', 'This moment', 'Everything', 'Nothing']]
    ]);

    const firstWord = starter.split(' ')[0];
    return alternatives.get(firstWord) || ['Meanwhile', 'However', 'Suddenly', 'Then'];
  }

  private getPersonalWordCompletions(partial: string): string[] {
    const completions: string[] = [];
    
    this.personalVocabulary.forEach((data, word) => {
      if (word.startsWith(partial.toLowerCase()) && word !== partial.toLowerCase()) {
        completions.push({
          word,
          score: data.frequency * (data.lastUsed.getTime() / Date.now())
        });
      }
    });

    return completions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.word);
  }

  private generateSentenceCompletions(sentence: string, fullText: string): ContentSuggestion[] {
    // This would typically use an AI model for completion
    // For now, we'll provide some contextual completions
    const suggestions: ContentSuggestion[] = [];
    
    if (sentence.includes('felt')) {
      suggestions.push({
        id: `sentence-completion-${Date.now()}`,
        type: 'completion',
        text: ' a wave of uncertainty wash over her',
        confidence: 0.7,
        reasoning: 'Complete the emotional description',
        context: { before: sentence, after: '', position: sentence.length },
        category: 'creativity',
        personalityMatch: 0.8
      });
    }

    return suggestions;
  }

  private createPersonalizedPrompt(genre: string): WritingPrompt {
    const prompts = {
      general: [
        "Write about a moment when everything changed",
        "Describe a place that holds memories",
        "Create a character who has a secret"
      ],
      fantasy: [
        "A magic system based on emotions",
        "Two worlds connected by dreams",
        "A character who can see others' fears"
      ],
      mystery: [
        "A detective's last case before retirement",
        "Evidence that points to the impossible",
        "A witness who only speaks in riddles"
      ]
    };

    const genrePrompts = prompts[genre as keyof typeof prompts] || prompts.general;
    const prompt = genrePrompts[Math.floor(Math.random() * genrePrompts.length)];

    return {
      id: `prompt-${Date.now()}`,
      prompt,
      type: 'scene',
      difficulty: 'medium',
      genre,
      estimatedTime: 15 + Math.floor(Math.random() * 30),
      inspiration: 'Personalized for your writing style',
      tags: [genre, 'creative', 'personal']
    };
  }

  // Additional helper methods for learning and feedback

  private learnFromAcceptedSuggestion(suggestion: ContentSuggestion): void {
    // Increase confidence in similar suggestions
    const words = suggestion.text.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (word.length > 3) {
        this.personalProfile.vocabulary.favoriteWords.add(word);
      }
    });
  }

  private learnFromRejectedSuggestion(suggestion: ContentSuggestion): void {
    // Decrease confidence in similar suggestions
    const words = suggestion.text.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (word.length > 3) {
        this.personalProfile.vocabulary.avoidedWords.add(word);
      }
    });
  }

  private learnFromModification(suggestion: ContentSuggestion, modification: string): void {
    // Learn from how the user modified the suggestion
    this.learnFromText(modification);
  }

  private updatePersonalPreferences(): void {
    // Adjust preferences based on feedback patterns
    const acceptanceRate = this.acceptedSuggestions.length / 
      (this.acceptedSuggestions.length + this.rejectedSuggestions.length);
    
    if (acceptanceRate > 0.8) {
      // User likes suggestions, maybe increase frequency
      if (this.personalProfile.preferences.suggestionsFrequency === 'minimal') {
        this.personalProfile.preferences.suggestionsFrequency = 'moderate';
      }
    } else if (acceptanceRate < 0.3) {
      // User rejects many suggestions, decrease frequency
      if (this.personalProfile.preferences.suggestionsFrequency === 'frequent') {
        this.personalProfile.preferences.suggestionsFrequency = 'moderate';
      }
    }
  }

  private updateFavoriteWords(): void {
    // Update favorite words based on frequency and recency
    const favoriteThreshold = 5;
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    this.personalVocabulary.forEach((data, word) => {
      const isRecent = Date.now() - data.lastUsed.getTime() < recentThreshold;
      const isFrequent = data.frequency >= favoriteThreshold;
      
      if (isRecent && isFrequent) {
        this.personalProfile.vocabulary.favoriteWords.add(word);
      }
    });
  }

  // Utility methods for analysis

  private isFormalWord(word: string): boolean {
    const formalWords = new Set([
      'therefore', 'however', 'consequently', 'furthermore', 'moreover',
      'nevertheless', 'nonetheless', 'accordingly', 'subsequently'
    ]);
    return formalWords.has(word.toLowerCase());
  }

  private analyzeSentiment(word: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = new Set(['beautiful', 'wonderful', 'amazing', 'great', 'excellent']);
    const negativeWords = new Set(['terrible', 'awful', 'horrible', 'bad', 'worse']);
    
    if (positiveWords.has(word.toLowerCase())) return 'positive';
    if (negativeWords.has(word.toLowerCase())) return 'negative';
    return 'neutral';
  }

  private getWordContext(text: string, word: string): string {
    const index = text.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + word.length + 20);
    return text.substring(start, end);
  }

  private extractDescriptiveWords(sentence: string): string[] {
    const descriptivePattern = /\b(beautiful|dark|bright|soft|loud|smooth|rough|warm|cold|sweet|bitter|mysterious|ancient|modern|elegant|rustic)\b/gi;
    return sentence.match(descriptivePattern) || [];
  }

  private analyzeTransitions(text: string): void {
    const transitionPattern = /\b(meanwhile|however|therefore|suddenly|then|next|finally|afterwards|consequently)\b/gi;
    const matches = text.match(transitionPattern) || [];
    
    matches.forEach(transition => {
      this.stylisticPatterns.transitionPhrases.set(
        transition.toLowerCase(),
        (this.stylisticPatterns.transitionPhrases.get(transition.toLowerCase()) || 0) + 1
      );
    });
  }

  private containsPassiveVoice(sentence: string): boolean {
    return /\b(was|were|been|being)\s+\w+ed\b/i.test(sentence);
  }

  private convertToActiveVoice(sentence: string): string | null {
    // Simple passive to active conversion
    const passiveMatch = sentence.match(/(.+?)\s+(was|were|been|being)\s+(\w+ed)\s+by\s+(.+)/i);
    if (passiveMatch) {
      const [, subject, , verb, agent] = passiveMatch;
      return `${agent} ${verb.replace('ed', '')} ${subject}`;
    }
    return null;
  }

  private analyzeCreativeContext(text: string): {
    needsSensoryDetail: boolean;
    hasDialogue: boolean;
    needsDialogueTag: boolean;
    scene: string;
    mood: string;
  } {
    const hasDialogue = /"[^"]*"/.test(text);
    const needsDialogueTag = hasDialogue && !/(said|whispered|shouted|replied|asked)/.test(text);
    const sensoryWords = (text.match(/\b(see|hear|feel|smell|taste|touch)\b/gi) || []).length;
    const needsSensoryDetail = sensoryWords < 2;
    
    return {
      needsSensoryDetail,
      hasDialogue,
      needsDialogueTag,
      scene: this.detectScene(text),
      mood: this.detectMood(text)
    };
  }

  private detectScene(text: string): string {
    if (/\b(forest|trees|woods)\b/i.test(text)) return 'forest';
    if (/\b(city|street|building)\b/i.test(text)) return 'urban';
    if (/\b(home|house|room)\b/i.test(text)) return 'indoor';
    return 'general';
  }

  private detectMood(text: string): string {
    if (/\b(dark|scary|fear|afraid)\b/i.test(text)) return 'tense';
    if (/\b(happy|joy|smile|laugh)\b/i.test(text)) return 'cheerful';
    if (/\b(sad|cry|tear|sorrow)\b/i.test(text)) return 'melancholy';
    return 'neutral';
  }

  private generateSensoryDetails(scene: string, mood: string): string[] {
    const details = {
      forest: {
        tense: ['the rustle of unseen creatures', 'shadows that seemed to move', 'the snap of a twig underfoot'],
        cheerful: ['dappled sunlight through leaves', 'the sweet scent of pine', 'birds singing overhead'],
        melancholy: ['the whisper of wind through bare branches', 'mist clinging to the ground', 'the distant call of a lone bird'],
        neutral: ['the scent of earth and moss', 'sunlight filtering through canopy', 'the soft crunch of leaves']
      },
      urban: {
        tense: ['the wail of distant sirens', 'flickering streetlights', 'the echo of footsteps'],
        cheerful: ['the aroma of fresh coffee', 'laughter from a nearby café', 'warm light spilling from windows'],
        melancholy: ['rain streaking down windows', 'the hum of traffic', 'neon signs reflecting in puddles'],
        neutral: ['the bustle of pedestrians', 'car horns in the distance', 'the smell of exhaust and food']
      },
      indoor: {
        tense: ['the creak of floorboards', 'shadows in the corners', 'the tick of a clock'],
        cheerful: ['the warmth of afternoon sun', 'the smell of baking bread', 'soft music playing'],
        melancholy: ['dust motes in weak sunlight', 'the silence of empty rooms', 'faded photographs'],
        neutral: ['the comfort of familiar furniture', 'soft lamplight', 'the hum of appliances']
      }
    };

    return details[scene as keyof typeof details]?.[mood as keyof typeof details.forest] || 
           details.indoor.neutral;
  }

  private generatePersonalizedDialogueTags(): string[] {
    const commonTags = Array.from(this.stylisticPatterns.dialogueTags.keys());
    if (commonTags.length > 0) {
      return commonTags.slice(0, 3);
    }
    
    return ['she said softly', 'he replied with a smile', 'they whispered urgently'];
  }

  private needsTransition(before: string, after: string): boolean {
    const lastSentence = this.getLastCompleteSentence(before);
    const firstAfterSentence = after.split(/[.!?]+/)[0];
    
    if (!lastSentence || !firstAfterSentence) return false;
    
    // Simple heuristic: if the topics seem unrelated, suggest a transition
    const beforeWords = new Set(lastSentence.toLowerCase().match(/\b\w+\b/g) || []);
    const afterWords = new Set(firstAfterSentence.toLowerCase().match(/\b\w+\b/g) || []);
    
    const intersection = new Set([...beforeWords].filter(x => afterWords.has(x)));
    return intersection.size < 2; // Few words in common
  }

  private getPersonalizedTransitions(): string[] {
    const personalTransitions = Array.from(this.stylisticPatterns.transitionPhrases.keys())
      .sort((a, b) => (this.stylisticPatterns.transitionPhrases.get(b) || 0) - 
                     (this.stylisticPatterns.transitionPhrases.get(a) || 0))
      .slice(0, 3);
    
    if (personalTransitions.length > 0) {
      return personalTransitions;
    }
    
    return ['Meanwhile', 'However', 'Then', 'Suddenly', 'Later'];
  }

  private findRepetitiveWords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .filter(([word, count]) => count > 3)
      .map(([word]) => word)
      .slice(0, 5);
  }

  private getPersonalSynonyms(word: string): string[] {
    // This would typically use a thesaurus API or local synonym database
    const synonyms = new Map([
      ['said', ['whispered', 'declared', 'mentioned', 'stated', 'replied']],
      ['walked', ['strolled', 'wandered', 'strode', 'ambled', 'paced']],
      ['looked', ['glanced', 'gazed', 'peered', 'stared', 'observed']],
      ['big', ['large', 'enormous', 'massive', 'huge', 'gigantic']],
      ['small', ['tiny', 'miniature', 'petite', 'little', 'compact']]
    ]);
    
    return synonyms.get(word.toLowerCase()) || [word];
  }

  private personalizeDescriptivePhrases(phrases: string[]): string[] {
    // Adapt phrases to match user's writing style
    return phrases.map(phrase => {
      if (this.personalProfile.writingStyle.formalityLevel > 0.7) {
        return phrase.replace(/\b(felt|seemed)\b/g, 'appeared to');
      }
      return phrase;
    });
  }

  private loadPersonalData(): void {
    // Load personal data from localStorage
    const savedProfile = localStorage.getItem('astral_writing_profile');
    if (savedProfile) {
      this.personalProfile = { ...this.personalProfile, ...JSON.parse(savedProfile) };
    }

    const savedVocabulary = localStorage.getItem('astral_personal_vocabulary');
    if (savedVocabulary) {
      const vocabData = JSON.parse(savedVocabulary);
      Object.entries(vocabData).forEach(([word, data]: [string, any]) => {
        this.personalVocabulary.set(word, {
          ...data,
          lastUsed: new Date(data.lastUsed)
        });
      });
    }
  }

  // Public getters and setters

  public getPersonalProfile(): PersonalWritingProfile {
    return { ...this.personalProfile };
  }

  public updatePreferences(preferences: Partial<PersonalWritingProfile['preferences']>): void {
    this.personalProfile.preferences = { ...this.personalProfile.preferences, ...preferences };
    this.emit('preferencesUpdated', this.personalProfile.preferences);
  }

  public getAcceptanceRate(): number {
    const total = this.acceptedSuggestions.length + this.rejectedSuggestions.length;
    return total > 0 ? this.acceptedSuggestions.length / total : 0;
  }
}

export default new IntelligentContentSuggestionsService();