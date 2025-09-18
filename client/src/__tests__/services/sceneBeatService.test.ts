/**
 * Scene Beat Service Unit Tests
 * Comprehensive testing for NovelCrafter's scene beat generation system
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { sceneBeatService, SceneBeat, BeatTemplate, BeatExpansionOptions } from '../../services/sceneBeatService';
import { aiWritingService } from '../../services/aiWritingService';

// Mock AI service
vi.mock('../../services/aiWritingService', () => ({
  aiWritingService: {
    generateContent: vi.fn(),
  },
}));

describe('SceneBeatService', () => {
  beforeEach(() => {
    // Clear all beats before each test
    sceneBeatService['beats'].clear();
    sceneBeatService['beatCounter'] = 0;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Beat Creation', () => {
    test('should create a new scene beat with correct properties', () => {
      const sceneId = 'scene-1';
      const content = 'The hero enters the room';
      const type = 'action';

      const beat = sceneBeatService.createBeat(sceneId, content, type);

      expect(beat).toMatchObject({
        content,
        type,
        position: 0,
        isExpanded: false,
        expandedContent: undefined,
      });
      expect(beat.id).toMatch(/^beat-\d+$/);
      expect(beat.createdAt).toBeInstanceOf(Date);
      expect(beat.updatedAt).toBeInstanceOf(Date);
    });

    test('should create beat at specific position', () => {
      const sceneId = 'scene-1';
      
      // Create first beat
      sceneBeatService.createBeat(sceneId, 'First beat', 'action');
      sceneBeatService.createBeat(sceneId, 'Second beat', 'dialogue');
      
      // Insert at position 1
      const insertedBeat = sceneBeatService.createBeat(sceneId, 'Inserted beat', 'description', 1);
      
      const allBeats = sceneBeatService.getSceneBeats(sceneId);
      expect(allBeats).toHaveLength(3);
      expect(allBeats[1].content).toBe('Inserted beat');
      expect(allBeats[1].position).toBe(1);
    });

    test('should auto-assign position when not specified', () => {
      const sceneId = 'scene-1';
      
      const beat1 = sceneBeatService.createBeat(sceneId, 'First', 'action');
      const beat2 = sceneBeatService.createBeat(sceneId, 'Second', 'dialogue');
      
      expect(beat1.position).toBe(0);
      expect(beat2.position).toBe(1);
    });

    test('should create beat with metadata', () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Test content', 'action');
      
      const updatedBeat = sceneBeatService.updateBeat(sceneId, beat.id, {
        metadata: {
          characters: ['Hero', 'Villain'],
          location: 'Dark Alley',
          timeOfDay: 'midnight',
          mood: 'tense',
          tension: 8,
        },
      });

      expect(updatedBeat?.metadata).toEqual({
        characters: ['Hero', 'Villain'],
        location: 'Dark Alley',
        timeOfDay: 'midnight',
        mood: 'tense',
        tension: 8,
      });
    });
  });

  describe('Slash Command Parsing', () => {
    test('should parse single slash command', () => {
      const content = '/action Hero draws sword';
      const commands = sceneBeatService.parseSlashCommands(content);

      expect(commands).toEqual([
        {
          command: 'action',
          args: 'Hero draws sword',
          position: 0,
        },
      ]);
    });

    test('should parse multiple slash commands', () => {
      const content = '/action Hero enters /dialogue "Hello there" /desc The room is dark';
      const commands = sceneBeatService.parseSlashCommands(content);

      expect(commands).toHaveLength(3);
      expect(commands[0]).toEqual({
        command: 'action',
        args: 'Hero enters',
        position: 0,
      });
      expect(commands[1]).toEqual({
        command: 'dialogue',
        args: '"Hello there"',
        position: 20,
      });
      expect(commands[2]).toEqual({
        command: 'desc',
        args: 'The room is dark',
        position: 44,
      });
    });

    test('should handle commands without arguments', () => {
      const content = '/transition /conflict';
      const commands = sceneBeatService.parseSlashCommands(content);

      expect(commands).toEqual([
        { command: 'transition', args: '', position: 0 },
        { command: 'conflict', args: '', position: 12 },
      ]);
    });

    test('should process slash commands and create beats', async () => {
      const sceneId = 'scene-1';
      const content = '/action Hero fights /dialogue "I won\'t give up"';

      const beats = await sceneBeatService.processSlashCommands(sceneId, content);

      expect(beats).toHaveLength(2);
      expect(beats[0]).toMatchObject({
        type: 'action',
        content: 'Hero fights',
      });
      expect(beats[1]).toMatchObject({
        type: 'dialogue',
        content: '"I won\'t give up"',
      });
    });
  });

  describe('Beat Expansion', () => {
    beforeEach(() => {
      (aiWritingService.generateContent as Mock).mockResolvedValue(
        'The hero stepped into the dimly lit room, sword gleaming in the moonlight streaming through the broken window. Dust motes danced in the silver beams as footsteps echoed off stone walls.'
      );
    });

    test('should expand beat using AI service', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Hero enters room', 'action');

      const expandedContent = await sceneBeatService.expandBeat(beat.id, sceneId);

      expect(aiWritingService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Expand this scene beat into prose'),
        expect.objectContaining({
          maxTokens: 300,
          temperature: 0.7,
          model: 'gpt-3.5-turbo',
        })
      );
      expect(expandedContent).toContain('hero stepped into');
      expect(beat.isExpanded).toBe(true);
      expect(beat.expandedContent).toBe(expandedContent);
    });

    test('should build correct expansion prompt with options', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Character feels sad', 'emotion');
      
      const options: BeatExpansionOptions = {
        tone: 'dramatic',
        style: 'poetic',
        perspective: 'first',
        targetLength: 'long',
        includeDialogue: true,
        includeSensoryDetails: true,
        context: 'After losing their best friend',
      };

      await sceneBeatService.expandBeat(beat.id, sceneId, options);

      const promptCall = (aiWritingService.generateContent as Mock).mock.calls[0][0];
      expect(promptCall).toContain('Type: emotion');
      expect(promptCall).toContain('Tone: dramatic');
      expect(promptCall).toContain('Style: poetic');
      expect(promptCall).toContain('Perspective: first person');
      expect(promptCall).toContain('Context: After losing their best friend');
      expect(promptCall).toContain('Include dialogue where appropriate');
      expect(promptCall).toContain('Include sensory details');
      expect(promptCall).toContain('long length prose');
    });

    test('should handle different target lengths', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Test', 'action');

      // Test short length
      await sceneBeatService.expandBeat(beat.id, sceneId, { targetLength: 'short' });
      expect((aiWritingService.generateContent as Mock).mock.calls[0][1]).toMatchObject({
        maxTokens: 150,
      });

      // Test long length
      vi.clearAllMocks();
      await sceneBeatService.expandBeat(beat.id, sceneId, { targetLength: 'long' });
      expect((aiWritingService.generateContent as Mock).mock.calls[0][1]).toMatchObject({
        maxTokens: 500,
      });
    });

    test('should handle AI service failure', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Test', 'action');

      (aiWritingService.generateContent as Mock).mockRejectedValue(new Error('AI service failed'));

      await expect(sceneBeatService.expandBeat(beat.id, sceneId)).rejects.toThrow(
        'Failed to expand beat with AI'
      );
    });

    test('should throw error for non-existent beat', async () => {
      await expect(sceneBeatService.expandBeat('nonexistent', 'scene-1')).rejects.toThrow(
        'Beat not found'
      );
    });
  });

  describe('Beat Suggestions', () => {
    beforeEach(() => {
      (aiWritingService.generateContent as Mock).mockResolvedValue(
        JSON.stringify([
          { type: 'dialogue', content: 'Character responds to the situation', confidence: 0.9 },
          { type: 'action', content: 'Character takes decisive action', confidence: 0.8 },
          { type: 'conflict', content: 'New obstacle appears', confidence: 0.7 },
        ])
      );
    });

    test('should get AI-powered beat suggestions', async () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Hero enters', 'action');
      
      const suggestions = await sceneBeatService.getBeatSuggestions(
        sceneId,
        'The hero walked into the dark room',
        1
      );

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toMatchObject({
        type: 'dialogue',
        content: 'Character responds to the situation',
        confidence: 0.9,
      });
    });

    test('should provide fallback suggestions when AI fails', async () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Hero enters', 'action');

      (aiWritingService.generateContent as Mock).mockRejectedValue(new Error('AI failed'));

      const suggestions = await sceneBeatService.getBeatSuggestions(sceneId, 'test', 1);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => s.type && s.content && typeof s.confidence === 'number')).toBe(true);
    });

    test('should suggest dialogue when scene lacks it', async () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Hero enters', 'action');
      sceneBeatService.createBeat(sceneId, 'Room is dark', 'description');

      (aiWritingService.generateContent as Mock).mockRejectedValue(new Error('AI failed'));

      const suggestions = await sceneBeatService.getBeatSuggestions(sceneId, 'test', 1);
      
      const dialogueSuggestion = suggestions.find(s => s.type === 'dialogue');
      expect(dialogueSuggestion).toBeDefined();
      expect(dialogueSuggestion?.confidence).toBeGreaterThan(0.7);
    });

    test('should suggest transition for longer scenes', async () => {
      const sceneId = 'scene-1';
      // Create multiple beats to simulate longer scene
      for (let i = 0; i < 5; i++) {
        sceneBeatService.createBeat(sceneId, `Beat ${i}`, 'action');
      }

      (aiWritingService.generateContent as Mock).mockRejectedValue(new Error('AI failed'));

      const suggestions = await sceneBeatService.getBeatSuggestions(sceneId, 'test', 1);
      
      const transitionSuggestion = suggestions.find(s => s.type === 'transition');
      expect(transitionSuggestion).toBeDefined();
    });
  });

  describe('Template Management', () => {
    test('should return default templates', () => {
      const templates = sceneBeatService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        category: expect.any(String),
        beats: expect.any(Array),
      });
    });

    test('should filter templates by category', () => {
      const actionTemplates = sceneBeatService.getTemplatesByCategory('action');
      const dialogueTemplates = sceneBeatService.getTemplatesByCategory('dialogue');

      expect(actionTemplates.every(t => t.category === 'action')).toBe(true);
      expect(dialogueTemplates.every(t => t.category === 'dialogue')).toBe(true);
    });

    test('should create custom template', () => {
      const customTemplate = {
        name: 'Custom Action',
        description: 'My custom action template',
        category: 'action' as const,
        beats: [
          { type: 'action' as const, content: 'Start action' },
          { type: 'conflict' as const, content: 'Add conflict' },
        ],
      };

      const created = sceneBeatService.createCustomTemplate(customTemplate);

      expect(created).toMatchObject(customTemplate);
      expect(created.id).toMatch(/^template-\d+$/);
      
      const allTemplates = sceneBeatService.getTemplates();
      expect(allTemplates).toContain(created);
    });

    test('should apply template to scene', () => {
      const sceneId = 'scene-1';
      const templates = sceneBeatService.getTemplates();
      const actionTemplate = templates.find(t => t.category === 'action')!;

      const context = {
        characters: ['Hero', 'Villain'],
        location: 'Ancient Temple',
      };

      const createdBeats = sceneBeatService.applyTemplate(sceneId, actionTemplate.id, context);

      expect(createdBeats.length).toBe(actionTemplate.beats.length);
      
      // Check placeholder replacement
      const beatsWithCharacters = createdBeats.filter(b => 
        b.content.includes('Hero') || b.content.includes('Hero and Villain')
      );
      expect(beatsWithCharacters.length).toBeGreaterThan(0);

      const beatsWithLocation = createdBeats.filter(b => 
        b.content.includes('Ancient Temple')
      );
      expect(beatsWithLocation.length).toBeGreaterThan(0);
    });

    test('should throw error for non-existent template', () => {
      expect(() => {
        sceneBeatService.applyTemplate('scene-1', 'nonexistent-template');
      }).toThrow('Template not found');
    });
  });

  describe('Beat CRUD Operations', () => {
    test('should get beat by id', () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Test beat', 'action');

      const retrieved = sceneBeatService.getBeat(sceneId, beat.id);
      expect(retrieved).toEqual(beat);
    });

    test('should return null for non-existent beat', () => {
      const retrieved = sceneBeatService.getBeat('scene-1', 'nonexistent');
      expect(retrieved).toBeNull();
    });

    test('should get all scene beats', () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Beat 1', 'action');
      sceneBeatService.createBeat(sceneId, 'Beat 2', 'dialogue');

      const beats = sceneBeatService.getSceneBeats(sceneId);
      expect(beats).toHaveLength(2);
    });

    test('should update beat', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Original content', 'action');
      const originalUpdatedAt = beat.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updated = sceneBeatService.updateBeat(sceneId, beat.id, {
        content: 'Updated content',
        type: 'dialogue',
      });

      expect(updated?.content).toBe('Updated content');
      expect(updated?.type).toBe('dialogue');
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('should delete beat', () => {
      const sceneId = 'scene-1';
      const beat1 = sceneBeatService.createBeat(sceneId, 'Beat 1', 'action');
      const beat2 = sceneBeatService.createBeat(sceneId, 'Beat 2', 'dialogue');

      const deleted = sceneBeatService.deleteBeat(sceneId, beat1.id);
      expect(deleted).toBe(true);

      const remainingBeats = sceneBeatService.getSceneBeats(sceneId);
      expect(remainingBeats).toHaveLength(1);
      expect(remainingBeats[0].id).toBe(beat2.id);
      expect(remainingBeats[0].position).toBe(0); // Should be reordered
    });

    test('should return false when deleting non-existent beat', () => {
      const deleted = sceneBeatService.deleteBeat('scene-1', 'nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('Beat Reordering', () => {
    test('should reorder beats after insertion', () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Beat 1', 'action');
      sceneBeatService.createBeat(sceneId, 'Beat 2', 'dialogue');
      sceneBeatService.createBeat(sceneId, 'Beat 3', 'description');

      const beats = sceneBeatService.getSceneBeats(sceneId);
      beats.forEach((beat, index) => {
        expect(beat.position).toBe(index);
      });
    });

    test('should move beat to new position', () => {
      const sceneId = 'scene-1';
      const beat1 = sceneBeatService.createBeat(sceneId, 'Beat 1', 'action');
      const beat2 = sceneBeatService.createBeat(sceneId, 'Beat 2', 'dialogue');
      const beat3 = sceneBeatService.createBeat(sceneId, 'Beat 3', 'description');

      // Move beat1 to position 2 (end)
      const moved = sceneBeatService.moveBeat(sceneId, beat1.id, 2);
      expect(moved).toBe(true);

      const beats = sceneBeatService.getSceneBeats(sceneId);
      expect(beats[0].id).toBe(beat2.id);
      expect(beats[1].id).toBe(beat3.id);
      expect(beats[2].id).toBe(beat1.id);
    });

    test('should return false when moving non-existent beat', () => {
      const moved = sceneBeatService.moveBeat('scene-1', 'nonexistent', 0);
      expect(moved).toBe(false);
    });
  });

  describe('Scene Prose Generation', () => {
    beforeEach(() => {
      (aiWritingService.generateContent as Mock)
        .mockResolvedValueOnce('The hero entered the room with determination.')
        .mockResolvedValueOnce('He spoke with confidence: "I\'m here to help."')
        .mockResolvedValueOnce('The room was filled with an eerie silence.');
    });

    test('should generate prose from all beats', async () => {
      const sceneId = 'scene-1';
      sceneBeatService.createBeat(sceneId, 'Hero enters', 'action');
      sceneBeatService.createBeat(sceneId, 'Hero speaks', 'dialogue');
      sceneBeatService.createBeat(sceneId, 'Silence falls', 'description');

      const prose = await sceneBeatService.generateSceneProse(sceneId);

      expect(prose).toContain('The hero entered the room');
      expect(prose).toContain('He spoke with confidence');
      expect(prose).toContain('eerie silence');
      expect(prose.split('\n\n')).toHaveLength(3);
    });

    test('should use existing expanded content when available', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Hero enters', 'action');
      
      // Pre-expand the beat
      beat.isExpanded = true;
      beat.expandedContent = 'Pre-expanded content';

      const prose = await sceneBeatService.generateSceneProse(sceneId);

      expect(prose).toBe('Pre-expanded content');
      expect(aiWritingService.generateContent).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty scene beats gracefully', () => {
      const beats = sceneBeatService.getSceneBeats('nonexistent-scene');
      expect(beats).toEqual([]);
    });

    test('should handle malformed slash commands', () => {
      const content = '/invalid-command some text /another';
      const commands = sceneBeatService.parseSlashCommands(content);
      
      // Should still parse the commands, even if they're invalid
      expect(commands).toHaveLength(2);
    });

    test('should handle AI service timeouts', async () => {
      const sceneId = 'scene-1';
      const beat = sceneBeatService.createBeat(sceneId, 'Test', 'action');

      // Explicitly reset the mock and set up rejection
      (aiWritingService.generateContent as Mock).mockReset();
      (aiWritingService.generateContent as Mock).mockRejectedValue(new Error('Timeout'));

      await expect(sceneBeatService.expandBeat(beat.id, sceneId)).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of beats efficiently', () => {
      const sceneId = 'large-scene';
      const startTime = performance.now();

      // Create 1000 beats
      for (let i = 0; i < 1000; i++) {
        sceneBeatService.createBeat(sceneId, `Beat ${i}`, 'action');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(sceneBeatService.getSceneBeats(sceneId)).toHaveLength(1000);
    });

    test('should efficiently search through many beats', () => {
      const sceneId = 'search-scene';
      const beats: SceneBeat[] = [];

      // Create many beats
      for (let i = 0; i < 500; i++) {
        beats.push(sceneBeatService.createBeat(sceneId, `Beat ${i}`, 'action'));
      }

      const startTime = performance.now();
      
      // Search for a specific beat
      const found = sceneBeatService.getBeat(sceneId, beats[250].id);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(found).toBeDefined();
      expect(duration).toBeLessThan(10); // Should find quickly
    });
  });
});