/**
 * Character Arc Service
 * Track character development and growth throughout the story
 */

import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  appearance: string;
  personality: string[];
  background: string;
  motivation: string;
  goals: string[];
  fears: string[];
  flaws: string[];
  strengths: string[];
  relationships: CharacterRelationship[];
  arc: CharacterArc;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterArc {
  id: string;
  characterId: string;
  type: 'positive' | 'negative' | 'flat' | 'corruption' | 'redemption' | 'growth' | 'fall';
  startingPoint: ArcPoint;
  endingPoint: ArcPoint;
  milestones: ArcMilestone[];
  theme: string;
  internalConflict: string;
  externalConflict: string;
  changeReason: string;
  completionPercentage: number;
  notes: string;
}

export interface ArcPoint {
  id: string;
  name: string;
  description: string;
  emotionalState: string;
  beliefs: string[];
  skills: string[];
  relationships: string[];
  chapterLocation?: string;
  sceneLocation?: string;
}

export interface ArcMilestone {
  id: string;
  name: string;
  description: string;
  chapterId?: string;
  sceneId?: string;
  type: 'realization' | 'decision' | 'action' | 'consequence' | 'growth' | 'setback';
  emotionalImpact: 'low' | 'medium' | 'high';
  significance: 'minor' | 'major' | 'climactic';
  changeInCharacter: string;
  triggerEvent: string;
  completed: boolean;
  order: number;
  dateCompleted?: Date;
  notes: string;
}

export interface CharacterRelationship {
  id: string;
  characterId: string;
  relatedCharacterId: string;
  relatedCharacterName: string;
  type: 'family' | 'friend' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'ally' | 'neutral';
  description: string;
  strength: number; // 1-10
  dynamic: 'static' | 'improving' | 'deteriorating' | 'complex';
  history: string;
  currentState: string;
  futureGoal: string;
  keyEvents: RelationshipEvent[];
}

export interface RelationshipEvent {
  id: string;
  name: string;
  description: string;
  chapterId?: string;
  impact: 'positive' | 'negative' | 'neutral';
  significance: 'minor' | 'major' | 'pivotal';
  outcome: string;
  date: Date;
}

export interface EmotionalJourney {
  characterId: string;
  emotionalStates: EmotionalState[];
  dominantEmotions: string[];
  emotionalRange: number; // 1-10, how much emotional variety
  stability: number; // 1-10, how emotionally stable
  growth: number; // 1-10, how much emotional growth
  peaks: EmotionalPeak[];
  valleys: EmotionalValley[];
}

export interface EmotionalState {
  chapterId: string;
  chapterName: string;
  primaryEmotion: string;
  intensity: number; // 1-10
  triggers: string[];
  reactions: string[];
  consequences: string[];
  notes: string;
}

export interface EmotionalPeak {
  chapterId: string;
  emotion: string;
  intensity: number;
  description: string;
  context: string;
}

export interface EmotionalValley {
  chapterId: string;
  emotion: string;
  intensity: number;
  description: string;
  context: string;
}

