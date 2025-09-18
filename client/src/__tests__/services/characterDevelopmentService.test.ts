import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { characterDevelopmentService } from '../../services/characterDevelopmentService';
import type { Character, RelationshipType, CharacterTemplate } from '../../services/characterDevelopmentService';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('CharacterDevelopmentService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Clear all characters from the service
    const allCharacters = characterDevelopmentService.getAllCharacters();
    allCharacters.forEach(char => {
      characterDevelopmentService.deleteCharacter(char.id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Character Management', () => {
    it('should create character with minimal data', () => {
      const characterData = {
        name: 'John Doe',
        projectId: 'project-1'
      };

      const character = characterDevelopmentService.createCharacter(characterData);

      expect(character.id).toBeTruthy();
      expect(character.name).toBe('John Doe');
      expect(character.projectId).toBe('project-1');
      expect(character.species).toBe('Human');
      expect(character.personality.traits).toEqual([]);
      expect(character.relationships).toEqual([]);
      expect(character.isTemplate).toBe(false);
      expect(character.version).toBe(1);
    });

    it('should create character with comprehensive data', () => {
      const characterData = {
        name: 'Jane Smith',
        fullName: 'Jane Elizabeth Smith',
        aliases: ['Janey', 'The Shadow'],
        projectId: 'project-1',
        age: 28,
        gender: 'female',
        occupation: 'Detective',
        physicalDescription: {
          height: '5\'6"',
          eyeColor: 'green',
          hairColor: 'auburn'
        },
        personality: {
          traits: ['intelligent', 'observant', 'stubborn'],
          strengths: ['analytical thinking', 'persistence'],
          weaknesses: ['trusts no one', 'workaholic'],
          fears: ['failure', 'losing loved ones'],
          motivations: ['seek justice', 'protect innocents']
        },
        background: {
          backstory: 'Former FBI agent turned private detective',
          education: 'Criminal Justice degree',
          significantEvents: [{
            event: 'Lost partner in the line of duty',
            age: 25,
            impact: 'Made her more cautious and less trusting'
          }]
        }
      };

      const character = characterDevelopmentService.createCharacter(characterData);

      expect(character.name).toBe('Jane Smith');
      expect(character.fullName).toBe('Jane Elizabeth Smith');
      expect(character.aliases).toEqual(['Janey', 'The Shadow']);
      expect(character.age).toBe(28);
      expect(character.occupation).toBe('Detective');
      expect(character.physicalDescription.height).toBe('5\'6"');
      expect(character.personality.traits).toEqual(['intelligent', 'observant', 'stubborn']);
      expect(character.background.backstory).toBe('Former FBI agent turned private detective');
      expect(character.background.significantEvents).toHaveLength(1);
    });

    it('should update character successfully', async () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Test Character',
        projectId: 'project-1'
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const updates = {
        age: 30,
        occupation: 'Writer',
        personality: {
          ...character.personality,
          traits: ['creative', 'introverted']
        }
      };

      const updatedCharacter = characterDevelopmentService.updateCharacter(character.id, updates);

      expect(updatedCharacter).toBeTruthy();
      expect(updatedCharacter!.age).toBe(30);
      expect(updatedCharacter!.occupation).toBe('Writer');
      expect(updatedCharacter!.personality.traits).toEqual(['creative', 'introverted']);
      expect(updatedCharacter!.version).toBe(2);
      expect(updatedCharacter!.updatedAt.getTime()).toBeGreaterThanOrEqual(character.createdAt.getTime());
    });

    it('should return null when updating non-existent character', () => {
      const result = characterDevelopmentService.updateCharacter('non-existent', { age: 25 });
      expect(result).toBeNull();
    });

    it('should delete character successfully', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Delete Me',
        projectId: 'project-1'
      });

      const deleted = characterDevelopmentService.deleteCharacter(character.id);
      expect(deleted).toBe(true);

      const retrieved = characterDevelopmentService.getCharacter(character.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent character', () => {
      const result = characterDevelopmentService.deleteCharacter('non-existent');
      expect(result).toBe(false);
    });

    it('should get all characters', () => {
      characterDevelopmentService.createCharacter({ name: 'Character 1', projectId: 'project-1' });
      characterDevelopmentService.createCharacter({ name: 'Character 2', projectId: 'project-1' });
      characterDevelopmentService.createCharacter({ name: 'Character 3', projectId: 'project-2' });

      const allCharacters = characterDevelopmentService.getAllCharacters();
      expect(allCharacters).toHaveLength(3);

      const projectCharacters = characterDevelopmentService.getAllCharacters('project-1');
      expect(projectCharacters).toHaveLength(2);
    });

    it('should search characters by various criteria', () => {
      characterDevelopmentService.createCharacter({
        name: 'John Detective',
        fullName: 'John Smith',
        aliases: ['Johnny'],
        occupation: 'Detective',
        projectId: 'project-1',
        tags: ['protagonist', 'law enforcement']
      });

      characterDevelopmentService.createCharacter({
        name: 'Mary Writer',
        occupation: 'Author',
        projectId: 'project-1',
        notes: 'Writes mystery novels'
      });

      // Search by name
      let results = characterDevelopmentService.searchCharacters('John');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Detective');

      // Search by occupation
      results = characterDevelopmentService.searchCharacters('Detective');
      expect(results).toHaveLength(1);

      // Search by alias
      results = characterDevelopmentService.searchCharacters('Johnny');
      expect(results).toHaveLength(1);

      // Search by tag
      results = characterDevelopmentService.searchCharacters('protagonist');
      expect(results).toHaveLength(1);

      // Search by notes
      results = characterDevelopmentService.searchCharacters('mystery');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Mary Writer');
    });
  });

  describe('Relationship Management', () => {
    let character1: Character;
    let character2: Character;

    beforeEach(() => {
      character1 = characterDevelopmentService.createCharacter({
        name: 'Character One',
        projectId: 'project-1'
      });
      character2 = characterDevelopmentService.createCharacter({
        name: 'Character Two',
        projectId: 'project-1'
      });
    });

    it('should add relationship between characters', () => {
      const relationshipData = {
        relationshipType: 'friend-best' as RelationshipType,
        description: 'Best friends since childhood',
        status: 'current' as const,
        intensity: 9,
        history: 'Met in elementary school'
      };

      const added = characterDevelopmentService.addRelationship(
        character1.id,
        character2.id,
        relationshipData
      );

      expect(added).toBe(true);

      const relationships = characterDevelopmentService.getCharacterRelationships(character1.id);
      expect(relationships).toHaveLength(1);
      expect(relationships[0].characterId).toBe(character2.id);
      expect(relationships[0].relationshipType).toBe('friend-best');
      expect(relationships[0].description).toBe('Best friends since childhood');
      expect(relationships[0].intensity).toBe(9);
    });

    it('should update existing relationship', () => {
      characterDevelopmentService.addRelationship(character1.id, character2.id, {
        relationshipType: 'friend-casual',
        description: 'Casual friends'
      });

      const updated = characterDevelopmentService.updateRelationship(
        character1.id,
        character2.id,
        {
          relationshipType: 'friend-best',
          description: 'Best friends now',
          intensity: 8
        }
      );

      expect(updated).toBe(true);

      const relationships = characterDevelopmentService.getCharacterRelationships(character1.id);
      expect(relationships[0].relationshipType).toBe('friend-best');
      expect(relationships[0].description).toBe('Best friends now');
      expect(relationships[0].intensity).toBe(8);
    });

    it('should remove relationship', () => {
      characterDevelopmentService.addRelationship(character1.id, character2.id, {
        relationshipType: 'friend-casual',
        description: 'Friends'
      });

      const removed = characterDevelopmentService.removeRelationship(character1.id, character2.id);
      expect(removed).toBe(true);

      const relationships = characterDevelopmentService.getCharacterRelationships(character1.id);
      expect(relationships).toHaveLength(0);
    });

    it('should handle non-existent relationships gracefully', () => {
      const updated = characterDevelopmentService.updateRelationship(
        character1.id,
        'non-existent',
        { description: 'Updated' }
      );
      expect(updated).toBe(false);

      const removed = characterDevelopmentService.removeRelationship(character1.id, 'non-existent');
      expect(removed).toBe(false);
    });

    it('should clean up relationships when character is deleted', () => {
      const character3 = characterDevelopmentService.createCharacter({
        name: 'Character Three',
        projectId: 'project-1'
      });

      // Add relationships
      characterDevelopmentService.addRelationship(character1.id, character2.id, {
        relationshipType: 'friend-best',
        description: 'Friends'
      });
      characterDevelopmentService.addRelationship(character2.id, character3.id, {
        relationshipType: 'family-sibling',
        description: 'Siblings'
      });

      // Delete character2
      characterDevelopmentService.deleteCharacter(character2.id);

      // Check that relationships pointing to character2 are removed
      const char1Relationships = characterDevelopmentService.getCharacterRelationships(character1.id);
      expect(char1Relationships).toHaveLength(0);

      const char3Relationships = characterDevelopmentService.getCharacterRelationships(character3.id);
      expect(char3Relationships).toHaveLength(0);
    });
  });

  describe('Character Development Tools', () => {
    let character: Character;

    beforeEach(() => {
      character = characterDevelopmentService.createCharacter({
        name: 'Hero Character',
        projectId: 'project-1',
        personality: {
          traits: ['brave', 'loyal'],
          strengths: ['courage', 'leadership'],
          weaknesses: ['impulsive', 'stubborn'],
          fears: ['failure', 'losing friends'],
          motivations: ['save the world', 'protect family'],
          desires: [],
          habits: [],
          quirks: []
        }
      });
    });

    it('should generate character arc', () => {
      const arc = characterDevelopmentService.generateCharacterArc(character.id, 'defeat the dark lord');

      expect(arc).toContain(character.name);
      expect(arc).toContain('save the world, protect family');
      expect(arc).toContain('failure, losing friends');
      expect(arc).toContain('courage, leadership');
      expect(arc).toContain('impulsive, stubborn');
      expect(arc).toContain('defeat the dark lord');
      expect(arc).toContain('Beginning:');
      expect(arc).toContain('Resolution:');
    });

    it('should suggest character goals based on personality', () => {
      const suggestions = characterDevelopmentService.suggestCharacterGoals(character.id);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(6);

      // Should include goals based on motivations
      const motivationGoals = suggestions.filter(s => 
        s.goal.includes('save the world') || s.goal.includes('protect family')
      );
      expect(motivationGoals.length).toBeGreaterThan(0);

      // Should include goals based on fears
      const fearGoals = suggestions.filter(s => 
        s.goal.includes('failure') || s.goal.includes('losing friends')
      );
      expect(fearGoals.length).toBeGreaterThan(0);

      // Check goal structure
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('goal');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('reasoning');
        expect(['low', 'medium', 'high']).toContain(suggestion.priority);
      });
    });

    it('should analyze character development completeness', () => {
      const analysis = characterDevelopmentService.analyzeCharacterDevelopment(character.id);

      expect(analysis).toHaveProperty('completeness');
      expect(analysis).toHaveProperty('strengths');
      expect(analysis).toHaveProperty('weaknesses');
      expect(analysis).toHaveProperty('suggestions');
      expect(analysis).toHaveProperty('missingElements');

      expect(typeof analysis.completeness).toBe('number');
      expect(analysis.completeness).toBeGreaterThanOrEqual(0);
      expect(analysis.completeness).toBeLessThanOrEqual(100);

      expect(Array.isArray(analysis.strengths)).toBe(true);
      expect(Array.isArray(analysis.weaknesses)).toBe(true);
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(Array.isArray(analysis.missingElements)).toBe(true);
    });

    it('should provide higher completeness score for well-developed character', () => {
      // Create a well-developed character
      const wellDeveloped = characterDevelopmentService.createCharacter({
        name: 'Well Developed',
        projectId: 'project-1',
        age: 30,
        occupation: 'Detective',
        physicalDescription: {
          height: '6ft',
          eyeColor: 'blue',
          hairColor: 'black'
        },
        personality: {
          traits: ['intelligent', 'determined', 'cynical'],
          strengths: ['analytical', 'persistent'],
          weaknesses: ['untrusting', 'workaholic'],
          fears: ['failure', 'intimacy'],
          motivations: ['seek justice', 'prove worth'],
          desires: ['recognition'],
          habits: ['drinks coffee'],
          quirks: ['taps pen when thinking']
        },
        background: {
          backstory: 'A detailed backstory with multiple paragraphs describing the character\'s history, family, education, and formative experiences.',
          education: 'Police Academy',
          significantEvents: [
            {
              event: 'First case',
              age: 25,
              impact: 'Built confidence'
            }
          ]
        },
        development: {
          characterArc: 'Learns to trust others and open up emotionally',
          goals: [
            {
              goal: 'Solve the big case',
              priority: 'high',
              status: 'in-progress'
            }
          ],
          conflicts: [],
          growthMilestones: []
        },
        voice: {
          speechPatterns: ['speaks quickly when excited'],
          vocabulary: 'sophisticated',
          catchphrases: ['Let me think about this'],
          speaking_style: 'formal',
          languages: ['English', 'Spanish']
        }
      });

      const analysis = characterDevelopmentService.analyzeCharacterDevelopment(wellDeveloped.id);
      expect(analysis.completeness).toBeGreaterThan(60); // Adjusted for realistic scoring
    });

    it('should return empty analysis for non-existent character', () => {
      const analysis = characterDevelopmentService.analyzeCharacterDevelopment('non-existent');
      
      expect(analysis.completeness).toBe(0);
      expect(analysis.missingElements).toEqual(['Character not found']);
    });
  });

  describe('Character Templates', () => {
    let sampleCharacter: Character;

    beforeEach(() => {
      sampleCharacter = characterDevelopmentService.createCharacter({
        name: 'Template Character',
        projectId: 'project-1',
        personality: {
          traits: ['brave', 'loyal'],
          strengths: ['courage'],
          weaknesses: ['impulsive'],
          fears: ['failure'],
          motivations: ['help others'],
          desires: [],
          habits: [],
          quirks: []
        },
        tags: ['hero', 'protagonist']
      });
    });

    it('should create character template', () => {
      const template = characterDevelopmentService.createTemplate(sampleCharacter, {
        name: 'Hero Template',
        description: 'Classic hero archetype',
        category: 'Heroes',
        isPublic: true
      });

      expect(template.id).toBeTruthy();
      expect(template.name).toBe('Hero Template');
      expect(template.description).toBe('Classic hero archetype');
      expect(template.category).toBe('Heroes');
      expect(template.isPublic).toBe(true);
      expect(template.usageCount).toBe(0);
      expect(template.characterData.name).toBe('Template Character');
      expect(template.tags).toEqual(['hero', 'protagonist']);
    });

    it('should get templates by category', () => {
      characterDevelopmentService.createTemplate(sampleCharacter, {
        name: 'Hero Template',
        description: 'Hero',
        category: 'Heroes'
      });

      characterDevelopmentService.createTemplate(sampleCharacter, {
        name: 'Villain Template',
        description: 'Villain',
        category: 'Villains'
      });

      const allTemplates = characterDevelopmentService.getTemplates();
      expect(allTemplates.length).toBeGreaterThanOrEqual(2);

      const heroTemplates = characterDevelopmentService.getTemplates('Heroes');
      expect(heroTemplates.length).toBeGreaterThanOrEqual(1);
      expect(heroTemplates.some(t => t.name === 'Hero Template')).toBe(true);
    });

    it('should use template to create character', () => {
      const template = characterDevelopmentService.createTemplate(sampleCharacter, {
        name: 'Hero Template',
        description: 'Hero',
        category: 'Heroes'
      });

      const newCharacter = characterDevelopmentService.useTemplate(template.id, 'project-2', {
        name: 'New Hero',
        age: 25
      });

      expect(newCharacter).toBeTruthy();
      expect(newCharacter!.name).toBe('New Hero');
      expect(newCharacter!.age).toBe(25);
      expect(newCharacter!.projectId).toBe('project-2');
      expect(newCharacter!.personality.traits).toEqual(['brave', 'loyal']);
      expect(newCharacter!.isTemplate).toBe(false);

      // Check that template usage count increased
      const updatedTemplates = characterDevelopmentService.getTemplates();
      const usedTemplate = updatedTemplates.find(t => t.id === template.id);
      expect(usedTemplate?.usageCount).toBe(1);
    });

    it('should return null when using non-existent template', () => {
      const result = characterDevelopmentService.useTemplate('non-existent', 'project-1');
      expect(result).toBeNull();
    });

    it('should include built-in templates', () => {
      const templates = characterDevelopmentService.getTemplates();
      
      const heroTemplate = templates.find(t => t.name === 'Classic Hero');
      expect(heroTemplate).toBeTruthy();
      expect(heroTemplate?.category).toBe('Archetypes');
      expect(heroTemplate?.isPublic).toBe(true);

      const mentorTemplate = templates.find(t => t.name === 'Wise Mentor');
      expect(mentorTemplate).toBeTruthy();
      expect(mentorTemplate?.category).toBe('Archetypes');
    });
  });

  describe('Development Prompts', () => {
    it('should get random development prompt', () => {
      const prompt = characterDevelopmentService.getRandomDevelopmentPrompt();
      
      expect(prompt).toBeTruthy();
      expect(prompt).toHaveProperty('id');
      expect(prompt).toHaveProperty('category');
      expect(prompt).toHaveProperty('prompt');
      expect(prompt).toHaveProperty('followUpQuestions');
      expect(prompt).toHaveProperty('tags');
      expect(prompt).toHaveProperty('difficulty');
      
      expect(Array.isArray(prompt!.followUpQuestions)).toBe(true);
      expect(Array.isArray(prompt!.tags)).toBe(true);
      expect(['beginner', 'intermediate', 'advanced']).toContain(prompt!.difficulty);
    });

    it('should get random prompt by category', () => {
      const personalityPrompt = characterDevelopmentService.getRandomDevelopmentPrompt('personality');
      
      expect(personalityPrompt).toBeTruthy();
      expect(personalityPrompt!.category).toBe('personality');
    });

    it('should get prompts by category and difficulty', () => {
      const beginnerPrompts = characterDevelopmentService.getDevelopmentPrompts(undefined, 'beginner');
      expect(beginnerPrompts.length).toBeGreaterThan(0);
      expect(beginnerPrompts.every(p => p.difficulty === 'beginner')).toBe(true);

      const personalityPrompts = characterDevelopmentService.getDevelopmentPrompts('personality');
      expect(personalityPrompts.length).toBeGreaterThan(0);
      expect(personalityPrompts.every(p => p.category === 'personality')).toBe(true);

      const specificPrompts = characterDevelopmentService.getDevelopmentPrompts('background', 'intermediate');
      expect(specificPrompts.every(p => p.category === 'background' && p.difficulty === 'intermediate')).toBe(true);
    });

    it('should have diverse prompt categories', () => {
      const allPrompts = characterDevelopmentService.getDevelopmentPrompts();
      const categories = new Set(allPrompts.map(p => p.category));
      
      expect(categories.has('personality')).toBe(true);
      expect(categories.has('background')).toBe(true);
      expect(categories.has('relationships')).toBe(true);
      expect(categories.has('goals')).toBe(true);
      expect(categories.has('voice')).toBe(true);
    });
  });

  describe('Analytics and Visualization', () => {
    beforeEach(() => {
      // Create test characters with relationships
      const char1 = characterDevelopmentService.createCharacter({
        name: 'Protagonist',
        projectId: 'project-1',
        storyRole: { importance: 'protagonist', function: ['leader'] }
      });

      const char2 = characterDevelopmentService.createCharacter({
        name: 'Antagonist',
        projectId: 'project-1',
        storyRole: { importance: 'antagonist', function: ['villain'] }
      });

      const char3 = characterDevelopmentService.createCharacter({
        name: 'Supporting Character',
        projectId: 'project-1',
        storyRole: { importance: 'supporting', function: ['helper'] },
        development: {
          characterArc: 'Has a character arc',
          goals: [
            { goal: 'Help protagonist', priority: 'high', status: 'in-progress' },
            { goal: 'Find love', priority: 'medium', status: 'not-started' }
          ],
          conflicts: [],
          growthMilestones: []
        }
      });

      const char4 = characterDevelopmentService.createCharacter({
        name: 'Other Project Character',
        projectId: 'project-2',
        storyRole: { importance: 'minor', function: ['cameo'] }
      });

      // Add relationships
      characterDevelopmentService.addRelationship(char1.id, char2.id, {
        relationshipType: 'enemy-arch',
        description: 'Arch enemies'
      });

      characterDevelopmentService.addRelationship(char1.id, char3.id, {
        relationshipType: 'friend-best',
        description: 'Best friends'
      });

      characterDevelopmentService.addRelationship(char2.id, char3.id, {
        relationshipType: 'enemy-personal',
        description: 'Personal enemy'
      });
    });

    it('should generate relationship map', () => {
      const relationshipMap = characterDevelopmentService.generateRelationshipMap('project-1');

      expect(relationshipMap.characters.length).toBe(3); // Only project-1 characters
      expect(relationshipMap.relationships.length).toBe(3); // Three relationships
      expect(relationshipMap.clusters.length).toBeGreaterThanOrEqual(1);

      // Check relationship structure
      relationshipMap.relationships.forEach(rel => {
        expect(rel).toHaveProperty('fromId');
        expect(rel).toHaveProperty('toId');
        expect(rel).toHaveProperty('relationship');
        expect(rel).toHaveProperty('strength');
        expect(typeof rel.strength).toBe('number');
      });

      // Check cluster structure
      relationshipMap.clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('id');
        expect(cluster).toHaveProperty('name');
        expect(cluster).toHaveProperty('characterIds');
        expect(Array.isArray(cluster.characterIds)).toBe(true);
        expect(cluster.characterIds.length).toBeGreaterThan(1);
      });
    });

    it('should generate relationship map for all projects', () => {
      const relationshipMap = characterDevelopmentService.generateRelationshipMap();

      expect(relationshipMap.characters.length).toBe(4); // All characters
    });

    it('should get character analytics', () => {
      const analytics = characterDevelopmentService.getCharacterAnalytics('project-1');

      expect(analytics.totalCharacters).toBe(3);
      
      expect(analytics.charactersByRole).toHaveProperty('protagonist');
      expect(analytics.charactersByRole).toHaveProperty('antagonist');
      expect(analytics.charactersByRole).toHaveProperty('supporting');
      expect(analytics.charactersByRole.protagonist).toBe(1);
      expect(analytics.charactersByRole.antagonist).toBe(1);
      expect(analytics.charactersByRole.supporting).toBe(1);

      expect(analytics.charactersByProject).toHaveProperty('project-1');
      expect(analytics.charactersByProject['project-1']).toBe(3);

      expect(analytics.relationshipStats.totalRelationships).toBe(3);
      expect(analytics.relationshipStats.averageConnectionsPerCharacter).toBeGreaterThan(0);
      expect(analytics.relationshipStats.mostConnectedCharacter).toBeTruthy();

      expect(analytics.developmentProgress.charactersWithArcs).toBe(1);
      expect(analytics.developmentProgress.averageGoalsPerCharacter).toBeGreaterThan(0);
      expect(Array.isArray(analytics.developmentProgress.charactersNeedingDevelopment)).toBe(true);

      expect(analytics.contentMetrics).toHaveProperty('averageWordCount');
      expect(analytics.contentMetrics).toHaveProperty('averageSceneAppearances');
      expect(Array.isArray(analytics.contentMetrics.underutilizedCharacters)).toBe(true);
      expect(Array.isArray(analytics.contentMetrics.overutilizedCharacters)).toBe(true);
    });

    it('should get analytics for all projects', () => {
      const analytics = characterDevelopmentService.getCharacterAnalytics();

      expect(analytics.totalCharacters).toBe(4); // All characters
      expect(analytics.charactersByProject).toHaveProperty('project-1');
      expect(analytics.charactersByProject).toHaveProperty('project-2');
    });
  });

  describe('Event Handling', () => {
    it('should emit character events', () => {
      const createSpy = vi.fn();
      const updateSpy = vi.fn();
      const deleteSpy = vi.fn();

      characterDevelopmentService.on('characterCreated', createSpy);
      characterDevelopmentService.on('characterUpdated', updateSpy);
      characterDevelopmentService.on('characterDeleted', deleteSpy);

      const character = characterDevelopmentService.createCharacter({
        name: 'Event Test',
        projectId: 'project-1'
      });

      expect(createSpy).toHaveBeenCalledWith(character);

      characterDevelopmentService.updateCharacter(character.id, { age: 25 });
      expect(updateSpy).toHaveBeenCalled();

      characterDevelopmentService.deleteCharacter(character.id);
      expect(deleteSpy).toHaveBeenCalled();
    });

    it('should emit relationship events', () => {
      const addSpy = vi.fn();
      const updateSpy = vi.fn();
      const removeSpy = vi.fn();

      characterDevelopmentService.on('relationshipAdded', addSpy);
      characterDevelopmentService.on('relationshipUpdated', updateSpy);
      characterDevelopmentService.on('relationshipRemoved', removeSpy);

      const char1 = characterDevelopmentService.createCharacter({
        name: 'Character 1',
        projectId: 'project-1'
      });

      const char2 = characterDevelopmentService.createCharacter({
        name: 'Character 2',
        projectId: 'project-1'
      });

      characterDevelopmentService.addRelationship(char1.id, char2.id, {
        relationshipType: 'friend-casual',
        description: 'Friends'
      });
      expect(addSpy).toHaveBeenCalled();

      characterDevelopmentService.updateRelationship(char1.id, char2.id, {
        description: 'Best friends'
      });
      expect(updateSpy).toHaveBeenCalled();

      characterDevelopmentService.removeRelationship(char1.id, char2.id);
      expect(removeSpy).toHaveBeenCalled();
    });

    it('should emit template events', () => {
      const templateSpy = vi.fn();
      characterDevelopmentService.on('templateCreated', templateSpy);

      const character = characterDevelopmentService.createCharacter({
        name: 'Template Base',
        projectId: 'project-1'
      });

      characterDevelopmentService.createTemplate(character, {
        name: 'Test Template',
        description: 'Test',
        category: 'Test'
      });

      expect(templateSpy).toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    it('should persist characters to localStorage', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Persistent Character',
        projectId: 'project-1',
        age: 30
      });

      const stored = localStorage.getItem('astral_notes_characters');
      expect(stored).toBeTruthy();

      const parsedData = JSON.parse(stored!);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.some((c: Character) => c.name === 'Persistent Character')).toBe(true);
    });

    it('should persist templates to localStorage', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Template Base',
        projectId: 'project-1'
      });

      characterDevelopmentService.createTemplate(character, {
        name: 'Persistent Template',
        description: 'Test template',
        category: 'Test'
      });

      const stored = localStorage.getItem('astral_notes_characters_templates');
      expect(stored).toBeTruthy();

      const parsedData = JSON.parse(stored!);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.some((t: CharacterTemplate) => t.name === 'Persistent Template')).toBe(true);
    });

    it('should handle localStorage persistence correctly', () => {
      // Create a character and verify it persists
      const character = characterDevelopmentService.createCharacter({
        name: 'Persistence Test Character',
        projectId: 'project-1',
        age: 30
      });

      // Check that it was saved to localStorage
      const stored = localStorage.getItem('astral_notes_characters');
      expect(stored).toBeTruthy();
      
      const parsedData = JSON.parse(stored!);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.some((c: Character) => c.name === 'Persistence Test Character')).toBe(true);
      
      // Verify the character exists in service
      const retrieved = characterDevelopmentService.getCharacter(character.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved!.name).toBe('Persistence Test Character');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('astral_notes_characters', 'invalid json');

      // Should not throw error and should continue working
      expect(() => {
        characterDevelopmentService.createCharacter({
          name: 'Test After Corruption',
          projectId: 'project-1'
        });
      }).not.toThrow();

      const characters = characterDevelopmentService.getAllCharacters();
      expect(characters.some(c => c.name === 'Test After Corruption')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty character name gracefully', () => {
      const character = characterDevelopmentService.createCharacter({
        name: '',
        projectId: 'project-1'
      });

      expect(character.name).toBe('Unnamed Character');
    });

    it('should handle missing project ID', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'No Project Character'
      });

      expect(character.projectId).toBe('');
    });

    it('should prevent ID changes during updates', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Original Character',
        projectId: 'project-1'
      });

      const originalId = character.id;
      
      const updated = characterDevelopmentService.updateCharacter(character.id, {
        id: 'different-id',
        name: 'Updated Character'
      });

      expect(updated!.id).toBe(originalId);
      expect(updated!.name).toBe('Updated Character');
    });

    it('should handle relationship with non-existent character', () => {
      const character = characterDevelopmentService.createCharacter({
        name: 'Solo Character',
        projectId: 'project-1'
      });

      const added = characterDevelopmentService.addRelationship(
        character.id,
        'non-existent',
        {
          relationshipType: 'friend-casual',
          description: 'Friend'
        }
      );

      expect(added).toBe(false);
    });

    it('should handle empty search queries', () => {
      characterDevelopmentService.createCharacter({
        name: 'Test Character',
        projectId: 'project-1'
      });

      // Empty string should return no results
      const emptyResults = characterDevelopmentService.searchCharacters('');
      expect(emptyResults).toHaveLength(0);
      
      // Whitespace only should return no results
      const whitespaceResults = characterDevelopmentService.searchCharacters('   ');
      expect(whitespaceResults).toHaveLength(0);
    });

    it('should handle special characters in search', () => {
      characterDevelopmentService.createCharacter({
        name: 'Character with @#$%^&*() symbols',
        projectId: 'project-1'
      });

      const results = characterDevelopmentService.searchCharacters('@#$');
      expect(results).toHaveLength(1);
    });

    it('should handle large character datasets efficiently', () => {
      // Create many characters
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        characterDevelopmentService.createCharacter({
          name: `Character ${i}`,
          projectId: `project-${i % 5}`
        });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast

      // Test search performance
      const searchStart = Date.now();
      const results = characterDevelopmentService.searchCharacters('Character');
      const searchEnd = Date.now();

      expect(results.length).toBe(50);
      expect(searchEnd - searchStart).toBeLessThan(100); // Should be fast
    });
  });
});