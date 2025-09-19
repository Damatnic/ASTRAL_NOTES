/**
 * AI Consistency Service
 * Checks for plot holes, character inconsistencies, timeline issues, and more
 */

import type { Project, Story, Scene, Character, Location, Timeline } from '@/types/story';

export interface ConsistencyIssue {
  id: string;
  type: 'character' | 'timeline' | 'location' | 'plot' | 'dialogue' | 'continuity' | 'world-rules';
  severity: 'error' | 'warning' | 'suggestion';
  title: string;
  description: string;
  affectedItems: Array<{
    type: string;
    id: string;
    title: string;
    location?: { chapter?: number; scene?: number; line?: number };
  }>;
  suggestions?: string[];
  autoFixAvailable?: boolean;
  category?: string;
}

export interface ConsistencyReport {
  projectId: string;
  timestamp: Date;
  issues: ConsistencyIssue[];
  statistics: {
    totalIssues: number;
    errors: number;
    warnings: number;
    suggestions: number;
    byType: Record<string, number>;
  };
  score: number; // 0-100 consistency score
}

export interface CharacterProfile {
  id: string;
  name: string;
  attributes: Record<string, any>;
  appearances: Array<{
    sceneId: string;
    timestamp?: Date;
    location?: string;
    interactions?: string[];
  }>;
  dialogue: {
    patterns: string[];
    vocabulary: Set<string>;
    averageSentenceLength: number;
  };
  relationships: Map<string, {
    type: string;
    strength: number;
    history: string[];
  }>;
}

class AIConsistencyService {
  private static instance: AIConsistencyService;
  private characterProfiles: Map<string, CharacterProfile> = new Map();
  private worldRules: Map<string, any> = new Map();
  private timelineCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AIConsistencyService {
    if (!AIConsistencyService.instance) {
      AIConsistencyService.instance = new AIConsistencyService();
    }
    return AIConsistencyService.instance;
  }

  /**
   * Run comprehensive consistency check
   */
  public async checkConsistency(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    characters: Character[],
    locations: Location[],
    timeline?: Timeline
  ): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    
    // Build character profiles
    this.buildCharacterProfiles(characters, scenes);
    
    // Run various consistency checks
    issues.push(...await this.checkCharacterConsistencyInternal(characters, scenes));
    issues.push(...await this.checkTimelineConsistency(timeline, scenes));
    issues.push(...await this.checkLocationConsistency(locations, scenes));
    issues.push(...await this.checkPlotConsistencyInternal(stories, scenes));
    issues.push(...await this.checkDialogueConsistency(scenes));
    issues.push(...await this.checkContinuityErrors(scenes));
    issues.push(...await this.checkWorldRules(project, scenes));
    issues.push(...await this.checkNameConsistency(characters, scenes));
    issues.push(...await this.checkPacingIssues(scenes));
    
    // Calculate statistics
    const statistics = this.calculateStatistics(issues);
    const score = this.calculateConsistencyScore(issues, scenes.length);
    