export interface CharacterAnalysis {
  characterId: string;
  analysis: {
    arcConsistency: number; // 1-100
    motivationClarity: number;
    growthRealism: number;
    emotionalDepth: number;
    relationshipComplexity: number;
    overallStrength: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: CharacterSuggestion[];
  arcCompletion: number;
  developmentTrends: DevelopmentTrend[];
}

export interface CharacterSuggestion {
  type: 'arc' | 'relationship' | 'motivation' | 'growth' | 'consistency';
  suggestion: string;
  importance: 'low' | 'medium' | 'high';
  chapter?: string;
  rationale: string;
}

export interface DevelopmentTrend {
  aspect: 'emotional_growth' | 'skill_development' | 'relationship_changes' | 'goal_evolution';
  direction: 'improving' | 'declining' | 'static' | 'fluctuating';
  confidence: number; // 1-100
  data: TrendDataPoint[];
}

export interface TrendDataPoint {
  chapterId: string;
  value: number;
  context: string;
}

export interface ArcTemplate {
  id: string;
  name: string;
  description: string;
  type: CharacterArc['type'];
  stages: ArcStage[];
  sampleMilestones: string[];
  recommendedForRoles: Character['role'][];
  difficulty: 'simple' | 'moderate' | 'complex';
  theme: string;
}

export interface ArcStage {
  name: string;
  description: string;
  percentage: number; // Where in story this occurs (0-100)
  keyChanges: string[];
  commonChallenges: string[];
}

// Pre-defined arc templates
const ARC_TEMPLATES: ArcTemplate[] = [
  {
    id: 'hero-journey',
    name: 'Hero\'s Journey',
    description: 'Classic character growth from ordinary to extraordinary',
    type: 'positive',
    stages: [
      {
        name: 'Ordinary World',
        description: 'Character in their normal, comfortable environment',
        percentage: 0,
        keyChanges: ['Establish normal life', 'Show character flaws/limitations'],
        commonChallenges: ['Making character relatable', 'Showing potential for growth']
      },
      {
        name: 'Call to Adventure',
        description: 'Character is presented with a challenge',
        percentage: 15,
        keyChanges: ['Disruption of normal life', 'First glimpse of character\'s destiny'],
        commonChallenges: ['Making call compelling', 'Character resistance believable']
      },
      {
        name: 'Crossing Threshold',
        description: 'Character commits to the journey',
        percentage: 25,
        keyChanges: ['Point of no return', 'First real test'],
        commonChallenges: ['Making commitment feel earned', 'Raising stakes appropriately']
      },
      {
        name: 'Tests and Trials',
        description: 'Character faces increasing challenges',
        percentage: 50,
        keyChanges: ['Skills development', 'Relationships formed', 'Confidence building'],
        commonChallenges: ['Maintaining tension', 'Showing realistic growth']
      },
      {
        name: 'Death and Rebirth',
        description: 'Character faces their greatest fear/challenge',
        percentage: 75,
        keyChanges: ['Symbolic death of old self', 'Emergence of transformed character'],
        commonChallenges: ['Making transformation believable', 'Emotional resonance']
      },
      {
        name: 'Return with Gift',
        description: 'Character returns transformed with wisdom/power',
        percentage: 100,
        keyChanges: ['Demonstration of growth', 'Helping others with new wisdom'],
        commonChallenges: ['Avoiding anticlimactic ending', 'Showing lasting change']
      }
    ],
    sampleMilestones: [
      'First refusal of the call',
      'Meeting the mentor',
      'First major victory',
      'Betrayal or setback',
      'Dark night of the soul',
      'Final confrontation',
      'Integration of lessons learned'
    ],
    recommendedForRoles: ['protagonist'],
    difficulty: 'moderate',
    theme: 'growth through adversity'
  },
  {
    id: 'fall-arc',
    name: 'Fall/Corruption Arc',
    description: 'Character descends from good to evil or high to low',
    type: 'negative',
    stages: [
      {
        name: 'Noble Beginning',
        description: 'Character starts in a position of virtue or success',
        percentage: 0,
        keyChanges: ['Establish character\'s goodness', 'Show initial stability'],
        commonChallenges: ['Making fall feel inevitable', 'Character sympathy']
      },
      {
        name: 'First Temptation',
        description: 'Character faces initial moral choice',
        percentage: 20,
        keyChanges: ['Introduction of corrupting influence', 'First compromise'],
        commonChallenges: ['Making temptation appealing', 'Maintaining reader interest']
      },
      {
        name: 'Escalating Compromises',
        description: 'Character makes increasingly poor choices',
        percentage: 50,
        keyChanges: ['Series of moral failures', 'Isolation from allies'],
        commonChallenges: ['Pacing the descent', 'Keeping character sympathetic']
      },
      {
        name: 'Point of No Return',
        description: 'Character crosses line they cannot uncross',
        percentage: 75,
        keyChanges: ['Ultimate betrayal or crime', 'Loss of redemption possibility'],
        commonChallenges: ['Making moment impactful', 'Reader emotional investment']
      },
      {
        name: 'Tragic End',
        description: 'Character faces consequences of their choices',
        percentage: 100,
        keyChanges: ['Final downfall', 'Recognition of what was lost'],
        commonChallenges: ['Satisfying conclusion', 'Thematic resonance']
      }
    ],
    sampleMilestones: [
      'First moral compromise',
      'Betrayal of friend/ally',
      'Use of power for selfish gain',
      'Rejection of help/redemption',
      'Ultimate act of evil',
      'Realization of what was lost'
    ],
    recommendedForRoles: ['protagonist', 'antagonist'],
    difficulty: 'complex',
    theme: 'corruption of power/virtue'
  },
  {
    id: 'flat-arc',
    name: 'Flat Character Arc',
    description: 'Character stays largely the same but changes others',
    type: 'flat',
    stages: [
      {
        name: 'Strong Foundation',
        description: 'Character has clear, stable worldview and values',
        percentage: 0,
        keyChanges: ['Establish character\'s core beliefs', 'Show unshakeable nature'],
        commonChallenges: ['Avoiding boring character', 'Creating compelling conflicts']
      },
      {
        name: 'Testing of Beliefs',
        description: 'Character\'s worldview is challenged',
        percentage: 25,
        keyChanges: ['External pressure on beliefs', 'Character stands firm'],
        commonChallenges: ['Making tests meaningful', 'Showing character strength']
      },
      {
        name: 'Influencing Others',
        description: 'Character begins to change the world around them',
        percentage: 50,
        keyChanges: ['Others begin to change', 'Character\'s impact grows'],
        commonChallenges: ['Showing realistic influence', 'Avoiding preachiness']
      },
      {
        name: 'Final Test',
        description: 'Character faces ultimate challenge to their beliefs',
        percentage: 75,
        keyChanges: ['Greatest pressure yet', 'Character proves their conviction'],
        commonChallenges: ['Making stakes feel high', 'Emotional resonance']
      },
      {
        name: 'Transformed World',
        description: 'Character has changed their environment',
        percentage: 100,
        keyChanges: ['World reflects character\'s values', 'Others carry on the change'],
        commonChallenges: ['Showing lasting impact', 'Satisfying resolution']
      }
    ],
    sampleMilestones: [
      'First stand for beliefs',
      'Converting an opponent',
      'Sacrifice for principles',
      'Inspiring mass change',
      'Final demonstration of values'
    ],
    recommendedForRoles: ['protagonist', 'mentor'],
    difficulty: 'moderate',
    theme: 'steadfast virtue changes world'
  }
];

class CharacterArcService {
  private static instance: CharacterArcService;
  private eventEmitter: BrowserEventEmitter;
  
