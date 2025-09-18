import { EventEmitter } from 'events';

export interface CreativePrompt {
  id: string;
  type: 'character' | 'setting' | 'conflict' | 'dialogue' | 'scene' | 'theme' | 'plot_twist' | 'emotion';
  category: 'general' | 'genre_specific' | 'personal' | 'challenge' | 'experimental';
  title: string;
  prompt: string;
  details?: string;
  constraints?: string[];
  timeEstimate: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mood: 'light' | 'serious' | 'dark' | 'whimsical' | 'melancholic' | 'energetic';
  personalityAlignment: number;
  tags: string[];
  uses: number;
  rating: number;
  lastUsed?: Date;
  personalNotes?: string;
}

export interface CreativeExercise {
  id: string;
  name: string;
  description: string;
  type: 'warm_up' | 'skill_building' | 'breakthrough' | 'experimental' | 'fun';
  duration: number;
  steps: ExerciseStep[];
  benefits: string[];
  skillsTargeted: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  personalizedVariations: string[];
  completions: ExerciseCompletion[];
  effectiveness: number;
}

export interface ExerciseStep {
  step: number;
  instruction: string;
  timeAllocation: number;
  notes?: string;
}

export interface ExerciseCompletion {
  id: string;
  exerciseId: string;
  completedAt: Date;
  duration: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  insights: string[];
  breakthroughs: string[];
  challenges: string[];
  mood: 'frustrated' | 'neutral' | 'satisfied' | 'inspired' | 'energized';
  willRepeat: boolean;
}

export interface InspirationSource {
  id: string;
  type: 'quote' | 'image' | 'music' | 'video' | 'book' | 'article' | 'experience' | 'conversation';
  title: string;
  content: string;
  source: string;
  tags: string[];
  mood: string[];
  personalRelevance: number;
  inspirationTriggers: string[];
  relatedProjects: string[];
  dateAdded: Date;
  lastViewed?: Date;
  useCount: number;
  personalNotes?: string;
}

export interface CreativeBlock {
  id: string;
  type: 'perfectionism' | 'fear' | 'overwhelm' | 'comparison' | 'fatigue' | 'routine' | 'doubt' | 'pressure';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  triggers: string[];
  symptoms: string[];
  duration: string;
  strategies: BlockBusterStrategy[];
  personalPatterns: string[];
  lastOccurrence: Date;
  resolutionTime?: number;
}

export interface BlockBusterStrategy {
  id: string;
  name: string;
  description: string;
  type: 'mindset' | 'technique' | 'environment' | 'exercise' | 'break';
  effectiveness: number;
  timeRequired: number;
  steps: string[];
  personalAdaptations: string[];
  successRate: number;
}

export interface CreativeSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  type: 'free_writing' | 'prompt_response' | 'exercise' | 'project_work' | 'experimentation';
  prompts: string[];
  exercises: string[];
  inspiration: string[];
  output: {
    wordCount: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    breakthroughs: string[];
    insights: string[];
  };
  mood: {
    start: string;
    end: string;
    energy: number;
    satisfaction: number;
  };
  environment: string;
  blocksEncountered: string[];
  strategiesUsed: string[];
}

export interface PersonalCreativityProfile {
  preferences: {
    favoritePromptTypes: string[];
    preferredDifficulty: string;
    optimalSessionLength: number;
    bestTimeOfDay: string;
    favoriteEnvironments: string[];
  };
  patterns: {
    creativeStreaks: number[];
    productiveDays: string[];
    inspirationSources: Record<string, number>;
    blockTriggers: Record<string, number>;
  };
  growth: {
    skillProgression: Record<string, number>;
    breakthroughMoments: string[];
    personalBests: Record<string, any>;
    learningGoals: string[];
  };
  insights: PersonalCreativeInsight[];
}

export interface PersonalCreativeInsight {
  id: string;
  category: 'pattern' | 'strength' | 'opportunity' | 'warning' | 'breakthrough';
  insight: string;
  evidence: string[];
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  recommendations: string[];
  dateDiscovered: Date;
}

export interface CreativityBoost {
  id: string;
  name: string;
  description: string;
  type: 'quick_fix' | 'deep_dive' | 'inspiration' | 'technique' | 'mindset';
  duration: number;
  components: BoostComponent[];
  personalizedElements: string[];
  effectiveness: number;
  prerequisites?: string[];
  followUp?: string[];
}

export interface BoostComponent {
  type: 'prompt' | 'exercise' | 'inspiration' | 'technique' | 'reflection';
  content: string;
  duration: number;
  optional: boolean;
}