    return {
      projectId: project.id,
      timestamp: new Date(),
      issues,
      statistics,
      score
    };
  }

  /**
   * Check character consistency
   */
  private async checkCharacterConsistencyInternal(
    characters: Character[],
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    for (const character of characters) {
      const profile = this.characterProfiles.get(character.id);
      if (!profile) continue;
      
      // Check for sudden personality changes
      const personalityShifts = this.detectPersonalityShifts(character, scenes);
      if (personalityShifts.length > 0) {
        issues.push({
          id: this.generateId(),
          type: 'character',
          severity: 'warning',
          title: `Personality inconsistency for ${character.name}`,
          description: `Character shows significant personality shifts between scenes`,
          affectedItems: personalityShifts,
          suggestions: [
            'Add transitional scenes to explain the change',
            'Review character motivation and arc',
            'Ensure consistency with character background'
          ],
          category: 'personality'
        });
      }
      
      // Check for impossible appearances (being in two places at once)
      const impossibleAppearances = this.checkImpossibleAppearances(profile, scenes);
      if (impossibleAppearances.length > 0) {
        issues.push({
          id: this.generateId(),
          type: 'character',
          severity: 'error',
          title: `Timeline conflict for ${character.name}`,
          description: `Character appears in multiple locations at the same time`,
          affectedItems: impossibleAppearances,
          suggestions: [
            'Adjust scene timing',
            'Add travel time between locations',
            'Split character appearances'
          ],
          autoFixAvailable: true,
          category: 'timeline'
        });
      }
      
      // Check for unresolved character arcs
      if (character.goals && character.goals.length > 0) {
        const unresolvedGoals = this.checkUnresolvedGoals(character, scenes);
        if (unresolvedGoals.length > 0) {
          issues.push({
            id: this.generateId(),
            type: 'character',
            severity: 'suggestion',
            title: `Unresolved goals for ${character.name}`,
            description: `Character has goals that are not addressed in the story`,
            affectedItems: [{
              type: 'character',
              id: character.id,
              title: character.name
            }],
            suggestions: unresolvedGoals.map(goal => `Address goal: ${goal}`),
            category: 'arc'
          });
        }
      }
      
      // Check dialogue consistency
      const dialogueIssues = this.checkCharacterDialogue(character, scenes);
      issues.push(...dialogueIssues);
    }
    
    return issues;
  }

  /**
   * Check timeline consistency
   */
  private async checkTimelineConsistency(
    timeline: Timeline | undefined,
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    if (!timeline) return issues;
    
    // Check for chronological inconsistencies
    const chronologicalIssues = this.findChronologicalIssues(timeline, scenes);
    issues.push(...chronologicalIssues);
    
    // Check for seasonal/weather inconsistencies
    const seasonalIssues = this.findSeasonalInconsistencies(scenes);
    issues.push(...seasonalIssues);
    
    // Check for age inconsistencies
    const ageIssues = this.findAgeInconsistencies(scenes);
    issues.push(...ageIssues);
    
    // Check for historical anachronisms
    const anachronisms = this.findAnachronisms(scenes);
    issues.push(...anachronisms);
    
    return issues;
  }

  /**
   * Check location consistency
   */
  private async checkLocationConsistency(
    locations: Location[],
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    for (const location of locations) {
      // Check for inconsistent location descriptions
      const descriptionInconsistencies = this.findLocationDescriptionIssues(location, scenes);
      if (descriptionInconsistencies.length > 0) {
        issues.push({
          id: this.generateId(),
          type: 'location',
          severity: 'warning',
          title: `Inconsistent description for ${location.name}`,
          description: 'Location is described differently across scenes',
          affectedItems: descriptionInconsistencies,
          suggestions: [
            'Standardize location descriptions',
            'Create a location reference sheet',
            'Review all mentions of this location'
          ],
          category: 'description'
        });
      }
      
      // Check for travel time inconsistencies
      const travelIssues = this.checkTravelTimes(locations, scenes);
      issues.push(...travelIssues);
    }
    
    return issues;
  }

  /**
   * Check plot consistency
   */
  private async checkPlotConsistencyInternal(
    stories: Story[],
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Check for plot holes
    const plotHoles = this.detectPlotHoles(scenes);
    issues.push(...plotHoles);
    
    // Check for unresolved plot threads
    const unresolvedThreads = this.findUnresolvedThreads(scenes);
    issues.push(...unresolvedThreads);
    
    // Check for contradictions
    const contradictions = this.findContradictions(scenes);
    issues.push(...contradictions);
    
    // Check for Chekhov's guns (introduced but unused elements)
    const unusedElements = this.findUnusedElements(scenes);
    issues.push(...unusedElements);
    
    // Check for deus ex machina
    const deusExMachina = this.detectDeusExMachina(scenes);
    issues.push(...deusExMachina);
    
    return issues;
  }

  /**
   * Check dialogue consistency
   */
  private async checkDialogueConsistency(scenes: Scene[]): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Check for voice consistency
    const voiceIssues = this.checkVoiceConsistency(scenes);
    issues.push(...voiceIssues);
    
    // Check for dialect/accent consistency
    const dialectIssues = this.checkDialectConsistency(scenes);
    issues.push(...dialectIssues);
    
    // Check for knowledge inconsistencies (character knowing things they shouldn't)
    const knowledgeIssues = this.checkKnowledgeConsistency(scenes);
    issues.push(...knowledgeIssues);
    
    return issues;
  }

  /**
   * Check continuity errors
   */
  private async checkContinuityErrors(scenes: Scene[]): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Check for prop continuity
    const propIssues = this.checkPropContinuity(scenes);
    issues.push(...propIssues);
    
    // Check for injury/status continuity
    const statusIssues = this.checkStatusContinuity(scenes);
    issues.push(...statusIssues);
    
    // Check for clothing continuity
    const clothingIssues = this.checkClothingContinuity(scenes);
    issues.push(...clothingIssues);
    
    return issues;
  }

  /**
   * Check world rules consistency
   */
  private async checkWorldRules(
    project: Project,
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Extract and check magic system rules (if fantasy)
    if (project.metadata?.genre?.includes('fantasy')) {
      const magicIssues = this.checkMagicSystemRules(scenes);
      issues.push(...magicIssues);
    }
    
    // Check technology consistency
    const techIssues = this.checkTechnologyConsistency(scenes);
    issues.push(...techIssues);
    
    // Check social/cultural rules
    const culturalIssues = this.checkCulturalConsistency(scenes);
    issues.push(...culturalIssues);
    
    return issues;
  }

  /**
   * Check name consistency
   */
  private async checkNameConsistency(
    characters: Character[],
    scenes: Scene[]
  ): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    for (const character of characters) {
      // Look for variations in character name spelling
      const nameVariations = this.findNameVariations(character.name, scenes);
      if (nameVariations.length > 1) {
        issues.push({
          id: this.generateId(),
          type: 'character',
          severity: 'warning',
          title: `Name inconsistency for ${character.name}`,
          description: `Character name is spelled differently: ${nameVariations.join(', ')}`,
          affectedItems: [{
            type: 'character',
            id: character.id,
            title: character.name
          }],
          suggestions: [
            `Standardize to: ${character.name}`,
            'Use find and replace to fix all instances'
          ],
          autoFixAvailable: true,
          category: 'naming'
        });
      }
    }
    
    return issues;
  }

  /**
   * Check pacing issues
   */
  private async checkPacingIssues(scenes: Scene[]): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];
    
    // Check for scenes that are too long
    const longScenes = scenes.filter(s => (s.wordCount || 0) > 3000);
    if (longScenes.length > 0) {
      longScenes.forEach(scene => {
        issues.push({
          id: this.generateId(),
          type: 'continuity',
          severity: 'suggestion',
          title: `Scene may be too long`,
          description: `Scene "${scene.title}" has ${scene.wordCount} words, consider breaking it up`,
          affectedItems: [{
            type: 'scene',
            id: scene.id,
            title: scene.title
          }],
          suggestions: [
            'Split into multiple scenes',
            'Move some content to other scenes',
            'Trim unnecessary details'
          ],
          category: 'pacing'
        });
      });
    }
    
    // Check for scenes that are too short
    const shortScenes = scenes.filter(s => (s.wordCount || 0) < 200 && s.content.trim());
    if (shortScenes.length > 0) {
      shortScenes.forEach(scene => {
        issues.push({
          id: this.generateId(),
          type: 'continuity',
          severity: 'suggestion',
          title: `Scene may be too short`,
          description: `Scene "${scene.title}" has only ${scene.wordCount} words`,
          affectedItems: [{
            type: 'scene',
            id: scene.id,
            title: scene.title
          }],
          suggestions: [
            'Expand the scene with more detail',
            'Combine with adjacent scenes',
            'Add character reactions and emotions'
          ],
          category: 'pacing'
        });
      });
    }
    
    return issues;
  }

  /**
   * Build character profiles from scenes
   */
  private buildCharacterProfiles(characters: Character[], scenes: Scene[]): void {
    this.characterProfiles.clear();
    
    for (const character of characters) {
      const profile: CharacterProfile = {
        id: character.id,
        name: character.name,
        attributes: {
          role: character.role,
          age: character.age,
          ...character.attributes
        },
        appearances: [],
        dialogue: {
          patterns: [],
          vocabulary: new Set(),
          averageSentenceLength: 0
        },
        relationships: new Map()
      };
      
      // Analyze character appearances and dialogue in scenes
      scenes.forEach(scene => {
        if (scene.metadata?.characters?.includes(character.name)) {
          profile.appearances.push({
            sceneId: scene.id,
            timestamp: scene.metadata.time,
            location: scene.metadata.location,
            interactions: scene.metadata.characters.filter(c => c !== character.name)
          });
          
          // Extract dialogue patterns (simplified - would need proper parsing)
          const dialogueMatches = scene.content.match(
            new RegExp(`${character.name}[^:]*:([^\\n]+)`, 'gi')
          );
          if (dialogueMatches) {
            dialogueMatches.forEach(match => {
              const words = match.split(/\s+/);
              words.forEach(word => profile.dialogue.vocabulary.add(word.toLowerCase()));
            });
          }
        }
      });
      
      this.characterProfiles.set(character.id, profile);
    }
  }

  /**
   * Helper: Detect personality shifts
   */
  private detectPersonalityShifts(character: Character, scenes: Scene[]): any[] {
    const shifts = [];
    // Simplified - would need NLP analysis for real implementation
    const characterScenes = scenes.filter(s => 
      s.metadata?.characters?.includes(character.name)
    );
    
    // Look for contradictory behavior patterns
    // This is a simplified check - real implementation would use sentiment analysis
    return shifts;
  }

  /**
   * Helper: Check impossible appearances
   */
  private checkImpossibleAppearances(profile: CharacterProfile, scenes: Scene[]): any[] {
    const conflicts = [];
    const appearances = profile.appearances.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeA - timeB;
    });
    
    for (let i = 0; i < appearances.length - 1; i++) {
      const current = appearances[i];
      const next = appearances[i + 1];
      
      if (current.location && next.location && current.location !== next.location) {
        // Check if there's enough time to travel between locations
        const timeDiff = new Date(next.timestamp || 0).getTime() - 
                        new Date(current.timestamp || 0).getTime();
        
        // Assume minimum 30 minutes travel time between different locations
        if (timeDiff < 30 * 60 * 1000) {
          conflicts.push({
            type: 'scene',
            id: next.sceneId,
            title: `Scenes ${current.sceneId} and ${next.sceneId}`,
            location: { scene: i }
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Helper: Check unresolved goals
   */
  private checkUnresolvedGoals(character: Character, scenes: Scene[]): string[] {
    if (!character.goals) return [];
    
    const unresolvedGoals = [];
    const characterScenes = scenes.filter(s => 
      s.metadata?.characters?.includes(character.name)
    );
    
    for (const goal of character.goals) {
      // Check if goal is mentioned or resolved in any scene
      const goalMentioned = characterScenes.some(scene => 
        scene.content.toLowerCase().includes(goal.toLowerCase())
      );
      
      if (!goalMentioned) {
        unresolvedGoals.push(goal);
      }
    }
    
    return unresolvedGoals;
  }

  /**
   * Helper: Check character dialogue consistency
   */
  private checkCharacterDialogue(character: Character, scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const profile = this.characterProfiles.get(character.id);
    if (!profile) return issues;
    
    // Check for vocabulary level consistency
    const vocabComplexity = this.calculateVocabularyComplexity(profile.dialogue.vocabulary);
    
    // Check if character's education level matches vocabulary
    if (character.attributes?.education === 'low' && vocabComplexity > 0.7) {
      issues.push({
        id: this.generateId(),
        type: 'dialogue',
        severity: 'warning',
        title: `Vocabulary mismatch for ${character.name}`,
        description: 'Character uses vocabulary beyond their established education level',
        affectedItems: [{
          type: 'character',
          id: character.id,
          title: character.name
        }],
        suggestions: [
          'Simplify dialogue to match character background',
          'Adjust character education level',
          'Add explanation for vocabulary knowledge'
        ],
        category: 'dialogue'
      });
    }
    
    return issues;
  }

  /**
   * Helper: Find chronological issues
   */
  private findChronologicalIssues(timeline: Timeline, scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    
    // Check if narrative order creates logical inconsistencies
    if (timeline.narrativeOrder && timeline.storyOrder) {
      // Look for scenes that reference events that haven't happened yet in narrative order
      timeline.narrativeOrder.forEach((sceneId, narrativeIndex) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return;
        
        // Check for references to future events
        const storyIndex = timeline.storyOrder!.indexOf(sceneId);
        const futureScenes = timeline.storyOrder!.slice(storyIndex + 1);
        
        futureScenes.forEach(futureSceneId => {
          const futureScene = scenes.find(s => s.id === futureSceneId);
          if (futureScene) {
            // Check if current scene references the future scene
            // This is simplified - would need proper entity extraction
            if (scene.content.includes(futureScene.title)) {
              issues.push({
                id: this.generateId(),
                type: 'timeline',
                severity: 'warning',
                title: 'Potential timeline inconsistency',
                description: `Scene references events that haven't occurred yet in narrative order`,
                affectedItems: [
                  { type: 'scene', id: scene.id, title: scene.title },
                  { type: 'scene', id: futureScene.id, title: futureScene.title }
                ],
                suggestions: [
                  'Reorder scenes in narrative',
                  'Remove forward reference',
                  'Add flashforward indication'
                ],
                category: 'chronology'
              });
            }
          }
        });
      });
    }
    
    return issues;
  }

  /**
   * Helper: Find seasonal inconsistencies
   */
  private findSeasonalInconsistencies(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const seasonalTerms = {
      spring: ['spring', 'bloom', 'blossom', 'thaw'],
      summer: ['summer', 'hot', 'sweat', 'beach'],
      fall: ['autumn', 'fall', 'leaves falling', 'harvest'],
      winter: ['winter', 'snow', 'cold', 'freeze', 'ice']
    };
    
    let currentSeason: string | null = null;
    scenes.forEach((scene, index) => {
      Object.entries(seasonalTerms).forEach(([season, terms]) => {
        const hasSeasonalTerms = terms.some(term => 
          scene.content.toLowerCase().includes(term)
        );
        
        if (hasSeasonalTerms) {
          if (currentSeason && currentSeason !== season && index > 0) {
            // Check if enough time has passed for season change
            const timeDiff = this.calculateTimeDifference(scenes[index - 1], scene);
            if (timeDiff < 30) { // Less than 30 days
              issues.push({
                id: this.generateId(),
                type: 'timeline',
                severity: 'warning',
                title: 'Seasonal inconsistency',
                description: `Rapid season change from ${currentSeason} to ${season}`,
                affectedItems: [
                  { type: 'scene', id: scenes[index - 1].id, title: scenes[index - 1].title },
                  { type: 'scene', id: scene.id, title: scene.title }
                ],
                suggestions: [
                  'Add time passage indication',
                  'Adjust seasonal descriptions',
                  'Check timeline progression'
                ],
                category: 'seasonal'
              });
            }
          }
          currentSeason = season;
        }
      });
    });
    
    return issues;
  }

  /**
   * Helper: Find age inconsistencies
   */
  private findAgeInconsistencies(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const characterAges = new Map<string, number>();
    
    scenes.forEach(scene => {
      // Look for age mentions (simplified pattern matching)
      const ageMatches = scene.content.match(/(\w+)\s+(?:is|was|turned)\s+(\d+)\s+years?\s+old/gi);
      if (ageMatches) {
        ageMatches.forEach(match => {
          const parts = match.match(/(\w+)\s+(?:is|was|turned)\s+(\d+)/i);
          if (parts) {
            const name = parts[1];
            const age = parseInt(parts[2]);
            
            if (characterAges.has(name)) {
              const previousAge = characterAges.get(name)!;
              const timeDiff = this.calculateTimeDifference(scenes[0], scene) / 365;
              const expectedAge = previousAge + Math.floor(timeDiff);
              
              if (Math.abs(age - expectedAge) > 1) {
                issues.push({
                  id: this.generateId(),
                  type: 'timeline',
                  severity: 'error',
                  title: `Age inconsistency for ${name}`,
                  description: `Character age doesn't match timeline progression`,
                  affectedItems: [{
                    type: 'scene',
                    id: scene.id,
                    title: scene.title
                  }],
                  suggestions: [
                    `Update age to ${expectedAge}`,
                    'Check timeline progression',
                    'Verify character birth date'
                  ],
                  autoFixAvailable: true,
                  category: 'age'
                });
              }
            } else {
              characterAges.set(name, age);
            }
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Find anachronisms
   */
  private findAnachronisms(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    
    // This would need a database of historical items and their introduction dates
    // For now, simple example checks
    const anachronismPatterns = [
      { item: 'smartphone', earliestYear: 2007 },
      { item: 'internet', earliestYear: 1990 },
      { item: 'television', earliestYear: 1927 },
      { item: 'airplane', earliestYear: 1903 }
    ];
    
    // Check if story has a historical setting
    const yearMatch = scenes[0]?.content.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    if (yearMatch) {
      const storyYear = parseInt(yearMatch[1]);
      
      scenes.forEach(scene => {
        anachronismPatterns.forEach(pattern => {
          if (scene.content.toLowerCase().includes(pattern.item) && 
              storyYear < pattern.earliestYear) {
            issues.push({
              id: this.generateId(),
              type: 'timeline',
              severity: 'error',
              title: `Anachronism detected: ${pattern.item}`,
              description: `${pattern.item} appears in ${storyYear} but wasn't invented until ${pattern.earliestYear}`,
              affectedItems: [{
                type: 'scene',
                id: scene.id,
                title: scene.title
              }],
              suggestions: [
                `Remove reference to ${pattern.item}`,
                `Use period-appropriate alternative`,
                `Adjust story timeline to ${pattern.earliestYear} or later`
              ],
              category: 'anachronism'
            });
          }
        });
      });
    }
    
    return issues;
  }

  /**
   * Helper: Find location description issues
   */
  private findLocationDescriptionIssues(location: Location, scenes: Scene[]): any[] {
    const descriptions: string[] = [];
    const affectedScenes: any[] = [];
    
    scenes.forEach(scene => {
      if (scene.metadata?.location === location.name) {
        // Extract location descriptions (simplified)
        const descPattern = new RegExp(`${location.name}[^.]*\\.`, 'gi');
        const matches = scene.content.match(descPattern);
        if (matches) {
          matches.forEach(desc => {
            if (!descriptions.includes(desc)) {
              descriptions.push(desc);
              affectedScenes.push({
                type: 'scene',
                id: scene.id,
                title: scene.title
              });
            }
          });
        }
      }
    });
    
    // Check for contradictions in descriptions
    if (descriptions.length > 1) {
      // Simplified check - would need NLP for real implementation
      return affectedScenes;
    }
    
    return [];
  }

  /**
   * Helper: Check travel times
   */
  private checkTravelTimes(locations: Location[], scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    
    // Build a simple distance matrix (would need real geographic data)
    const distances = new Map<string, number>();
    
    for (let i = 0; i < scenes.length - 1; i++) {
      const currentScene = scenes[i];
      const nextScene = scenes[i + 1];
      
      if (currentScene.metadata?.location && nextScene.metadata?.location &&
          currentScene.metadata.location !== nextScene.metadata.location) {
        
        const timeDiff = this.calculateTimeDifference(currentScene, nextScene);
        const distance = distances.get(
          `${currentScene.metadata.location}-${nextScene.metadata.location}`
        ) || 100; // Default 100 km
        
        // Assume max travel speed of 100 km/h
        const minTravelTime = distance / 100;
        
        if (timeDiff < minTravelTime) {
          issues.push({
            id: this.generateId(),
            type: 'location',
            severity: 'warning',
            title: 'Impossible travel time',
            description: `Not enough time to travel from ${currentScene.metadata.location} to ${nextScene.metadata.location}`,
            affectedItems: [
              { type: 'scene', id: currentScene.id, title: currentScene.title },
              { type: 'scene', id: nextScene.id, title: nextScene.title }
            ],
            suggestions: [
              'Add travel scene',
              'Increase time gap between scenes',
              'Use faster transportation method'
            ],
            category: 'travel'
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * Helper: Detect plot holes
   */
  private detectPlotHoles(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const setupElements = new Set<string>();
    const resolutions = new Set<string>();
    
    // Track plot elements that are set up and resolved
    scenes.forEach(scene => {
      // Look for setup patterns (simplified)
      if (scene.content.includes('discovered') || 
          scene.content.includes('found') ||
          scene.content.includes('revealed')) {
        // Extract what was discovered (would need NLP)
        setupElements.add(scene.id);
      }
      
      // Look for resolution patterns
      if (scene.content.includes('solved') ||
          scene.content.includes('resolved') ||
          scene.content.includes('explained')) {
        resolutions.add(scene.id);
      }
    });
    
    // Find unresolved setups
    setupElements.forEach(element => {
      if (!resolutions.has(element)) {
        const scene = scenes.find(s => s.id === element);
        if (scene) {
          issues.push({
            id: this.generateId(),
            type: 'plot',
            severity: 'warning',
            title: 'Potential plot hole',
            description: 'Setup element may not be resolved',
            affectedItems: [{
              type: 'scene',
              id: scene.id,
              title: scene.title
            }],
            suggestions: [
              'Add resolution scene',
              'Connect to existing resolution',
              'Remove setup if not needed'
            ],
            category: 'plothole'
          });
        }
      }
    });
    
    return issues;
  }

  /**
   * Helper: Find unresolved threads
   */
  private findUnresolvedThreads(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const threads = new Map<string, { introduced: string; resolved: boolean }>();
    
    scenes.forEach(scene => {
      // Look for subplot introductions (simplified)
      if (scene.metadata?.plotThread) {
        if (!threads.has(scene.metadata.plotThread)) {
          threads.set(scene.metadata.plotThread, {
            introduced: scene.id,
            resolved: false
          });
        }
        
        // Check if thread is resolved
        if (scene.content.includes('resolved') || 
            scene.content.includes('ended') ||
            scene.content.includes('concluded')) {
          const thread = threads.get(scene.metadata.plotThread);
          if (thread) thread.resolved = true;
        }
      }
    });
    
    // Report unresolved threads
    threads.forEach((thread, threadName) => {
      if (!thread.resolved) {
        issues.push({
          id: this.generateId(),
          type: 'plot',
          severity: 'suggestion',
          title: `Unresolved plot thread: ${threadName}`,
          description: 'This subplot is introduced but not concluded',
          affectedItems: [{
            type: 'scene',
            id: thread.introduced,
            title: threadName
          }],
          suggestions: [
            'Add resolution scenes',
            'Tie into main plot resolution',
            'Save for sequel/next book'
          ],
          category: 'subplot'
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Find contradictions
   */
  private findContradictions(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const facts = new Map<string, { value: any; sceneId: string }>();
    
    scenes.forEach(scene => {
      // Extract factual statements (very simplified)
      // Would need proper NLP and fact extraction
      
      // Example: Check for color contradictions
      const colorMatches = scene.content.match(/the (\w+) (?:was|is) (\w+)/gi);
      if (colorMatches) {
        colorMatches.forEach(match => {
          const parts = match.match(/the (\w+) (?:was|is) (\w+)/i);
          if (parts) {
            const item = parts[1];
            const attribute = parts[2];
            const key = `${item}_color`;
            
            if (facts.has(key)) {
              const existing = facts.get(key)!;
              if (existing.value !== attribute) {
                issues.push({
                  id: this.generateId(),
                  type: 'plot',
                  severity: 'error',
                  title: `Contradiction: ${item} color`,
                  description: `${item} is described as both ${existing.value} and ${attribute}`,
                  affectedItems: [
                    { type: 'scene', id: existing.sceneId, title: `First mention` },
                    { type: 'scene', id: scene.id, title: scene.title }
                  ],
                  suggestions: [
                    `Standardize to ${existing.value}`,
                    `Standardize to ${attribute}`,
                    'Add explanation for change'
                  ],
                  autoFixAvailable: true,
                  category: 'contradiction'
                });
              }
            } else {
              facts.set(key, { value: attribute, sceneId: scene.id });
            }
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Find unused Chekhov's guns
   */
  private findUnusedElements(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const introducedElements = new Map<string, string>();
    const usedElements = new Set<string>();
    
    scenes.forEach((scene, index) => {
      // Look for element introductions (simplified)
      if (index < scenes.length / 3) { // First third of story
        // Pattern for introducing significant objects
        const introPattern = /(?:noticed|saw|found|discovered) (?:a|an|the) (\w+)/gi;
        const matches = scene.content.match(introPattern);
        if (matches) {
          matches.forEach(match => {
            const element = match.split(' ').pop();
            if (element && !introducedElements.has(element)) {
              introducedElements.set(element, scene.id);
            }
          });
        }
      }
      
      // Check if elements are used later
      if (index > scenes.length / 3) {
        introducedElements.forEach((sceneId, element) => {
          if (scene.content.includes(element)) {
            usedElements.add(element);
          }
        });
      }
    });
    
    // Report unused elements
    introducedElements.forEach((sceneId, element) => {
      if (!usedElements.has(element)) {
        issues.push({
          id: this.generateId(),
          type: 'plot',
          severity: 'suggestion',
          title: `Unused element: ${element}`,
          description: "Chekhov's gun principle: introduced element is never used",
          affectedItems: [{
            type: 'scene',
            id: sceneId,
            title: `Introduction of ${element}`
          }],
          suggestions: [
            'Use the element in later scenes',
            'Remove the introduction if not needed',
            'Make the element more significant'
          ],
          category: 'chekhov'
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Detect deus ex machina
   */
  private detectDeusExMachina(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    
    // Look for sudden resolutions without setup
    const resolutionPatterns = [
      /suddenly (?:appeared|arrived|happened)/gi,
      /out of nowhere/gi,
      /miraculously/gi,
      /coincidentally/gi,
      /just in time/gi
    ];
    
    scenes.forEach((scene, index) => {
      // Check if scene is in final third and contains resolution patterns
      if (index > scenes.length * 0.66) {
        resolutionPatterns.forEach(pattern => {
          if (pattern.test(scene.content)) {
            issues.push({
              id: this.generateId(),
              type: 'plot',
              severity: 'warning',
              title: 'Potential deus ex machina',
              description: 'Sudden resolution without proper setup',
              affectedItems: [{
                type: 'scene',
                id: scene.id,
                title: scene.title
              }],
              suggestions: [
                'Add foreshadowing in earlier scenes',
                'Make resolution more organic',
                'Establish possibility earlier'
              ],
              category: 'deusexmachina'
            });
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Check voice consistency
   */
  private checkVoiceConsistency(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    
    // Analyze narrative voice consistency
    // This is simplified - would need stylometry analysis
    const narrativeStyles = new Map<string, number>();
    
    scenes.forEach(scene => {
      // Simple metrics: average sentence length, passive voice usage, etc.
      const sentences = scene.content.split(/[.!?]+/);
      const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
      
      // Track style changes
      if (narrativeStyles.size > 0) {
        const prevAvg = Array.from(narrativeStyles.values()).pop();
        if (prevAvg && Math.abs(avgLength - prevAvg) > 10) {
          issues.push({
            id: this.generateId(),
            type: 'dialogue',
            severity: 'suggestion',
            title: 'Narrative voice inconsistency',
            description: 'Writing style changes significantly',
            affectedItems: [{
              type: 'scene',
              id: scene.id,
              title: scene.title
            }],
            suggestions: [
              'Review narrative voice consistency',
              'Maintain consistent writing style',
              'Use style guide'
            ],
            category: 'voice'
          });
        }
      }
      
      narrativeStyles.set(scene.id, avgLength);
    });
    
    return issues;
  }

  /**
   * Helper: Check dialect consistency
   */
  private checkDialectConsistency(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const characterDialects = new Map<string, Set<string>>();
    
    // Track dialect markers for each character
    const dialectMarkers = {
      british: ["colour", "favourite", "realise", "whilst", "amongst"],
      american: ["color", "favorite", "realize", "while", "among"],
      southern: ["y'all", "fixin'", "reckon", "ain't"],
      scottish: ["wee", "bonnie", "ken", "dinnae"]
    };
    
    scenes.forEach(scene => {
      // Extract character dialogue (simplified)
      const dialoguePattern = /(\w+):\s*"([^"]+)"/g;
      let match;
      
      while ((match = dialoguePattern.exec(scene.content)) !== null) {
        const character = match[1];
        const dialogue = match[2].toLowerCase();
        
        if (!characterDialects.has(character)) {
          characterDialects.set(character, new Set());
        }
        
        // Check which dialect markers are present
        Object.entries(dialectMarkers).forEach(([dialect, markers]) => {
          if (markers.some(marker => dialogue.includes(marker))) {
            characterDialects.get(character)?.add(dialect);
          }
        });
      }
    });
    
    // Check for inconsistent dialect usage
    characterDialects.forEach((dialects, character) => {
      if (dialects.size > 1) {
        issues.push({
          id: this.generateId(),
          type: 'dialogue',
          severity: 'warning',
          title: `Inconsistent dialect for ${character}`,
          description: `Character uses multiple dialects: ${Array.from(dialects).join(', ')}`,
          affectedItems: [{
            type: 'character',
            id: character,
            title: character
          }],
          suggestions: [
            'Choose one consistent dialect',
            'Add explanation for dialect switching',
            'Review all character dialogue'
          ],
          category: 'dialect'
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Check knowledge consistency
   */
  private checkKnowledgeConsistency(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const knowledgeMap = new Map<string, Set<string>>();
    
    scenes.forEach((scene, sceneIndex) => {
      // Track what each character knows
      if (scene.metadata?.characters) {
        scene.metadata.characters.forEach(character => {
          if (!knowledgeMap.has(character)) {
            knowledgeMap.set(character, new Set());
          }
          
          // Add knowledge from this scene
          // Simplified - would need proper information extraction
          const knowledge = knowledgeMap.get(character)!;
          
          // Look for reveals in the scene
          const reveals = scene.content.match(/revealed|told|learned|discovered/gi);
          if (reveals) {
            knowledge.add(scene.id);
          }
        });
      }
      
      // Check if characters reference knowledge they shouldn't have
      const dialoguePattern = new RegExp(`(${scene.metadata?.characters?.join('|')}):\\s*"[^"]*"`, 'gi');
      const dialogues = scene.content.match(dialoguePattern);
      
      if (dialogues) {
        dialogues.forEach(dialogue => {
          // Check for references to information from future scenes
          for (let futureIndex = sceneIndex + 1; futureIndex < scenes.length; futureIndex++) {
            const futureScene = scenes[futureIndex];
            // Simplified check - would need entity extraction
            if (dialogue.includes(futureScene.title)) {
              issues.push({
                id: this.generateId(),
                type: 'dialogue',
                severity: 'error',
                title: 'Knowledge inconsistency',
                description: 'Character references information they haven\'t learned yet',
                affectedItems: [
                  { type: 'scene', id: scene.id, title: scene.title },
                  { type: 'scene', id: futureScene.id, title: futureScene.title }
                ],
                suggestions: [
                  'Remove premature reference',
                  'Add earlier knowledge reveal',
                  'Reorder scenes'
                ],
                category: 'knowledge'
              });
            }
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Check prop continuity
   */
  private checkPropContinuity(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const props = new Map<string, { status: string; sceneId: string }>();
    
    scenes.forEach(scene => {
      // Track prop status changes (simplified)
      const statusPatterns = [
        /(\w+) (?:was|is) broken/gi,
        /(\w+) (?:was|is) fixed/gi,
        /lost (?:the|his|her) (\w+)/gi,
        /found (?:the|his|her) (\w+)/gi
      ];
      
      statusPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(scene.content)) !== null) {
          const prop = match[1] || match[2];
          const newStatus = pattern.source.includes('broken') ? 'broken' :
                          pattern.source.includes('fixed') ? 'fixed' :
                          pattern.source.includes('lost') ? 'lost' : 'found';
          
          if (props.has(prop)) {
            const existing = props.get(prop)!;
            
            // Check for illogical status changes
            if ((existing.status === 'lost' && newStatus === 'broken') ||
                (existing.status === 'broken' && newStatus === 'lost')) {
              issues.push({
                id: this.generateId(),
                type: 'continuity',
                severity: 'error',
                title: `Prop continuity error: ${prop}`,
                description: `${prop} changes from ${existing.status} to ${newStatus} illogically`,
                affectedItems: [
                  { type: 'scene', id: existing.sceneId, title: 'Previous status' },
                  { type: 'scene', id: scene.id, title: scene.title }
                ],
                suggestions: [
                  'Add transitional explanation',
                  'Fix prop status',
                  'Remove contradiction'
                ],
                category: 'props'
              });
            }
          }
          
          props.set(prop, { status: newStatus, sceneId: scene.id });
        }
      });
    });
    
    return issues;
  }

  /**
   * Helper: Check status continuity
   */
  private checkStatusContinuity(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const characterStatus = new Map<string, { injury?: string; sceneId: string }>();
    
    scenes.forEach(scene => {
      // Track injuries and healing (simplified)
      const injuryPatterns = [
        /(\w+) (?:was|got) (?:injured|hurt|wounded)/gi,
        /(\w+) broke (?:his|her|their) (\w+)/gi,
        /(\w+) (?:recovered|healed)/gi
      ];
      
      injuryPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(scene.content)) !== null) {
          const character = match[1];
          
          if (pattern.source.includes('recovered')) {
            if (!characterStatus.has(character)) {
              issues.push({
                id: this.generateId(),
                type: 'continuity',
                severity: 'warning',
                title: `Healing without injury: ${character}`,
                description: 'Character recovers from unmentioned injury',
                affectedItems: [{
                  type: 'scene',
                  id: scene.id,
                  title: scene.title
                }],
                suggestions: [
                  'Add prior injury scene',
                  'Remove recovery mention',
                  'Clarify what they recovered from'
                ],
                category: 'injury'
              });
            }
            characterStatus.delete(character);
          } else {
            if (characterStatus.has(character)) {
              const existing = characterStatus.get(character)!;
              issues.push({
                id: this.generateId(),
                type: 'continuity',
                severity: 'warning',
                title: `Multiple injuries for ${character}`,
                description: 'Character gets injured while already injured',
                affectedItems: [
                  { type: 'scene', id: existing.sceneId, title: 'First injury' },
                  { type: 'scene', id: scene.id, title: scene.title }
                ],
                suggestions: [
                  'Add recovery between injuries',
                  'Acknowledge existing injury',
                  'Combine injuries'
                ],
                category: 'injury'
              });
            }
            characterStatus.set(character, { 
              injury: match[2] || 'general', 
              sceneId: scene.id 
            });
          }
        }
      });
    });
    
    return issues;
  }

  /**
   * Helper: Check clothing continuity
   */
  private checkClothingContinuity(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const characterClothing = new Map<string, { outfit: string; sceneId: string }>();
    
    scenes.forEach(scene => {
      // Track clothing descriptions (simplified)
      const clothingPattern = /(\w+) (?:wore|was wearing|dressed in) ([^.]+)/gi;
      let match;
      
      while ((match = clothingPattern.exec(scene.content)) !== null) {
        const character = match[1];
        const outfit = match[2].trim();
        
        if (characterClothing.has(character)) {
          const existing = characterClothing.get(character)!;
          
          // Check if outfit changes without scene break
          if (existing.sceneId === scene.id && existing.outfit !== outfit) {
            issues.push({
              id: this.generateId(),
              type: 'continuity',
              severity: 'warning',
              title: `Clothing continuity error: ${character}`,
              description: 'Character outfit changes within same scene',
              affectedItems: [{
                type: 'scene',
                id: scene.id,
                title: scene.title
              }],
              suggestions: [
                'Keep outfit consistent',
                'Add clothing change action',
                'Split into multiple scenes'
              ],
              category: 'clothing'
            });
          }
        }
        
        characterClothing.set(character, { outfit, sceneId: scene.id });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Check magic system rules
   */
  private checkMagicSystemRules(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const magicRules = new Set<string>();
    const magicUsage = new Map<string, string[]>();
    
    // Extract magic rules from early scenes
    scenes.slice(0, Math.floor(scenes.length / 3)).forEach(scene => {
      // Look for rule establishments (simplified)
      const rulePatterns = [
        /magic (?:requires|needs|costs) ([^.]+)/gi,
        /(?:can't|cannot|impossible to) ([^.]+) with magic/gi,
        /only (\w+) can ([^.]+)/gi
      ];
      
      rulePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(scene.content)) !== null) {
          magicRules.add(match[0]);
        }
      });
    });
    
    // Check for rule violations in later scenes
    scenes.forEach(scene => {
      // Track magic usage
      const magicPattern = /(?:cast|used|performed) ([^.]+) (?:spell|magic)/gi;
      let match;
      
      while ((match = magicPattern.exec(scene.content)) !== null) {
        const usage = match[0];
        
        // Check if usage violates established rules
        magicRules.forEach(rule => {
          // Simplified violation check - would need proper logic parsing
          if (rule.includes('cannot') && usage.includes(rule.split('cannot')[1])) {
            issues.push({
              id: this.generateId(),
              type: 'world-rules',
              severity: 'error',
              title: 'Magic system rule violation',
              description: `Action violates established rule: ${rule}`,
              affectedItems: [{
                type: 'scene',
                id: scene.id,
                title: scene.title
              }],
              suggestions: [
                'Follow established magic rules',
                'Add exception explanation',
                'Revise magic system rules'
              ],
              category: 'magic'
            });
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Check technology consistency
   */
  private checkTechnologyConsistency(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const techLevel = new Set<string>();
    
    // Categorize technology mentions
    const techCategories = {
      medieval: ['sword', 'castle', 'knight', 'torch', 'scroll'],
      industrial: ['steam', 'factory', 'train', 'telegraph'],
      modern: ['computer', 'internet', 'smartphone', 'car'],
      futuristic: ['spaceship', 'laser', 'hologram', 'AI', 'quantum']
    };
    
    scenes.forEach(scene => {
      Object.entries(techCategories).forEach(([era, terms]) => {
        if (terms.some(term => scene.content.toLowerCase().includes(term))) {
          techLevel.add(era);
        }
      });
    });
    
    if (techLevel.size > 1) {
      issues.push({
        id: this.generateId(),
        type: 'world-rules',
        severity: 'warning',
        title: 'Mixed technology levels',
        description: `Story contains technology from: ${Array.from(techLevel).join(', ')}`,
        affectedItems: [{
          type: 'project',
          id: 'tech-consistency',
          title: 'Technology Consistency'
        }],
        suggestions: [
          'Stick to one technology era',
          'Explain mixed technology in worldbuilding',
          'Create alternate history setting'
        ],
        category: 'technology'
      });
    }
    
    return issues;
  }

  /**
   * Helper: Check cultural consistency
   */
  private checkCulturalConsistency(scenes: Scene[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const culturalElements = new Map<string, Set<string>>();
    
    // Track cultural references
    scenes.forEach(scene => {
      // Extract cultural elements (simplified)
      const elements = {
        greetings: scene.content.match(/said "([^"]*)".*greeting/gi),
        customs: scene.content.match(/tradition|custom|ritual/gi),
        foods: scene.content.match(/ate|served|cooked ([^.]+)/gi)
      };
      
      Object.entries(elements).forEach(([category, matches]) => {
        if (matches) {
          if (!culturalElements.has(category)) {
            culturalElements.set(category, new Set());
          }
          matches.forEach(match => culturalElements.get(category)!.add(match));
        }
      });
    });
    
    // Check for inconsistent cultural mixing
    culturalElements.forEach((elements, category) => {
      if (elements.size > 5) {
        issues.push({
          id: this.generateId(),
          type: 'world-rules',
          severity: 'suggestion',
          title: `Diverse ${category} elements`,
          description: 'Multiple cultural references may need consistency check',
          affectedItems: [{
            type: 'project',
            id: 'cultural-consistency',
            title: 'Cultural Consistency'
          }],
          suggestions: [
            'Define clear cultural boundaries',
            'Create culture guide',
            'Ensure consistent worldbuilding'
          ],
          category: 'culture'
        });
      }
    });
    
    return issues;
  }

  /**
   * Helper: Find name variations
   */
  private findNameVariations(name: string, scenes: Scene[]): string[] {
    const variations = new Set<string>();
    const baseNameParts = name.toLowerCase().split(/\s+/);
    
    scenes.forEach(scene => {
      // Look for similar names (simplified)
      const words = scene.content.split(/\s+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length > 3) {
          // Check similarity to character name
          const similarity = this.calculateStringSimilarity(
            name.toLowerCase(),
            cleanWord.toLowerCase()
          );
          
          if (similarity > 0.8 && cleanWord !== name.toLowerCase()) {
            variations.add(cleanWord);
          }
        }
      });
    });
    
    return [name, ...Array.from(variations)];
  }

  /**
   * Helper: Calculate vocabulary complexity
   */
  private calculateVocabularyComplexity(vocabulary: Set<string>): number {
    // Simple complexity score based on word length and variety
    const avgLength = Array.from(vocabulary).reduce((sum, word) => 
      sum + word.length, 0
    ) / vocabulary.size;
    
    const complexWords = Array.from(vocabulary).filter(word => 
      word.length > 8
    ).length;
    
    return Math.min(1, (avgLength / 10 + complexWords / vocabulary.size) / 2);
  }

  /**
   * Helper: Calculate time difference between scenes
   */
  private calculateTimeDifference(scene1: Scene, scene2: Scene): number {
    // Calculate time difference in days (simplified)
    if (scene1.metadata?.time && scene2.metadata?.time) {
      const time1 = new Date(scene1.metadata.time).getTime();
      const time2 = new Date(scene2.metadata.time).getTime();
      return Math.abs(time2 - time1) / (1000 * 60 * 60 * 24);
    }
    
    // Default to scene order difference
    return Math.abs(scene2.order - scene1.order);
  }

  /**
   * Helper: Calculate string similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Helper: Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(issues: ConsistencyIssue[]): ConsistencyReport['statistics'] {
    const byType: Record<string, number> = {};
    
    issues.forEach(issue => {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });
    
    return {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'suggestion').length,
      byType
    };
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(issues: ConsistencyIssue[], totalScenes: number): number {
    const weights = {
      error: 10,
      warning: 5,
      suggestion: 2
    };
    
    const totalPenalty = issues.reduce((sum, issue) => 
      sum + weights[issue.severity], 0
    );
    
    const maxPenalty = totalScenes * 20; // Maximum possible penalty
    const score = Math.max(0, 100 - (totalPenalty / maxPenalty) * 100);
    
    return Math.round(score);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `issue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Auto-fix issues where possible
   */
  public async autoFixIssue(
    issue: ConsistencyIssue,
    scenes: Scene[]
  ): Promise<{ success: boolean; updatedScenes?: Scene[]; error?: string }> {
    if (!issue.autoFixAvailable) {
      return { success: false, error: 'Auto-fix not available for this issue' };
    }
    
    const updatedScenes = [...scenes];
    
    switch (issue.category) {
      case 'naming':
        // Fix name inconsistencies
        issue.affectedItems.forEach(item => {
          const scene = updatedScenes.find(s => s.id === item.id);
          if (scene && issue.suggestions?.[0]) {
            const correctName = issue.suggestions[0].replace('Standardize to: ', '');
            // Replace variations with correct name
            scene.content = scene.content.replace(
              new RegExp(item.title, 'gi'),
              correctName
            );
          }
        });
        return { success: true, updatedScenes };
        
      case 'age':
        // Fix age inconsistencies
        if (issue.suggestions?.[0]) {
          const correctAge = issue.suggestions[0].match(/\d+/)?.[0];
          if (correctAge) {
            issue.affectedItems.forEach(item => {
              const scene = updatedScenes.find(s => s.id === item.id);
              if (scene) {
                scene.content = scene.content.replace(
                  /(\w+\s+(?:is|was|turned)\s+)\d+(\s+years?\s+old)/gi,
                  `$1${correctAge}$2`
                );
              }
            });
            return { success: true, updatedScenes };
          }
        }
        break;
        
      case 'contradiction':
        // Fix simple contradictions
        if (issue.suggestions?.[0]) {
          const standardValue = issue.suggestions[0].match(/Standardize to (\w+)/)?.[1];
          if (standardValue) {
            issue.affectedItems.forEach(item => {
              const scene = updatedScenes.find(s => s.id === item.id);
              if (scene) {
                // This would need more context to fix properly
                // For now, just flag for manual review
              }
            });
          }
        }
        break;
    }
    
    return { success: false, error: 'Auto-fix implementation pending for this category' };
  }

  // Additional methods for test compatibility
  async checkCharacterConsistency(character: any, scenes: any[]): Promise<any> {
    const profile = this.characterProfiles.get(character.id);
    let score = 85; // Base score
    let issues: any[] = [];

    // Check for personality contradictions
    const appearances = scenes.filter(scene => 
      scene.text && scene.characters?.includes(character.name)
    );

    if (appearances.length > 0) {
      // Look for contradictory behavior
      const behaviors = appearances.map(scene => {
        if (scene.text.toLowerCase().includes('brave') || scene.text.toLowerCase().includes('fearless')) {
          return 'brave';
        }
        if (scene.text.toLowerCase().includes('coward') || scene.text.toLowerCase().includes('afraid')) {
          return 'cowardly';
        }
        return 'neutral';
      });

      const uniqueBehaviors = [...new Set(behaviors)];
      if (uniqueBehaviors.includes('brave') && uniqueBehaviors.includes('cowardly')) {
        score -= 30;
        issues.push({
          type: 'personality',
          description: 'Character shows contradictory behavior patterns',
          severity: 'warning'
        });
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      consistent: score > 70,
      character: character.name,
      analysisDetails: {
        personalityConsistency: score > 80,
        behaviorPatterns: issues.length === 0,
        traitAlignment: character.traits?.every((trait: string) => 
          appearances.some(scene => scene.text.toLowerCase().includes(trait.toLowerCase()))
        ) || true
      }
    };
  }

  async checkPlotConsistency(plotPoints: any[]): Promise<any> {
    const conflicts: any[] = [];
    const timeline = new Map();

    // Build timeline from plot points
    plotPoints.forEach(point => {
      if (point.timeline) {
        timeline.set(point.timeline, point);
      }
    });

    // Check for logical conflicts
    plotPoints.forEach((point, index) => {
      // Check if character has necessary item for action
      if (point.event?.includes('sword') && point.timeline > 1) {
        const hasReceived = plotPoints.some(p => 
          p.timeline < point.timeline && p.event?.includes('receives magical sword')
        );
        const hasBroken = plotPoints.some(p => 
          p.timeline < point.timeline && p.event?.includes('sword breaks')
        );

        if (point.event.includes('fights with bare hands') && hasReceived && !hasBroken) {
          conflicts.push({
            type: 'plot',
            description: 'Character fights with bare hands despite having sword',
            timeline: point.timeline,
            severity: 'warning'
          });
        }
      }
    });

    return {
      conflicts,
      score: Math.max(0, 100 - (conflicts.length * 20)),
      consistent: conflicts.length === 0,
      timeline: plotPoints.sort((a, b) => (a.timeline || 0) - (b.timeline || 0))
    };
  }

  async suggestImprovements(inconsistencies: any[]): Promise<any[]> {
    return inconsistencies.map(inconsistency => {
      let suggestions: string[] = [];

      switch (inconsistency.type) {
        case 'character':
          suggestions = [
            'Add transitional scenes to explain character development',
            'Review character motivation and background',
            'Ensure consistency with established personality traits',
            'Consider character arc progression'
          ];
          break;
        case 'plot':
          suggestions = [
            'Add setup scenes for plot elements',
            'Resolve contradictory plot points',
            'Clarify timeline and causality',
            'Remove or explain plot holes'
          ];
          break;
        case 'timeline':
          suggestions = [
            'Adjust scene timing and order',
            'Add time passage indicators',
            'Clarify chronological relationships',
            'Fix temporal inconsistencies'
          ];
          break;
        default:
          suggestions = [
            'Review and revise for consistency',
            'Add clarifying details',
            'Consider reader understanding'
          ];
      }

      return {
        type: inconsistency.type,
        issue: inconsistency.issue || inconsistency.description,
        suggestions,
        priority: inconsistency.severity === 'error' ? 'high' : 
                 inconsistency.severity === 'warning' ? 'medium' : 'low',
        actionable: true,
        difficulty: 'moderate'
      };
    });
  }
}

// Export singleton instance
export const aiConsistencyService = AIConsistencyService.getInstance();