  private characters: Map<string, Character> = new Map();
  private arcs: Map<string, CharacterArc> = new Map();
  private relationships: Map<string, CharacterRelationship> = new Map();
  private emotionalJourneys: Map<string, EmotionalJourney> = new Map();
  private templates: ArcTemplate[] = [...ARC_TEMPLATES];

  private constructor() {
    this.eventEmitter = BrowserEventEmitter.getInstance();
    this.loadData();
  }

  static getInstance(): CharacterArcService {
    if (!CharacterArcService.instance) {
      CharacterArcService.instance = new CharacterArcService();
    }
    return CharacterArcService.instance;
  }

  // Character Management
  createCharacter(data: Omit<Character, 'id' | 'arc' | 'createdAt' | 'updatedAt'>): Character {
    const character: Character = {
      ...data,
      id: this.generateId(),
      arc: this.createDefaultArc(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.characters.set(character.id, character);
    this.arcs.set(character.arc.id, character.arc);
    this.emotionalJourneys.set(character.id, this.createDefaultEmotionalJourney(character.id));
    
    this.saveData();
    this.eventEmitter.emit('character:created', character);
    return character;
  }

  updateCharacter(characterId: string, updates: Partial<Character>): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    Object.assign(character, updates, { updatedAt: new Date() });
    this.saveData();
    
    this.eventEmitter.emit('character:updated', character);
  }

  deleteCharacter(characterId: string): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    this.characters.delete(characterId);
    this.arcs.delete(character.arc.id);
    this.emotionalJourneys.delete(characterId);
    
    // Remove relationships
    this.relationships.forEach((rel, id) => {
      if (rel.characterId === characterId || rel.relatedCharacterId === characterId) {
        this.relationships.delete(id);
      }
    });

    this.saveData();
    this.eventEmitter.emit('character:deleted', characterId);
  }