class CreativityBoosterService extends EventEmitter {
  private prompts: Map<string, CreativePrompt> = new Map();
  private exercises: Map<string, CreativeExercise> = new Map();
  private inspirationSources: Map<string, InspirationSource> = new Map();
  private creativeBlocks: Map<string, CreativeBlock> = new Map();
  private sessions: Map<string, CreativeSession> = new Map();
  private blockBusterStrategies: Map<string, BlockBusterStrategy> = new Map();
  private creativityProfile: PersonalCreativityProfile | null = null;
  private currentSession: CreativeSession | null = null;

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeDefaultContent();
    this.initializePersonalityProfile();
  }

  async startCreativeSession(type: CreativeSession['type']): Promise<CreativeSession> {
    if (this.currentSession && !this.currentSession.endTime) {
      await this.endCreativeSession();
    }

    const session: CreativeSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      type,
      prompts: [],
      exercises: [],
      inspiration: [],
      output: {
        wordCount: 0,
        quality: 'fair',
        breakthroughs: [],
        insights: []
      },
      mood: {
        start: 'neutral',
        end: 'neutral',
        energy: 5,
        satisfaction: 5
      },
      environment: 'default',
      blocksEncountered: [],
      strategiesUsed: []
    };

    this.currentSession = session;
    this.sessions.set(session.id, session);
    
    this.emit('sessionStarted', session);
    await this.saveSessionsToStorage();
    
    return session;
  }

  async endCreativeSession(output?: Partial<CreativeSession['output']>, mood?: Partial<CreativeSession['mood']>): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    
    if (output) {
      this.currentSession.output = { ...this.currentSession.output, ...output };
    }
    
    if (mood) {
      this.currentSession.mood = { ...this.currentSession.mood, ...mood };
    }

    await this.analyzeSessionInsights(this.currentSession);
    await this.updateCreativityProfile(this.currentSession);
    
    this.emit('sessionEnded', this.currentSession);
    await this.saveSessionsToStorage();
    
    this.currentSession = null;
  }

  async getPersonalizedPrompts(count: number = 5, filters?: {
    type?: CreativePrompt['type'];
    mood?: CreativePrompt['mood'];
    difficulty?: CreativePrompt['difficultyLevel'];
  }): Promise<CreativePrompt[]> {
    let availablePrompts = Array.from(this.prompts.values());
    
    // Apply filters
    if (filters?.type) {
      availablePrompts = availablePrompts.filter(p => p.type === filters.type);
    }
    if (filters?.mood) {
      availablePrompts = availablePrompts.filter(p => p.mood === filters.mood);
    }
    if (filters?.difficulty) {
      availablePrompts = availablePrompts.filter(p => p.difficultyLevel === filters.difficulty);
    }

    // Personalize based on profile
    if (this.creativityProfile) {
      availablePrompts = this.personalizePrompts(availablePrompts);
    }

    // Sort by relevance and freshness
    availablePrompts.sort((a, b) => {
      const aScore = this.calculatePromptScore(a);
      const bScore = this.calculatePromptScore(b);
      return bScore - aScore;
    });

    return availablePrompts.slice(0, count);
  }

  private personalizePrompts(prompts: CreativePrompt[]): CreativePrompt[] {
    if (!this.creativityProfile) return prompts;

    const preferences = this.creativityProfile.preferences;
    
    return prompts.map(prompt => {
      // Adjust personality alignment based on preferences
      let alignment = prompt.personalityAlignment;
      
      if (preferences.favoritePromptTypes.includes(prompt.type)) {
        alignment += 0.2;
      }
      
      if (preferences.preferredDifficulty === prompt.difficultyLevel) {
        alignment += 0.15;
      }

      // Penalize overused prompts
      if (prompt.uses > 3) {
        alignment -= 0.1 * (prompt.uses - 3);
      }

      return { ...prompt, personalityAlignment: Math.max(0, Math.min(1, alignment)) };
    });
  }

  private calculatePromptScore(prompt: CreativePrompt): number {
    let score = prompt.personalityAlignment * 0.4;
    score += prompt.rating * 0.3;
    
    // Freshness factor
    const daysSinceLastUse = prompt.lastUsed ? 
      (Date.now() - prompt.lastUsed.getTime()) / (1000 * 60 * 60 * 24) : 30;
    score += Math.min(daysSinceLastUse / 30, 1) * 0.2;
    
    // Usage balance
    score += Math.max(0, 1 - prompt.uses / 10) * 0.1;
    
    return score;
  }

  async createCustomPrompt(promptData: Omit<CreativePrompt, 'id' | 'uses' | 'rating' | 'personalityAlignment'>): Promise<CreativePrompt> {
    const prompt: CreativePrompt = {
      ...promptData,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      uses: 0,
      rating: 0,
      personalityAlignment: 0.5
    };

    this.prompts.set(prompt.id, prompt);
    await this.savePromptsToStorage();
    
    this.emit('promptCreated', prompt);
    return prompt;
  }

  async usePrompt(promptId: string): Promise<CreativePrompt> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error('Prompt not found');

    prompt.uses++;
    prompt.lastUsed = new Date();
    
    if (this.currentSession) {
      this.currentSession.prompts.push(promptId);
    }

    await this.savePromptsToStorage();
    this.emit('promptUsed', prompt);
    
    return prompt;
  }

  async ratePrompt(promptId: string, rating: number, notes?: string): Promise<void> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error('Prompt not found');

    prompt.rating = (prompt.rating * (prompt.uses - 1) + rating) / prompt.uses;
    
    if (notes) {
      prompt.personalNotes = notes;
    }

    await this.savePromptsToStorage();
    this.emit('promptRated', { prompt, rating, notes });
  }

  async getPersonalizedExercises(count: number = 3, targetSkills?: string[]): Promise<CreativeExercise[]> {
    let exercises = Array.from(this.exercises.values());
    
    if (targetSkills?.length) {
      exercises = exercises.filter(exercise => 
        exercise.skillsTargeted.some(skill => targetSkills.includes(skill))
      );
    }

    // Personalize based on profile and past effectiveness
    exercises = exercises.map(exercise => ({
      ...exercise,
      personalizedVariations: this.generatePersonalizedVariations(exercise)
    }));

    // Sort by effectiveness and relevance
    exercises.sort((a, b) => {
      const aScore = a.effectiveness * 0.6 + (1 - a.completions.length / 10) * 0.4;
      const bScore = b.effectiveness * 0.6 + (1 - b.completions.length / 10) * 0.4;
      return bScore - aScore;
    });

    return exercises.slice(0, count);
  }

  private generatePersonalizedVariations(exercise: CreativeExercise): string[] {
    const variations: string[] = [];
    
    if (!this.creativityProfile) return variations;

    const preferences = this.creativityProfile.preferences;
    
    // Time-based variations
    if (preferences.optimalSessionLength < exercise.duration) {
      variations.push(`Quick version: Reduce each step by 25% for a ${Math.round(exercise.duration * 0.75)}-minute session`);
    }
    
    // Difficulty-based variations
    if (preferences.preferredDifficulty === 'easy' && exercise.difficulty === 'medium') {
      variations.push('Simplified approach: Focus on one core element instead of multiple aspects');
    }
    
    // Environment-based variations
    if (preferences.favoriteEnvironments.includes('outdoor')) {
      variations.push('Outdoor adaptation: Take this exercise to a park or outdoor space for fresh perspective');
    }

    return variations;
  }

  async completeExercise(exerciseId: string, completion: Omit<ExerciseCompletion, 'id' | 'exerciseId' | 'completedAt'>): Promise<void> {
    const exercise = this.exercises.get(exerciseId);
    if (!exercise) throw new Error('Exercise not found');

    const exerciseCompletion: ExerciseCompletion = {
      ...completion,
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId,
      completedAt: new Date()
    };

    exercise.completions.push(exerciseCompletion);
    
    // Update exercise effectiveness
    exercise.effectiveness = this.calculateExerciseEffectiveness(exercise);
    
    if (this.currentSession) {
      this.currentSession.exercises.push(exerciseId);
      if (completion.breakthroughs.length > 0) {
        this.currentSession.output.breakthroughs.push(...completion.breakthroughs);
      }
      if (completion.insights.length > 0) {
        this.currentSession.output.insights.push(...completion.insights);
      }
    }

    await this.saveExercisesToStorage();
    this.emit('exerciseCompleted', { exercise, completion: exerciseCompletion });
  }

  private calculateExerciseEffectiveness(exercise: CreativeExercise): number {
    if (exercise.completions.length === 0) return 0;

    const qualityScores = exercise.completions.map(c => {
      const qualityMap = { poor: 1, fair: 2, good: 3, excellent: 4 };
      return qualityMap[c.quality];
    });

    const averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const willRepeatRate = exercise.completions.filter(c => c.willRepeat).length / exercise.completions.length;
    
    return (averageQuality / 4) * 0.6 + willRepeatRate * 0.4;
  }

  async addInspirationSource(source: Omit<InspirationSource, 'id' | 'dateAdded' | 'useCount'>): Promise<InspirationSource> {
    const inspiration: InspirationSource = {
      ...source,
      id: `inspiration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dateAdded: new Date(),
      useCount: 0
    };

    this.inspirationSources.set(inspiration.id, inspiration);
    await this.saveInspirationToStorage();
    
    this.emit('inspirationAdded', inspiration);
    return inspiration;
  }

  async getPersonalizedInspiration(count: number = 3, mood?: string, tags?: string[]): Promise<InspirationSource[]> {
    let sources = Array.from(this.inspirationSources.values());
    
    // Filter by mood
    if (mood) {
      sources = sources.filter(source => source.mood.includes(mood));
    }
    
    // Filter by tags
    if (tags?.length) {
      sources = sources.filter(source => 
        tags.some(tag => source.tags.includes(tag))
      );
    }

    // Sort by relevance and freshness
    sources.sort((a, b) => {
      const aScore = a.personalRelevance * 0.4 + (1 - a.useCount / 10) * 0.3;
      const bScore = b.personalRelevance * 0.4 + (1 - b.useCount / 10) * 0.3;
      
      // Add recency factor
      const daysSinceA = a.lastViewed ? (Date.now() - a.lastViewed.getTime()) / (1000 * 60 * 60 * 24) : 30;
      const daysSinceB = b.lastViewed ? (Date.now() - b.lastViewed.getTime()) / (1000 * 60 * 60 * 24) : 30;
      
      return (bScore + Math.min(daysSinceB / 30, 1) * 0.3) - (aScore + Math.min(daysSinceA / 30, 1) * 0.3);
    });

    return sources.slice(0, count);
  }

  async useInspiration(inspirationId: string): Promise<InspirationSource> {
    const inspiration = this.inspirationSources.get(inspirationId);
    if (!inspiration) throw new Error('Inspiration source not found');

    inspiration.useCount++;
    inspiration.lastViewed = new Date();
    
    if (this.currentSession) {
      this.currentSession.inspiration.push(inspirationId);
    }

    await this.saveInspirationToStorage();
    this.emit('inspirationUsed', inspiration);
    
    return inspiration;
  }

  async detectCreativeBlock(symptoms: string[], triggers: string[]): Promise<CreativeBlock | null> {
    // Analyze symptoms and triggers to identify block type
    const blockType = this.identifyBlockType(symptoms, triggers);
    if (!blockType) return null;

    const block: CreativeBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockType,
      description: this.generateBlockDescription(blockType, symptoms),
      severity: this.assessBlockSeverity(symptoms),
      triggers,
      symptoms,
      duration: 'unknown',
      strategies: await this.getRecommendedStrategies(blockType),
      personalPatterns: this.analyzePersonalBlockPatterns(blockType),
      lastOccurrence: new Date()
    };

    this.creativeBlocks.set(block.id, block);
    
    if (this.currentSession) {
      this.currentSession.blocksEncountered.push(block.id);
    }

    await this.saveBlocksToStorage();
    this.emit('blockDetected', block);
    
    return block;
  }

  private identifyBlockType(symptoms: string[], triggers: string[]): CreativeBlock['type'] | null {
    const blockPatterns = {
      perfectionism: ['afraid of mistakes', 'endless editing', 'never satisfied', 'comparing to others'],
      fear: ['afraid of failure', 'worried about judgment', 'imposter syndrome', 'anxiety'],
      overwhelm: ['too many ideas', 'dont know where to start', 'feeling scattered', 'analysis paralysis'],
      comparison: ['others are better', 'not original enough', 'social media envy', 'feeling inadequate'],
      fatigue: ['mentally exhausted', 'no energy', 'burned out', 'uninspired'],
      routine: ['bored', 'stale', 'predictable', 'stuck in pattern'],
      doubt: ['questioning ability', 'lack confidence', 'self-criticism', 'negative self-talk'],
      pressure: ['deadline stress', 'external expectations', 'performance anxiety', 'time pressure']
    };

    let maxScore = 0;
    let identifiedType: CreativeBlock['type'] | null = null;

    Object.entries(blockPatterns).forEach(([type, patterns]) => {
      const score = patterns.reduce((count, pattern) => {
        const matchInSymptoms = symptoms.some(symptom => 
          symptom.toLowerCase().includes(pattern.toLowerCase())
        );
        const matchInTriggers = triggers.some(trigger => 
          trigger.toLowerCase().includes(pattern.toLowerCase())
        );
        return count + (matchInSymptoms ? 1 : 0) + (matchInTriggers ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        identifiedType = type as CreativeBlock['type'];
      }
    });

    return maxScore > 0 ? identifiedType : null;
  }

  private generateBlockDescription(type: CreativeBlock['type'], symptoms: string[]): string {
    const descriptions = {
      perfectionism: 'Struggling with perfectionist tendencies that prevent progress',
      fear: 'Experiencing creative fear and anxiety about output quality or reception',
      overwhelm: 'Feeling overwhelmed by options and unable to focus on one direction',
      comparison: 'Caught in comparison trap, feeling inadequate compared to others',
      fatigue: 'Experiencing creative fatigue and mental exhaustion',
      routine: 'Stuck in creative routine, feeling bored and uninspired',
      doubt: 'Experiencing self-doubt and questioning creative abilities',
      pressure: 'Feeling pressured by deadlines or external expectations'
    };

    return descriptions[type] + `. Symptoms: ${symptoms.slice(0, 3).join(', ')}`;
  }

  private assessBlockSeverity(symptoms: string[]): 'mild' | 'moderate' | 'severe' {
    if (symptoms.length >= 5) return 'severe';
    if (symptoms.length >= 3) return 'moderate';
    return 'mild';
  }

  private async getRecommendedStrategies(blockType: CreativeBlock['type']): Promise<BlockBusterStrategy[]> {
    const allStrategies = Array.from(this.blockBusterStrategies.values());
    
    // Filter strategies effective for this block type
    const effectiveStrategies = allStrategies.filter(strategy => {
      // This would normally be based on data about strategy effectiveness for each block type
      // For now, we'll use a simple matching system
      return strategy.effectiveness > 0.6;
    });

    // Sort by personal success rate and effectiveness
    effectiveStrategies.sort((a, b) => (b.successRate * b.effectiveness) - (a.successRate * a.effectiveness));
    
    return effectiveStrategies.slice(0, 5);
  }

  private analyzePersonalBlockPatterns(blockType: CreativeBlock['type']): string[] {
    const patterns: string[] = [];
    
    const pastBlocks = Array.from(this.creativeBlocks.values())
      .filter(block => block.type === blockType);

    if (pastBlocks.length > 0) {
      patterns.push(`This is your ${pastBlocks.length + 1}${this.getOrdinalSuffix(pastBlocks.length + 1)} time experiencing ${blockType}`);
      
      const averageResolution = pastBlocks
        .filter(block => block.resolutionTime)
        .reduce((sum, block) => sum + (block.resolutionTime || 0), 0) / pastBlocks.length;
      
      if (averageResolution > 0) {
        patterns.push(`You typically resolve ${blockType} blocks in ${Math.round(averageResolution)} hours`);
      }
    }

    return patterns;
  }

  private getOrdinalSuffix(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  }

  async resolveCreativeBlock(blockId: string, strategyId: string, resolutionTime: number): Promise<void> {
    const block = this.creativeBlocks.get(blockId);
    const strategy = this.blockBusterStrategies.get(strategyId);
    
    if (!block || !strategy) throw new Error('Block or strategy not found');

    block.resolutionTime = resolutionTime;
    
    // Update strategy success rate
    strategy.successRate = (strategy.successRate * 10 + 1) / 11; // Rolling average

    if (this.currentSession) {
      this.currentSession.strategiesUsed.push(strategyId);
    }

    await this.saveBlocksToStorage();
    await this.saveStrategiesToStorage();
    
    this.emit('blockResolved', { block, strategy, resolutionTime });
  }

  async generateCreativityBoost(type: CreativityBoost['type'], duration: number): Promise<CreativityBoost> {
    const boost: CreativityBoost = {
      id: `boost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Boost`,
      description: this.generateBoostDescription(type),
      type,
      duration,
      components: await this.generateBoostComponents(type, duration),
      personalizedElements: this.generatePersonalizedElements(type),
      effectiveness: 0.8, // Will be updated based on user feedback
      prerequisites: this.getBoostPrerequisites(type),
      followUp: this.getBoostFollowUp(type)
    };

    this.emit('boostGenerated', boost);
    return boost;
  }

  private generateBoostDescription(type: CreativityBoost['type']): string {
    const descriptions = {
      quick_fix: 'A rapid creativity boost designed to overcome immediate blocks and spark new ideas',
      deep_dive: 'An intensive creative exploration session for breakthrough thinking and significant progress',
      inspiration: 'A curated collection of inspirational content to reignite your creative passion',
      technique: 'Focused practice on specific creative techniques to expand your skillset',
      mindset: 'Mental framework adjustments to optimize your creative mindset and overcome limitations'
    };

    return descriptions[type];
  }

  private async generateBoostComponents(type: CreativityBoost['type'], duration: number): Promise<BoostComponent[]> {
    const components: BoostComponent[] = [];
    
    switch (type) {
      case 'quick_fix':
        components.push(
          { type: 'exercise', content: 'Five-minute free writing burst', duration: 5, optional: false },
          { type: 'prompt', content: 'Random word association prompt', duration: 10, optional: false },
          { type: 'technique', content: 'Mind mapping exercise', duration: duration - 15, optional: false }
        );
        break;
        
      case 'deep_dive':
        components.push(
          { type: 'reflection', content: 'Current project deep analysis', duration: 15, optional: false },
          { type: 'inspiration', content: 'Curated inspiration review', duration: 10, optional: false },
          { type: 'exercise', content: 'Extended creative exercise', duration: duration - 30, optional: false },
          { type: 'reflection', content: 'Insights and next steps planning', duration: 5, optional: false }
        );
        break;
        
      case 'inspiration':
        components.push(
          { type: 'inspiration', content: 'Personal inspiration gallery', duration: duration * 0.6, optional: false },
          { type: 'reflection', content: 'Inspiration-to-action planning', duration: duration * 0.4, optional: false }
        );
        break;
        
      case 'technique':
        components.push(
          { type: 'technique', content: 'Technique explanation and demo', duration: duration * 0.3, optional: false },
          { type: 'exercise', content: 'Guided technique practice', duration: duration * 0.7, optional: false }
        );
        break;
        
      case 'mindset':
        components.push(
          { type: 'reflection', content: 'Current mindset assessment', duration: duration * 0.25, optional: false },
          { type: 'technique', content: 'Mindset shifting exercises', duration: duration * 0.5, optional: false },
          { type: 'reflection', content: 'New mindset integration', duration: duration * 0.25, optional: false }
        );
        break;
    }

    return components;
  }

  private generatePersonalizedElements(type: CreativityBoost['type']): string[] {
    if (!this.creativityProfile) return [];

    const elements: string[] = [];
    const preferences = this.creativityProfile.preferences;

    elements.push(`Optimized for your ${preferences.bestTimeOfDay} energy levels`);
    elements.push(`Incorporates your favorite ${preferences.favoritePromptTypes.join(' and ')} elements`);
    
    if (preferences.favoriteEnvironments.length > 0) {
      elements.push(`Designed for ${preferences.favoriteEnvironments[0]} environment`);
    }

    return elements;
  }

  private getBoostPrerequisites(type: CreativityBoost['type']): string[] {
    const prerequisites = {
      quick_fix: ['5 minutes of uninterrupted time'],
      deep_dive: ['At least 1 hour of focused time', 'Comfortable writing environment'],
      inspiration: ['Open mindset', 'Notebook or digital capture tool'],
      technique: ['Willingness to experiment', 'Practice materials ready'],
      mindset: ['Quiet reflection space', 'Honest self-assessment mindset']
    };

    return prerequisites[type] || [];
  }

  private getBoostFollowUp(type: CreativityBoost['type']): string[] {
    const followUps = {
      quick_fix: ['Continue writing for 15 more minutes', 'Note any ideas for later development'],
      deep_dive: ['Schedule follow-up session within 24 hours', 'Implement at least one insight immediately'],
      inspiration: ['Add new inspiration sources to your collection', 'Plan a project around your inspiration'],
      technique: ['Practice technique daily for a week', 'Teach technique to someone else'],
      mindset: ['Journal about mindset shifts', 'Set mindset check-ins for next week']
    };

    return followUps[type] || [];
  }

  private async analyzeSessionInsights(session: CreativeSession): Promise<void> {
    // Analyze patterns and generate insights
    const insights: string[] = [];
    
    if (session.output.breakthroughs.length > 0) {
      insights.push(`Generated ${session.output.breakthroughs.length} breakthrough moments in this session`);
    }
    
    if (session.blocksEncountered.length === 0) {
      insights.push('Completed session without encountering creative blocks');
    }
    
    const duration = session.endTime && session.startTime ? 
      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60) : 0;
    
    if (duration > 0) {
      const wordsPerMinute = session.output.wordCount / duration;
      if (wordsPerMinute > 20) {
        insights.push(`High productivity: ${Math.round(wordsPerMinute)} words per minute`);
      }
    }

    session.output.insights.push(...insights);
  }

  private async updateCreativityProfile(session: CreativeSession): Promise<void> {
    if (!this.creativityProfile) return;

    // Update patterns based on session
    const sessionDate = session.startTime.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = this.getTimeOfDay(session.startTime);
    
    // Update productive days
    if (session.output.quality === 'good' || session.output.quality === 'excellent') {
      if (!this.creativityProfile.patterns.productiveDays.includes(sessionDate)) {
        this.creativityProfile.patterns.productiveDays.push(sessionDate);
      }
    }

    // Update best time of day
    if (session.output.quality === 'excellent') {
      this.creativityProfile.preferences.bestTimeOfDay = timeOfDay;
    }

    // Update inspiration sources effectiveness
    session.inspiration.forEach(inspirationId => {
      this.creativityProfile!.patterns.inspirationSources[inspirationId] = 
        (this.creativityProfile!.patterns.inspirationSources[inspirationId] || 0) + 1;
    });

    await this.saveProfileToStorage();
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  private initializeDefaultContent(): void {
    // Initialize with some default prompts, exercises, and strategies
    this.createDefaultPrompts();
    this.createDefaultExercises();
    this.createDefaultStrategies();
  }

  private createDefaultPrompts(): void {
    const defaultPrompts: Omit<CreativePrompt, 'id' | 'uses' | 'rating' | 'personalityAlignment'>[] = [
      {
        type: 'character',
        category: 'general',
        title: 'The Stranger\'s Secret',
        prompt: 'Write about a character who discovers something unexpected about a stranger they\'ve been observing.',
        timeEstimate: 20,
        difficultyLevel: 'intermediate',
        mood: 'serious',
        tags: ['mystery', 'character development', 'observation'],
        personalNotes: undefined
      },
      {
        type: 'setting',
        category: 'general',
        title: 'The Abandoned Place',
        prompt: 'Describe a place that was once full of life but is now abandoned. What happened here?',
        timeEstimate: 15,
        difficultyLevel: 'beginner',
        mood: 'melancholic',
        tags: ['atmosphere', 'description', 'backstory'],
        personalNotes: undefined
      }
    ];

    defaultPrompts.forEach(async (promptData) => {
      await this.createCustomPrompt(promptData);
    });
  }

  private createDefaultExercises(): void {
    const warmUpExercise: Omit<CreativeExercise, 'id' | 'completions' | 'effectiveness' | 'personalizedVariations'> = {
      name: 'Five Senses Writing',
      description: 'Engage all five senses to create vivid, immersive descriptions',
      type: 'warm_up',
      duration: 15,
      steps: [
        { step: 1, instruction: 'Choose a simple scene or location', timeAllocation: 2 },
        { step: 2, instruction: 'Write what you see in detail', timeAllocation: 3 },
        { step: 3, instruction: 'Add sounds, smells, textures, and tastes', timeAllocation: 8 },
        { step: 4, instruction: 'Revise to integrate senses naturally', timeAllocation: 2 }
      ],
      benefits: ['Enhanced descriptive writing', 'Improved immersion', 'Sensory awareness'],
      skillsTargeted: ['description', 'atmosphere', 'immersion'],
      difficulty: 'easy'
    };

    const exerciseWithId: CreativeExercise = {
      ...warmUpExercise,
      id: `exercise_${Date.now()}_default`,
      completions: [],
      effectiveness: 0.8,
      personalizedVariations: []
    };

    this.exercises.set(exerciseWithId.id, exerciseWithId);
  }

  private createDefaultStrategies(): void {
    const changeEnvironmentStrategy: BlockBusterStrategy = {
      id: `strategy_${Date.now()}_change_env`,
      name: 'Change Your Environment',
      description: 'Move to a different physical location to stimulate new thinking patterns',
      type: 'environment',
      effectiveness: 0.75,
      timeRequired: 5,
      steps: [
        'Identify your current environment',
        'Choose a contrasting location (indoor/outdoor, quiet/busy, familiar/new)',
        'Gather your writing materials',
        'Spend 5 minutes acclimating to the new space',
        'Begin writing with fresh perspective'
      ],
      personalAdaptations: [],
      successRate: 0.7
    };

    this.blockBusterStrategies.set(changeEnvironmentStrategy.id, changeEnvironmentStrategy);
  }

  private initializePersonalityProfile(): void {
    this.creativityProfile = {
      preferences: {
        favoritePromptTypes: ['character', 'setting'],
        preferredDifficulty: 'intermediate',
        optimalSessionLength: 30,
        bestTimeOfDay: 'morning',
        favoriteEnvironments: ['quiet room']
      },
      patterns: {
        creativeStreaks: [],
        productiveDays: [],
        inspirationSources: {},
        blockTriggers: {}
      },
      growth: {
        skillProgression: {},
        breakthroughMoments: [],
        personalBests: {},
        learningGoals: []
      },
      insights: []
    };
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    await Promise.all([
      this.loadPromptsFromStorage(),
      this.loadExercisesFromStorage(),
      this.loadInspirationFromStorage(),
      this.loadBlocksFromStorage(),
      this.loadSessionsFromStorage(),
      this.loadStrategiesFromStorage(),
      this.loadProfileFromStorage()
    ]);
  }

  private async loadPromptsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('creativity_prompts');
      if (stored) {
        const promptsArray = JSON.parse(stored);
        promptsArray.forEach((prompt: any) => {
          if (prompt.lastUsed) prompt.lastUsed = new Date(prompt.lastUsed);
          this.prompts.set(prompt.id, prompt);
        });
      }
    } catch (error) {
      console.error('Error loading prompts from storage:', error);
    }
  }

  private async savePromptsToStorage(): Promise<void> {
    try {
      const promptsArray = Array.from(this.prompts.values());
      localStorage.setItem('creativity_prompts', JSON.stringify(promptsArray));
    } catch (error) {
      console.error('Error saving prompts to storage:', error);
    }
  }

  private async loadExercisesFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('creativity_exercises');
      if (stored) {
        const exercisesArray = JSON.parse(stored);
        exercisesArray.forEach((exercise: any) => {
          exercise.completions.forEach((completion: any) => {
            completion.completedAt = new Date(completion.completedAt);
          });
          this.exercises.set(exercise.id, exercise);
        });
      }
    } catch (error) {
      console.error('Error loading exercises from storage:', error);
    }
  }

  private async saveExercisesToStorage(): Promise<void> {
    try {
      const exercisesArray = Array.from(this.exercises.values());
      localStorage.setItem('creativity_exercises', JSON.stringify(exercisesArray));
    } catch (error) {
      console.error('Error saving exercises to storage:', error);
    }
  }

  private async loadInspirationFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('inspiration_sources');
      if (stored) {
        const inspirationArray = JSON.parse(stored);
        inspirationArray.forEach((inspiration: any) => {
          inspiration.dateAdded = new Date(inspiration.dateAdded);
          if (inspiration.lastViewed) inspiration.lastViewed = new Date(inspiration.lastViewed);
          this.inspirationSources.set(inspiration.id, inspiration);
        });
      }
    } catch (error) {
      console.error('Error loading inspiration from storage:', error);
    }
  }

  private async saveInspirationToStorage(): Promise<void> {
    try {
      const inspirationArray = Array.from(this.inspirationSources.values());
      localStorage.setItem('inspiration_sources', JSON.stringify(inspirationArray));
    } catch (error) {
      console.error('Error saving inspiration to storage:', error);
    }
  }

  private async loadBlocksFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('creative_blocks');
      if (stored) {
        const blocksArray = JSON.parse(stored);
        blocksArray.forEach((block: any) => {
          block.lastOccurrence = new Date(block.lastOccurrence);
          this.creativeBlocks.set(block.id, block);
        });
      }
    } catch (error) {
      console.error('Error loading blocks from storage:', error);
    }
  }

  private async saveBlocksToStorage(): Promise<void> {
    try {
      const blocksArray = Array.from(this.creativeBlocks.values());
      localStorage.setItem('creative_blocks', JSON.stringify(blocksArray));
    } catch (error) {
      console.error('Error saving blocks to storage:', error);
    }
  }

  private async loadSessionsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('creative_sessions');
      if (stored) {
        const sessionsArray = JSON.parse(stored);
        sessionsArray.forEach((session: any) => {
          session.startTime = new Date(session.startTime);
          if (session.endTime) session.endTime = new Date(session.endTime);
          this.sessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }
  }

  private async saveSessionsToStorage(): Promise<void> {
    try {
      const sessionsArray = Array.from(this.sessions.values());
      localStorage.setItem('creative_sessions', JSON.stringify(sessionsArray));
    } catch (error) {
      console.error('Error saving sessions to storage:', error);
    }
  }

  private async loadStrategiesFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('blockbuster_strategies');
      if (stored) {
        const strategiesArray = JSON.parse(stored);
        strategiesArray.forEach((strategy: any) => {
          this.blockBusterStrategies.set(strategy.id, strategy);
        });
      }
    } catch (error) {
      console.error('Error loading strategies from storage:', error);
    }
  }

  private async saveStrategiesToStorage(): Promise<void> {
    try {
      const strategiesArray = Array.from(this.blockBusterStrategies.values());
      localStorage.setItem('blockbuster_strategies', JSON.stringify(strategiesArray));
    } catch (error) {
      console.error('Error saving strategies to storage:', error);
    }
  }

  private async loadProfileFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('creativity_profile');
      if (stored) {
        this.creativityProfile = JSON.parse(stored);
        if (this.creativityProfile?.insights) {
          this.creativityProfile.insights.forEach((insight: any) => {
            insight.dateDiscovered = new Date(insight.dateDiscovered);
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile from storage:', error);
    }
  }

  private async saveProfileToStorage(): Promise<void> {
    try {
      localStorage.setItem('creativity_profile', JSON.stringify(this.creativityProfile));
    } catch (error) {
      console.error('Error saving profile to storage:', error);
    }
  }

  // Public getter methods
  getPrompts(): CreativePrompt[] {
    return Array.from(this.prompts.values());
  }

  getExercises(): CreativeExercise[] {
    return Array.from(this.exercises.values());
  }

  getInspirationSources(): InspirationSource[] {
    return Array.from(this.inspirationSources.values());
  }

  getCreativeBlocks(): CreativeBlock[] {
    return Array.from(this.creativeBlocks.values());
  }

  getSessions(): CreativeSession[] {
    return Array.from(this.sessions.values());
  }

  getBlockBusterStrategies(): BlockBusterStrategy[] {
    return Array.from(this.blockBusterStrategies.values());
  }

  getCreativityProfile(): PersonalCreativityProfile | null {
    return this.creativityProfile;
  }

  getCurrentSession(): CreativeSession | null {
    return this.currentSession;
  }
}

export const creativityBoosterService = new CreativityBoosterService();
export default creativityBoosterService;