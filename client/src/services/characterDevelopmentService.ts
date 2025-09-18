/**
 * Character Development Service
 * Comprehensive character creation, development, and relationship management
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';

export interface Character {
  id: string;
  name: string;
  fullName?: string;
  aliases: string[];
  projectId: string;
  
  // Basic Information
  age?: number;
  gender?: string;
  species?: string;
  occupation?: string;
  birthDate?: Date;
  birthPlace?: string;
  nationality?: string;
  
  // Physical Description
  physicalDescription: {
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    skinTone?: string;
    bodyType?: string;
    distinguishingMarks?: string;
    clothing?: string;
    voiceDescription?: string;
  };
  
  // Personality
  personality: {
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    fears: string[];
    desires: string[];
    motivations: string[];
    habits: string[];
    quirks: string[];
    moralAlignment?: 'lawful-good' | 'neutral-good' | 'chaotic-good' | 
                     'lawful-neutral' | 'true-neutral' | 'chaotic-neutral' |
                     'lawful-evil' | 'neutral-evil' | 'chaotic-evil';
  };
  
  // Background
  background: {
    backstory: string;
    education?: string;
    family?: string;
    socialClass?: string;
    significantEvents: Array<{
      event: string;
      age?: number;
      impact: string;
      date?: Date;
    }>;
    secrets: string[];
    trauma?: string[];
    achievements?: string[];
  };
  
  // Relationships
  relationships: Array<{
    characterId: string;
    relationshipType: RelationshipType;
    description: string;
    status: 'current' | 'past' | 'complicated';
    intensity: number; // 1-10 scale
    history?: string;
    conflictLevel?: number; // 1-10 scale
  }>;
  
  // Development
  development: {
    characterArc: string;
    goals: Array<{
      goal: string;
      priority: 'low' | 'medium' | 'high';
      status: 'not-started' | 'in-progress' | 'achieved' | 'failed';
      deadline?: Date;
    }>;
    conflicts: Array<{
      type: 'internal' | 'external' | 'interpersonal';
      description: string;
      resolution?: string;
      impact: string;
    }>;
    growthMilestones: Array<{
      milestone: string;
      chapter?: string;
      achieved: boolean;
      description: string;
    }>;
  };
  
  // Story Involvement
  storyRole: {
    importance: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'cameo';
    function: string[];
    firstAppearance?: string;
    lastAppearance?: string;
    sceneCount?: number;
    wordCount?: number;
  };
  
  // Dialogue & Voice
  voice: {
    speechPatterns: string[];
    vocabulary: 'simple' | 'average' | 'sophisticated' | 'technical' | 'mixed';
    accent?: string;
    catchphrases: string[];
    speaking_style: 'formal' | 'casual' | 'poetic' | 'blunt' | 'verbose' | 'quiet';
    languages: string[];
  };
  
  // Notes and References
  notes: string;
  tags: string[];
  imageUrl?: string;
  references: Array<{
    type: 'inspiration' | 'research' | 'visual' | 'other';
    title: string;
    url?: string;
    description?: string;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isTemplate: boolean;
  templateCategory?: string;
}

export type RelationshipType = 
  | 'family-parent' | 'family-child' | 'family-sibling' | 'family-spouse' | 'family-extended'
  | 'romantic-partner' | 'romantic-ex' | 'romantic-interest' | 'romantic-unrequited'
  | 'friend-best' | 'friend-close' | 'friend-casual' | 'friend-childhood'
  | 'work-boss' | 'work-colleague' | 'work-subordinate' | 'work-client'
  | 'enemy-arch' | 'enemy-rival' | 'enemy-ideological' | 'enemy-personal'
  | 'mentor-teacher' | 'mentor-student' | 'mentor-guide'
  | 'acquaintance' | 'stranger' | 'neighbor' | 'authority' | 'other';

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  characterData: Partial<Character>;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
}

export interface CharacterRelationshipMap {
  characters: Character[];
  relationships: Array<{
    fromId: string;
    toId: string;
    relationship: Character['relationships'][0];
    strength: number;
    mutualRelationship?: Character['relationships'][0];
  }>;
  clusters: Array<{
    id: string;
    name: string;
    characterIds: string[];
    centerCharacterId?: string;
    description?: string;
  }>;
}

export interface CharacterAnalytics {
  totalCharacters: number;
  charactersByRole: Record<string, number>;
  charactersByProject: Record<string, number>;
  relationshipStats: {
    totalRelationships: number;
    relationshipsByType: Record<RelationshipType, number>;
    averageConnectionsPerCharacter: number;
    mostConnectedCharacter?: Character;
  };
  developmentProgress: {
    charactersWithArcs: number;
    completedArcs: number;
    averageGoalsPerCharacter: number;
    charactersNeedingDevelopment: Character[];
  };
  contentMetrics: {
    averageWordCount: number;
    averageSceneAppearances: number;
    underutilizedCharacters: Character[];
    overutilizedCharacters: Character[];
  };
}

export interface CharacterDevelopmentPrompt {
  id: string;
  category: 'personality' | 'background' | 'goals' | 'relationships' | 'voice' | 'development';
  prompt: string;
  followUpQuestions: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

class CharacterDevelopmentService extends BrowserEventEmitter {
  private characters: Map<string, Character> = new Map();
  private templates: CharacterTemplate[] = [];
  private developmentPrompts: CharacterDevelopmentPrompt[] = [];
  private storageKey = 'astral_notes_characters';

  constructor() {
    super();
    this.loadData();
    this.initializeTemplates();
    this.initializeDevelopmentPrompts();
  }

  // Character Management
  createCharacter(characterData: Partial<Character>): Character {
    const character: Character = {
      id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: characterData.name || 'Unnamed Character',
      fullName: characterData.fullName,
      aliases: characterData.aliases || [],
      projectId: characterData.projectId || '',
      
      age: characterData.age,
      gender: characterData.gender,
      species: characterData.species || 'Human',
      occupation: characterData.occupation,
      birthDate: characterData.birthDate,
      birthPlace: characterData.birthPlace,
      nationality: characterData.nationality,
      
      physicalDescription: {
        height: characterData.physicalDescription?.height,
        weight: characterData.physicalDescription?.weight,
        eyeColor: characterData.physicalDescription?.eyeColor,
        hairColor: characterData.physicalDescription?.hairColor,
        skinTone: characterData.physicalDescription?.skinTone,
        bodyType: characterData.physicalDescription?.bodyType,
        distinguishingMarks: characterData.physicalDescription?.distinguishingMarks,
        clothing: characterData.physicalDescription?.clothing,
        voiceDescription: characterData.physicalDescription?.voiceDescription,
        ...characterData.physicalDescription
      },
      
      personality: {
        traits: characterData.personality?.traits || [],
        strengths: characterData.personality?.strengths || [],
        weaknesses: characterData.personality?.weaknesses || [],
        fears: characterData.personality?.fears || [],
        desires: characterData.personality?.desires || [],
        motivations: characterData.personality?.motivations || [],
        habits: characterData.personality?.habits || [],
        quirks: characterData.personality?.quirks || [],
        moralAlignment: characterData.personality?.moralAlignment,
        ...characterData.personality
      },
      
      background: {
        backstory: characterData.background?.backstory || '',
        education: characterData.background?.education,
        family: characterData.background?.family,
        socialClass: characterData.background?.socialClass,
        significantEvents: characterData.background?.significantEvents || [],
        secrets: characterData.background?.secrets || [],
        trauma: characterData.background?.trauma,
        achievements: characterData.background?.achievements,
        ...characterData.background
      },
      
      relationships: characterData.relationships || [],
      
      development: {
        characterArc: characterData.development?.characterArc || '',
        goals: characterData.development?.goals || [],
        conflicts: characterData.development?.conflicts || [],
        growthMilestones: characterData.development?.growthMilestones || [],
        ...characterData.development
      },
      
      storyRole: {
        importance: characterData.storyRole?.importance || 'supporting',
        function: characterData.storyRole?.function || [],
        firstAppearance: characterData.storyRole?.firstAppearance,
        lastAppearance: characterData.storyRole?.lastAppearance,
        sceneCount: characterData.storyRole?.sceneCount || 0,
        wordCount: characterData.storyRole?.wordCount || 0,
        ...characterData.storyRole
      },
      
      voice: {
        speechPatterns: characterData.voice?.speechPatterns || [],
        vocabulary: characterData.voice?.vocabulary || 'average',
        accent: characterData.voice?.accent,
        catchphrases: characterData.voice?.catchphrases || [],
        speaking_style: characterData.voice?.speaking_style || 'casual',
        languages: characterData.voice?.languages || ['English'],
        ...characterData.voice
      },
      
      notes: characterData.notes || '',
      tags: characterData.tags || [],
      imageUrl: characterData.imageUrl,
      references: characterData.references || [],
      
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isTemplate: characterData.isTemplate || false,
      templateCategory: characterData.templateCategory
    };

    this.characters.set(character.id, character);
    this.saveCharacters();
    this.emit('characterCreated', character);
    
    return character;
  }

  updateCharacter(characterId: string, updates: Partial<Character>): Character | null {
    const character = this.characters.get(characterId);
    if (!character) return null;

    const updatedCharacter: Character = {
      ...character,
      ...updates,
      id: character.id, // Prevent ID changes
      updatedAt: new Date(),
      version: character.version + 1
    };

    this.characters.set(characterId, updatedCharacter);
    this.saveCharacters();
    this.emit('characterUpdated', { character: updatedCharacter, changes: updates });
    
    return updatedCharacter;
  }

  deleteCharacter(characterId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    this.characters.delete(characterId);
    
    // Remove references from other characters' relationships
    this.characters.forEach(char => {
      char.relationships = char.relationships.filter(rel => rel.characterId !== characterId);
    });

    this.saveCharacters();
    this.emit('characterDeleted', { characterId, character });
    
    return true;
  }

  getCharacter(characterId: string): Character | null {
    return this.characters.get(characterId) || null;
  }

  getAllCharacters(projectId?: string): Character[] {
    const allCharacters = Array.from(this.characters.values());
    
    if (projectId) {
      return allCharacters.filter(char => char.projectId === projectId);
    }
    
    return allCharacters;
  }

  searchCharacters(query: string, projectId?: string): Character[] {
    const searchTerm = query.trim().toLowerCase();
    
    // Return empty array for empty search terms
    if (!searchTerm) {
      return [];
    }
    
    let characters = Array.from(this.characters.values());
    
    if (projectId) {
      characters = characters.filter(char => char.projectId === projectId);
    }
    
    return characters.filter(character => 
      character.name.toLowerCase().includes(searchTerm) ||
      character.fullName?.toLowerCase().includes(searchTerm) ||
      character.aliases.some(alias => alias.toLowerCase().includes(searchTerm)) ||
      character.occupation?.toLowerCase().includes(searchTerm) ||
      character.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      character.notes.toLowerCase().includes(searchTerm)
    );
  }

  // Relationship Management
  addRelationship(characterId: string, targetCharacterId: string, relationshipData: {
    relationshipType: RelationshipType;
    description: string;
    status?: 'current' | 'past' | 'complicated';
    intensity?: number;
    history?: string;
    conflictLevel?: number;
  }): boolean {
    const character = this.characters.get(characterId);
    const targetCharacter = this.characters.get(targetCharacterId);
    
    if (!character || !targetCharacter) return false;

    const relationship = {
      characterId: targetCharacterId,
      relationshipType: relationshipData.relationshipType,
      description: relationshipData.description,
      status: relationshipData.status || 'current' as const,
      intensity: relationshipData.intensity || 5,
      history: relationshipData.history,
      conflictLevel: relationshipData.conflictLevel || 1
    };

    character.relationships.push(relationship);
    character.updatedAt = new Date();
    character.version++;

    this.saveCharacters();
    this.emit('relationshipAdded', { characterId, targetCharacterId, relationship });
    
    return true;
  }

  updateRelationship(characterId: string, targetCharacterId: string, updates: Partial<Character['relationships'][0]>): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const relationshipIndex = character.relationships.findIndex(rel => rel.characterId === targetCharacterId);
    if (relationshipIndex === -1) return false;

    character.relationships[relationshipIndex] = {
      ...character.relationships[relationshipIndex],
      ...updates
    };

    character.updatedAt = new Date();
    character.version++;

    this.saveCharacters();
    this.emit('relationshipUpdated', { characterId, targetCharacterId, relationship: character.relationships[relationshipIndex] });
    
    return true;
  }

  removeRelationship(characterId: string, targetCharacterId: string): boolean {
    const character = this.characters.get(characterId);
    if (!character) return false;

    const originalLength = character.relationships.length;
    character.relationships = character.relationships.filter(rel => rel.characterId !== targetCharacterId);

    if (character.relationships.length === originalLength) return false;

    character.updatedAt = new Date();
    character.version++;

    this.saveCharacters();
    this.emit('relationshipRemoved', { characterId, targetCharacterId });
    
    return true;
  }

  getCharacterRelationships(characterId: string): Character['relationships'] {
    const character = this.characters.get(characterId);
    return character?.relationships || [];
  }

  // Character Development Tools
  generateCharacterArc(characterId: string, storyGoal?: string): string {
    const character = this.characters.get(characterId);
    if (!character) return '';

    const motivations = character.personality.motivations.join(', ') || 'personal growth';
    const fears = character.personality.fears.join(', ') || 'failure';
    const strengths = character.personality.strengths.join(', ') || 'determination';
    const weaknesses = character.personality.weaknesses.join(', ') || 'self-doubt';

    const arcTemplate = `Character Arc for ${character.name}:

Beginning: ${character.name} starts driven by ${motivations}, but held back by ${weaknesses}.

Inciting Incident: A challenge that forces them to confront ${fears}.

Rising Action: ${character.name} must use ${strengths} while overcoming ${weaknesses} to pursue ${storyGoal || 'their goal'}.

Climax: The moment where ${character.name} must choose between their old ways and growth.

Resolution: ${character.name} emerges transformed, having learned to balance ${strengths} with newfound wisdom about ${weaknesses}.

Growth: From someone limited by ${fears} to someone who ${motivations} with confidence and purpose.`;

    return arcTemplate;
  }

  suggestCharacterGoals(characterId: string): Array<{ goal: string; priority: 'low' | 'medium' | 'high'; reasoning: string }> {
    const character = this.characters.get(characterId);
    if (!character) return [];

    const suggestions = [];

    // Based on motivations
    character.personality.motivations.forEach(motivation => {
      suggestions.push({
        goal: `Achieve ${motivation}`,
        priority: 'high' as const,
        reasoning: `Directly addresses character's core motivation`
      });
    });

    // Based on fears (overcoming them)
    character.personality.fears.forEach(fear => {
      suggestions.push({
        goal: `Overcome fear of ${fear}`,
        priority: 'medium' as const,
        reasoning: `Character growth through facing fears`
      });
    });

    // Based on weaknesses (improving them)
    character.personality.weaknesses.forEach(weakness => {
      suggestions.push({
        goal: `Improve ${weakness}`,
        priority: 'medium' as const,
        reasoning: `Personal development opportunity`
      });
    });

    // Based on relationships
    if (character.relationships.length > 0) {
      suggestions.push({
        goal: 'Strengthen important relationships',
        priority: 'high' as const,
        reasoning: 'Relationships drive character development'
      });
    }

    // Based on role
    if (character.storyRole.importance === 'protagonist') {
      suggestions.push({
        goal: 'Lead others to success',
        priority: 'high' as const,
        reasoning: 'Protagonist responsibility'
      });
    }

    return suggestions.slice(0, 6); // Return top 6 suggestions
  }

  analyzeCharacterDevelopment(characterId: string): {
    completeness: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    missingElements: string[];
  } {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        completeness: 0,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        missingElements: ['Character not found']
      };
    }

    const analysis = {
      completeness: 0,
      strengths: [] as string[],
      weaknesses: [] as string[],
      suggestions: [] as string[],
      missingElements: [] as string[]
    };

    let score = 0;
    const maxScore = 100;

    // Basic information (15 points)
    if (character.name) score += 3;
    if (character.age) score += 2;
    if (character.occupation) score += 3;
    if (character.species) score += 2;
    if (character.nationality) score += 2;
    if (character.physicalDescription.height) score += 3;

    // Personality (25 points)
    if (character.personality.traits.length > 0) {
      score += Math.min(character.personality.traits.length * 2, 8);
      analysis.strengths.push('Well-defined personality traits');
    } else {
      analysis.missingElements.push('Personality traits');
    }

    if (character.personality.motivations.length > 0) {
      score += Math.min(character.personality.motivations.length * 3, 9);
      analysis.strengths.push('Clear motivations');
    } else {
      analysis.missingElements.push('Character motivations');
      analysis.suggestions.push('Define what drives this character');
    }

    if (character.personality.fears.length > 0) {
      score += Math.min(character.personality.fears.length * 2, 8);
      analysis.strengths.push('Identified fears and vulnerabilities');
    } else {
      analysis.missingElements.push('Character fears');
      analysis.suggestions.push('Add fears to create vulnerability and conflict');
    }

    // Background (20 points)
    if (character.background.backstory) {
      score += character.background.backstory.length > 100 ? 10 : 5;
      analysis.strengths.push('Detailed backstory');
    } else {
      analysis.missingElements.push('Backstory');
      analysis.suggestions.push('Write character backstory to establish history');
    }

    if (character.background.significantEvents.length > 0) {
      score += Math.min(character.background.significantEvents.length * 5, 10);
      analysis.strengths.push('Significant life events documented');
    } else {
      analysis.missingElements.push('Significant life events');
    }

    // Relationships (15 points)
    if (character.relationships.length > 0) {
      score += Math.min(character.relationships.length * 3, 15);
      analysis.strengths.push('Established relationships');
    } else {
      analysis.missingElements.push('Character relationships');
      analysis.suggestions.push('Add relationships with other characters');
    }

    // Development (15 points)
    if (character.development.characterArc) {
      score += 8;
      analysis.strengths.push('Character arc defined');
    } else {
      analysis.missingElements.push('Character arc');
      analysis.suggestions.push('Define character growth arc');
    }

    if (character.development.goals.length > 0) {
      score += Math.min(character.development.goals.length * 2, 7);
      analysis.strengths.push('Character goals established');
    } else {
      analysis.missingElements.push('Character goals');
    }

    // Voice and dialogue (10 points)
    if (character.voice.speechPatterns.length > 0 || character.voice.catchphrases.length > 0) {
      score += 10;
      analysis.strengths.push('Distinctive voice');
    } else {
      analysis.missingElements.push('Speech patterns');
      analysis.suggestions.push('Develop unique speech patterns and voice');
    }

    analysis.completeness = Math.round((score / maxScore) * 100);

    // Add general suggestions based on completeness
    if (analysis.completeness < 30) {
      analysis.suggestions.push('Focus on basic character information first');
    } else if (analysis.completeness < 60) {
      analysis.suggestions.push('Develop personality and relationships further');
    } else if (analysis.completeness < 80) {
      analysis.suggestions.push('Add character growth and development elements');
    } else {
      analysis.suggestions.push('Character is well-developed! Consider fine-tuning details');
    }

    // Identify weaknesses
    if (character.personality.weaknesses.length === 0) {
      analysis.weaknesses.push('No character flaws defined');
    }
    if (character.relationships.length === 0) {
      analysis.weaknesses.push('Character exists in isolation');
    }
    if (!character.development.characterArc) {
      analysis.weaknesses.push('No clear character growth planned');
    }

    return analysis;
  }

  // Character Templates
  createTemplate(character: Character, templateData: {
    name: string;
    description: string;
    category: string;
    isPublic?: boolean;
  }): CharacterTemplate {
    const template: CharacterTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      characterData: { ...character },
      tags: character.tags,
      isPublic: templateData.isPublic || false,
      createdBy: 'user', // Would be actual user ID in real app
      usageCount: 0
    };

    this.templates.push(template);
    this.saveTemplates();
    this.emit('templateCreated', template);
    
    return template;
  }

  getTemplates(category?: string): CharacterTemplate[] {
    if (category) {
      return this.templates.filter(template => template.category === category);
    }
    return [...this.templates];
  }

  useTemplate(templateId: string, projectId: string, overrides: Partial<Character> = {}): Character | null {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    const characterData: Partial<Character> = {
      ...template.characterData,
      ...overrides,
      projectId,
      isTemplate: false,
      templateCategory: undefined
    };

    template.usageCount++;
    this.saveTemplates();

    return this.createCharacter(characterData);
  }

  // Development Prompts
  getRandomDevelopmentPrompt(category?: CharacterDevelopmentPrompt['category']): CharacterDevelopmentPrompt | null {
    let prompts = this.developmentPrompts;
    
    if (category) {
      prompts = prompts.filter(p => p.category === category);
    }
    
    if (prompts.length === 0) return null;
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  getDevelopmentPrompts(category?: CharacterDevelopmentPrompt['category'], difficulty?: CharacterDevelopmentPrompt['difficulty']): CharacterDevelopmentPrompt[] {
    let prompts = this.developmentPrompts;
    
    if (category) {
      prompts = prompts.filter(p => p.category === category);
    }
    
    if (difficulty) {
      prompts = prompts.filter(p => p.difficulty === difficulty);
    }
    
    return prompts;
  }

  // Analytics and Visualization
  generateRelationshipMap(projectId?: string): CharacterRelationshipMap {
    let characters = Array.from(this.characters.values());
    
    if (projectId) {
      characters = characters.filter(char => char.projectId === projectId);
    }

    const relationships = [];
    const characterConnections = new Map<string, number>();

    characters.forEach(character => {
      characterConnections.set(character.id, 0);
      
      character.relationships.forEach(rel => {
        const targetExists = characters.some(c => c.id === rel.characterId);
        if (targetExists) {
          relationships.push({
            fromId: character.id,
            toId: rel.characterId,
            relationship: rel,
            strength: rel.intensity || 5
          });
          
          characterConnections.set(character.id, (characterConnections.get(character.id) || 0) + 1);
          characterConnections.set(rel.characterId, (characterConnections.get(rel.characterId) || 0) + 1);
        }
      });
    });

    // Create clusters based on connection strength
    const clusters = this.createCharacterClusters(characters, relationships);

    return {
      characters,
      relationships,
      clusters
    };
  }

  private createCharacterClusters(characters: Character[], relationships: CharacterRelationshipMap['relationships']): CharacterRelationshipMap['clusters'] {
    const clusters = [];
    const processed = new Set<string>();

    characters.forEach(character => {
      if (processed.has(character.id)) return;

      const connected = this.findConnectedCharacters(character.id, relationships, new Set());
      if (connected.size > 1) {
        const centerCharacter = Array.from(connected).reduce((center, charId) => {
          const centerConnections = relationships.filter(r => r.fromId === center || r.toId === center).length;
          const charConnections = relationships.filter(r => r.fromId === charId || r.toId === charId).length;
          return charConnections > centerConnections ? charId : center;
        });

        clusters.push({
          id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${characters.find(c => c.id === centerCharacter)?.name}'s Circle`,
          characterIds: Array.from(connected),
          centerCharacterId: centerCharacter,
          description: `Connected group of ${connected.size} characters`
        });

        connected.forEach(id => processed.add(id));
      }
    });

    return clusters;
  }

  private findConnectedCharacters(characterId: string, relationships: CharacterRelationshipMap['relationships'], visited: Set<string>): Set<string> {
    if (visited.has(characterId)) return visited;
    
    visited.add(characterId);
    
    relationships.forEach(rel => {
      if (rel.fromId === characterId && !visited.has(rel.toId)) {
        this.findConnectedCharacters(rel.toId, relationships, visited);
      } else if (rel.toId === characterId && !visited.has(rel.fromId)) {
        this.findConnectedCharacters(rel.fromId, relationships, visited);
      }
    });
    
    return visited;
  }

  getCharacterAnalytics(projectId?: string): CharacterAnalytics {
    let characters = Array.from(this.characters.values());
    
    if (projectId) {
      characters = characters.filter(char => char.projectId === projectId);
    }

    const analytics: CharacterAnalytics = {
      totalCharacters: characters.length,
      charactersByRole: {},
      charactersByProject: {},
      relationshipStats: {
        totalRelationships: 0,
        relationshipsByType: {} as Record<RelationshipType, number>,
        averageConnectionsPerCharacter: 0,
        mostConnectedCharacter: undefined
      },
      developmentProgress: {
        charactersWithArcs: 0,
        completedArcs: 0,
        averageGoalsPerCharacter: 0,
        charactersNeedingDevelopment: []
      },
      contentMetrics: {
        averageWordCount: 0,
        averageSceneAppearances: 0,
        underutilizedCharacters: [],
        overutilizedCharacters: []
      }
    };

    // Character role distribution
    characters.forEach(char => {
      const role = char.storyRole.importance;
      analytics.charactersByRole[role] = (analytics.charactersByRole[role] || 0) + 1;
      
      analytics.charactersByProject[char.projectId] = (analytics.charactersByProject[char.projectId] || 0) + 1;
    });

    // Relationship statistics
    let totalRelationships = 0;
    let totalGoals = 0;
    let charactersWithArcs = 0;
    let maxConnections = 0;
    let mostConnected: Character | undefined;

    characters.forEach(char => {
      const relationshipCount = char.relationships.length;
      totalRelationships += relationshipCount;

      if (relationshipCount > maxConnections) {
        maxConnections = relationshipCount;
        mostConnected = char;
      }

      char.relationships.forEach(rel => {
        const type = rel.relationshipType;
        analytics.relationshipStats.relationshipsByType[type] = 
          (analytics.relationshipStats.relationshipsByType[type] || 0) + 1;
      });

      totalGoals += char.development.goals.length;
      
      if (char.development.characterArc && char.development.characterArc.length > 0) {
        charactersWithArcs++;
      }

      // Check if character needs development
      const developmentScore = this.analyzeCharacterDevelopment(char.id).completeness;
      if (developmentScore < 50) {
        analytics.developmentProgress.charactersNeedingDevelopment.push(char);
      }
    });

    analytics.relationshipStats.totalRelationships = totalRelationships;
    analytics.relationshipStats.averageConnectionsPerCharacter = characters.length > 0 ? totalRelationships / characters.length : 0;
    analytics.relationshipStats.mostConnectedCharacter = mostConnected;

    analytics.developmentProgress.charactersWithArcs = charactersWithArcs;
    analytics.developmentProgress.averageGoalsPerCharacter = characters.length > 0 ? totalGoals / characters.length : 0;

    return analytics;
  }

  // Data Management
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'template-hero',
        name: 'Classic Hero',
        description: 'Traditional protagonist template with heroic qualities',
        category: 'Archetypes',
        characterData: {
          storyRole: { importance: 'protagonist', function: ['leader', 'moral-compass'] },
          personality: {
            traits: ['brave', 'determined', 'loyal'],
            strengths: ['courage', 'leadership', 'empathy'],
            weaknesses: ['impulsiveness', 'self-doubt'],
            motivations: ['protect others', 'do the right thing'],
            moralAlignment: 'lawful-good'
          }
        },
        tags: ['hero', 'protagonist', 'classic'],
        isPublic: true,
        createdBy: 'system',
        usageCount: 0
      },
      {
        id: 'template-mentor',
        name: 'Wise Mentor',
        description: 'Experienced guide who helps the protagonist grow',
        category: 'Archetypes',
        characterData: {
          storyRole: { importance: 'supporting', function: ['guide', 'teacher'] },
          personality: {
            traits: ['wise', 'patient', 'experienced'],
            strengths: ['knowledge', 'insight', 'calm under pressure'],
            motivations: ['guide others', 'share wisdom'],
            moralAlignment: 'neutral-good'
          }
        },
        tags: ['mentor', 'wise', 'guide'],
        isPublic: true,
        createdBy: 'system',
        usageCount: 0
      }
    ];
  }

  private initializeDevelopmentPrompts(): void {
    this.developmentPrompts = [
      {
        id: 'prompt-personality-1',
        category: 'personality',
        prompt: 'What is your character\'s biggest fear, and how does it manifest in their daily life?',
        followUpQuestions: [
          'When did this fear first develop?',
          'How do they try to hide or overcome it?',
          'What would happen if they had to face this fear directly?'
        ],
        tags: ['fear', 'psychology', 'motivation'],
        difficulty: 'beginner'
      },
      {
        id: 'prompt-background-1',
        category: 'background',
        prompt: 'Describe a pivotal moment from your character\'s childhood that shaped who they are today.',
        followUpQuestions: [
          'Who else was involved in this moment?',
          'What lesson did they learn from this experience?',
          'How do they view this memory now versus then?'
        ],
        tags: ['childhood', 'formative', 'memory'],
        difficulty: 'intermediate'
      },
      {
        id: 'prompt-relationships-1',
        category: 'relationships',
        prompt: 'Who is the one person your character would do anything to protect, and why?',
        followUpQuestions: [
          'How did they meet this person?',
          'What sacrifices have they already made for them?',
          'What would losing this person mean to your character?'
        ],
        tags: ['protection', 'loyalty', 'sacrifice'],
        difficulty: 'beginner'
      },
      {
        id: 'prompt-goals-1',
        category: 'goals',
        prompt: 'What does your character want more than anything else, and what are they willing to give up to get it?',
        followUpQuestions: [
          'When did this desire first emerge?',
          'What obstacles stand in their way?',
          'How has this goal changed over time?'
        ],
        tags: ['desire', 'sacrifice', 'motivation'],
        difficulty: 'intermediate'
      },
      {
        id: 'prompt-voice-1',
        category: 'voice',
        prompt: 'How does your character speak differently to their best friend versus their worst enemy?',
        followUpQuestions: [
          'What words or phrases do they use frequently?',
          'How does their body language change?',
          'What do they never say out loud?'
        ],
        tags: ['dialogue', 'speech', 'communication'],
        difficulty: 'advanced'
      }
    ];
  }

  private saveCharacters(): void {
    try {
      const charactersArray = Array.from(this.characters.values());
      localStorage.setItem(this.storageKey, JSON.stringify(charactersArray));
    } catch (error) {
      console.error('Failed to save characters:', error);
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem(`${this.storageKey}_templates`, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  private loadData(): void {
    this.loadCharacters();
    this.loadTemplates();
  }

  private loadCharacters(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const charactersArray = JSON.parse(stored);
        this.characters.clear();
        charactersArray.forEach((char: Character) => {
          // Convert date strings back to Date objects
          char.createdAt = new Date(char.createdAt);
          char.updatedAt = new Date(char.updatedAt);
          if (char.birthDate) char.birthDate = new Date(char.birthDate);
          
          this.characters.set(char.id, char);
        });
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }

  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_templates`);
      if (stored) {
        const templatesArray = JSON.parse(stored);
        this.templates.push(...templatesArray);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }
}

export const characterDevelopmentService = new CharacterDevelopmentService();
export default characterDevelopmentService;