  // Arc Management
  private createDefaultArc(): CharacterArc {
    return {
      id: this.generateId(),
      characterId: '',
      type: 'growth',
      startingPoint: {
        id: this.generateId(),
        name: 'Starting Point',
        description: '',
        emotionalState: '',
        beliefs: [],
        skills: [],
        relationships: []
      },
      endingPoint: {
        id: this.generateId(),
        name: 'Ending Point',
        description: '',
        emotionalState: '',
        beliefs: [],
        skills: [],
        relationships: []
      },
      milestones: [],
      theme: '',
      internalConflict: '',
      externalConflict: '',
      changeReason: '',
      completionPercentage: 0,
      notes: ''
    };
  }

  updateArc(characterId: string, updates: Partial<CharacterArc>): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    Object.assign(character.arc, updates);
    this.arcs.set(character.arc.id, character.arc);
    
    character.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('arc:updated', character.arc);
  }

  applyArcTemplate(characterId: string, templateId: string): void {
    const character = this.characters.get(characterId);
    const template = this.templates.find(t => t.id === templateId);
    
    if (!character || !template) return;

    // Create milestones based on template
    const milestones: ArcMilestone[] = template.sampleMilestones.map((milestone, index) => ({
      id: this.generateId(),
      name: milestone,
      description: '',
      type: this.inferMilestoneType(milestone),
      emotionalImpact: 'medium',
      significance: 'major',
      changeInCharacter: '',
      triggerEvent: '',
      completed: false,
      order: index + 1,
      notes: ''
    }));

    const arcUpdates: Partial<CharacterArc> = {
      type: template.type,
      theme: template.theme,
      milestones
    };

    this.updateArc(characterId, arcUpdates);
  }

  private inferMilestoneType(milestoneName: string): ArcMilestone['type'] {
    const name = milestoneName.toLowerCase();
    if (name.includes('realization') || name.includes('learn')) return 'realization';
    if (name.includes('decision') || name.includes('choice')) return 'decision';
    if (name.includes('action') || name.includes('fight') || name.includes('confrontation')) return 'action';
    if (name.includes('consequence') || name.includes('result')) return 'consequence';
    if (name.includes('growth') || name.includes('change')) return 'growth';
    if (name.includes('setback') || name.includes('failure')) return 'setback';
    return 'growth';
  }

  // Milestone Management
  addMilestone(characterId: string, milestone: Omit<ArcMilestone, 'id'>): ArcMilestone {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const newMilestone: ArcMilestone = {
      ...milestone,
      id: this.generateId()
    };

    character.arc.milestones.push(newMilestone);
    character.arc.milestones.sort((a, b) => a.order - b.order);
    
    this.updateArcCompletion(characterId);
    character.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('milestone:added', { characterId, milestone: newMilestone });
    return newMilestone;
  }

  updateMilestone(characterId: string, milestoneId: string, updates: Partial<ArcMilestone>): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    const milestone = character.arc.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    Object.assign(milestone, updates);
    
    if ('completed' in updates) {
      if (updates.completed) {
        milestone.dateCompleted = new Date();
      } else {
        milestone.dateCompleted = undefined;
      }
      this.updateArcCompletion(characterId);
    }

    character.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('milestone:updated', { characterId, milestone });
  }

  deleteMilestone(characterId: string, milestoneId: string): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    character.arc.milestones = character.arc.milestones.filter(m => m.id !== milestoneId);
    this.updateArcCompletion(characterId);
    
    character.updatedAt = new Date();
    this.saveData();
    
    this.eventEmitter.emit('milestone:deleted', { characterId, milestoneId });
  }

  private updateArcCompletion(characterId: string): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    const totalMilestones = character.arc.milestones.length;
    const completedMilestones = character.arc.milestones.filter(m => m.completed).length;
    
    character.arc.completionPercentage = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;
  }

  // Relationship Management
  addRelationship(data: Omit<CharacterRelationship, 'id'>): CharacterRelationship {
    const relationship: CharacterRelationship = {
      ...data,
      id: this.generateId()
    };

    this.relationships.set(relationship.id, relationship);
    
    // Add to character
    const character = this.characters.get(data.characterId);
    if (character) {
      character.relationships.push(relationship);
      character.updatedAt = new Date();
    }

    this.saveData();
    this.eventEmitter.emit('relationship:added', relationship);
    return relationship;
  }

  updateRelationship(relationshipId: string, updates: Partial<CharacterRelationship>): void {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) return;

    Object.assign(relationship, updates);
    
    // Update in character as well
    const character = this.characters.get(relationship.characterId);
    if (character) {
      const charRel = character.relationships.find(r => r.id === relationshipId);
      if (charRel) {
        Object.assign(charRel, updates);
      }
      character.updatedAt = new Date();
    }

    this.saveData();
    this.eventEmitter.emit('relationship:updated', relationship);
  }

  // Emotional Journey Management
  private createDefaultEmotionalJourney(characterId: string): EmotionalJourney {
    return {
      characterId,
      emotionalStates: [],
      dominantEmotions: [],
      emotionalRange: 5,
      stability: 5,
      growth: 5,
      peaks: [],
      valleys: []
    };
  }

  addEmotionalState(characterId: string, state: Omit<EmotionalState, 'chapterName'>): void {
    const journey = this.emotionalJourneys.get(characterId);
    if (!journey) return;

    const emotionalState: EmotionalState = {
      ...state,
      chapterName: `Chapter ${state.chapterId}` // Simplified - could link to actual chapter
    };

    journey.emotionalStates.push(emotionalState);
    journey.emotionalStates.sort((a, b) => a.chapterId.localeCompare(b.chapterId));
    
    this.updateEmotionalMetrics(characterId);
    this.saveData();
    
    this.eventEmitter.emit('emotional-state:added', { characterId, state: emotionalState });
  }

  private updateEmotionalMetrics(characterId: string): void {
    const journey = this.emotionalJourneys.get(characterId);
    if (!journey) return;

    // Calculate dominant emotions
    const emotionCounts: Record<string, number> = {};
    journey.emotionalStates.forEach(state => {
      emotionCounts[state.primaryEmotion] = (emotionCounts[state.primaryEmotion] || 0) + 1;
    });

    journey.dominantEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Calculate emotional range (variety of emotions)
    const uniqueEmotions = new Set(journey.emotionalStates.map(s => s.primaryEmotion));
    journey.emotionalRange = Math.min(10, uniqueEmotions.size);

    // Calculate stability (how much intensity varies)
    const intensities = journey.emotionalStates.map(s => s.intensity);
    const avgIntensity = intensities.reduce((sum, i) => sum + i, 0) / intensities.length;
    const variance = intensities.reduce((sum, i) => sum + Math.pow(i - avgIntensity, 2), 0) / intensities.length;
    journey.stability = Math.max(1, Math.min(10, 10 - Math.sqrt(variance)));

    // Find peaks and valleys
    journey.peaks = journey.emotionalStates
      .filter(state => state.intensity >= 8)
      .map(state => ({
        chapterId: state.chapterId,
        emotion: state.primaryEmotion,
        intensity: state.intensity,
        description: `High ${state.primaryEmotion}`,
        context: state.triggers.join(', ')
      }));

    journey.valleys = journey.emotionalStates
      .filter(state => state.intensity <= 3)
      .map(state => ({
        chapterId: state.chapterId,
        emotion: state.primaryEmotion,
        intensity: state.intensity,
        description: `Low ${state.primaryEmotion}`,
        context: state.triggers.join(', ')
      }));
  }

  // Analysis
  analyzeCharacter(characterId: string): CharacterAnalysis {
    const character = this.characters.get(characterId);
    const journey = this.emotionalJourneys.get(characterId);
    
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const analysis = {
      arcConsistency: this.calculateArcConsistency(character),
      motivationClarity: this.calculateMotivationClarity(character),
      growthRealism: this.calculateGrowthRealism(character),
      emotionalDepth: journey ? this.calculateEmotionalDepth(journey) : 50,
      relationshipComplexity: this.calculateRelationshipComplexity(character),
      overallStrength: 0
    };

    analysis.overallStrength = Math.round(
      (analysis.arcConsistency + analysis.motivationClarity + analysis.growthRealism + 
       analysis.emotionalDepth + analysis.relationshipComplexity) / 5
    );

    return {
      characterId,
      analysis,
      strengths: this.identifyStrengths(character, analysis),
      weaknesses: this.identifyWeaknesses(character, analysis),
      suggestions: this.generateSuggestions(character, analysis),
      arcCompletion: character.arc.completionPercentage,
      developmentTrends: this.calculateDevelopmentTrends(characterId)
    };
  }

  private calculateArcConsistency(character: Character): number {
    // Mock calculation - in production, analyze actual arc progression
    const milestoneCount = character.arc.milestones.length;
    const completedMilestones = character.arc.milestones.filter(m => m.completed).length;
    
    let score = 70; // Base score
    
    // Bonus for having milestones
    if (milestoneCount > 0) score += 10;
    if (milestoneCount >= 5) score += 5;
    
    // Bonus for completion
    if (completedMilestones > 0) score += 10;
    
    // Bonus for having theme and conflicts defined
    if (character.arc.theme) score += 5;
    if (character.arc.internalConflict) score += 5;
    if (character.arc.externalConflict) score += 5;
    
    return Math.min(100, score);
  }

  private calculateMotivationClarity(character: Character): number {
    let score = 50; // Base score
    
    if (character.motivation) score += 20;
    if (character.goals.length > 0) score += 15;
    if (character.goals.length >= 3) score += 10;
    if (character.fears.length > 0) score += 10;
    if (character.arc.changeReason) score += 15;
    
    return Math.min(100, score);
  }

  private calculateGrowthRealism(character: Character): number {
    // Mock calculation based on arc type and milestones
    let score = 60; // Base score
    
    const milestoneVariety = new Set(character.arc.milestones.map(m => m.type)).size;
    score += milestoneVariety * 5; // Bonus for varied milestone types
    
    if (character.flaws.length > 0) score += 10; // Having flaws makes growth more realistic
    if (character.strengths.length > 0) score += 10;
    
    return Math.min(100, score);
  }

  private calculateEmotionalDepth(journey: EmotionalJourney): number {
    let score = 50; // Base score
    
    score += journey.emotionalRange * 5; // Up to 50 points for range
    score += Math.max(0, 10 - journey.stability) * 2; // Some instability is good for depth
    
    if (journey.peaks.length > 0) score += 10;
    if (journey.valleys.length > 0) score += 10;
    
    return Math.min(100, score);
  }

  private calculateRelationshipComplexity(character: Character): number {
    let score = 40; // Base score
    
    const relationshipTypes = new Set(character.relationships.map(r => r.type)).size;
    score += relationshipTypes * 8; // Variety of relationship types
    
    const dynamicRelationships = character.relationships.filter(r => r.dynamic !== 'static').length;
    score += dynamicRelationships * 5; // Bonus for changing relationships
    
    return Math.min(100, score);
  }

  private identifyStrengths(character: Character, analysis: CharacterAnalysis['analysis']): string[] {
    const strengths: string[] = [];
    
    if (analysis.arcConsistency > 80) strengths.push('Well-defined character arc');
    if (analysis.motivationClarity > 80) strengths.push('Clear motivations and goals');
    if (analysis.emotionalDepth > 80) strengths.push('Rich emotional complexity');
    if (analysis.relationshipComplexity > 80) strengths.push('Complex relationship dynamics');
    if (character.arc.milestones.length >= 5) strengths.push('Detailed character development plan');
    
    return strengths.length > 0 ? strengths : ['Basic character foundation established'];
  }

  private identifyWeaknesses(character: Character, analysis: CharacterAnalysis['analysis']): string[] {
    const weaknesses: string[] = [];
    
    if (analysis.arcConsistency < 60) weaknesses.push('Needs more consistent character arc');
    if (analysis.motivationClarity < 60) weaknesses.push('Unclear or weak motivations');
    if (analysis.emotionalDepth < 60) weaknesses.push('Limited emotional range or depth');
    if (analysis.relationshipComplexity < 60) weaknesses.push('Relationships need more development');
    if (character.arc.milestones.length < 3) weaknesses.push('Needs more detailed arc milestones');
    
    return weaknesses;
  }

  private generateSuggestions(character: Character, analysis: CharacterAnalysis['analysis']): CharacterSuggestion[] {
    const suggestions: CharacterSuggestion[] = [];
    
    if (character.arc.theme === '') {
      suggestions.push({
        type: 'arc',
        suggestion: 'Define a central theme for this character\'s arc',
        importance: 'high',
        rationale: 'A clear theme helps guide character development decisions'
      });
    }
    
    if (character.flaws.length === 0) {
      suggestions.push({
        type: 'growth',
        suggestion: 'Add character flaws to create growth opportunities',
        importance: 'high',
        rationale: 'Characters need flaws to overcome for meaningful development'
      });
    }
    
    if (analysis.relationshipComplexity < 70) {
      suggestions.push({
        type: 'relationship',
        suggestion: 'Develop more complex relationship dynamics',
        importance: 'medium',
        rationale: 'Relationships drive character growth and conflict'
      });
    }
    
    return suggestions;
  }

  private calculateDevelopmentTrends(characterId: string): DevelopmentTrend[] {
    // Mock implementation - in production, analyze actual story progression
    return [
      {
        aspect: 'emotional_growth',
        direction: 'improving',
        confidence: 75,
        data: [
          { chapterId: 'ch1', value: 3, context: 'Starting emotional state' },
          { chapterId: 'ch5', value: 5, context: 'First growth moment' },
          { chapterId: 'ch10', value: 7, context: 'Major breakthrough' }
        ]
      }
    ];
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Data Persistence
  private saveData(): void {
    const data = {
      characters: Array.from(this.characters.entries()),
      arcs: Array.from(this.arcs.entries()),
      relationships: Array.from(this.relationships.entries()),
      emotionalJourneys: Array.from(this.emotionalJourneys.entries())
    };
    localStorage.setItem('characterArcs', JSON.stringify(data));
  }

  private loadData(): void {
    const saved = localStorage.getItem('characterArcs');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        if (data.characters) {
          this.characters = new Map(data.characters);
        }
        if (data.arcs) {
          this.arcs = new Map(data.arcs);
        }
        if (data.relationships) {
          this.relationships = new Map(data.relationships);
        }
        if (data.emotionalJourneys) {
          this.emotionalJourneys = new Map(data.emotionalJourneys);
        }
      } catch (error) {
        console.error('Failed to load character arc data:', error);
      }
    }
  }

  // Public API
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  getCharactersByRole(role: Character['role']): Character[] {
    return Array.from(this.characters.values()).filter(c => c.role === role);
  }

  getArcTemplates(): ArcTemplate[] {
    return this.templates;
  }

  getEmotionalJourney(characterId: string): EmotionalJourney | undefined {
    return this.emotionalJourneys.get(characterId);
  }

  getRelationships(characterId: string): CharacterRelationship[] {
    return Array.from(this.relationships.values()).filter(r => r.characterId === characterId);
  }

  cleanup(): void {
    // Clean up any resources if needed
  }
}

export default new CharacterArcService();

export const characterArcService = CharacterArcService.getInstance();