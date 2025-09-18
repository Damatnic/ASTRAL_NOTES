/**
 * Scene Beat Service Tests
 * Comprehensive tests for scene beat generation functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sceneBeatService, type SceneBeat, type BeatExpansionOptions } from '../../services/sceneBeatService';

// Mock AI writing service
vi.mock('../../services/aiWritingService', () => ({
  aiWritingService: {
    generateContent: vi.fn(),
  },
}));

import { aiWritingService } from '../../services/aiWritingService';

describe('SceneBeatService', () => {
  const testSceneId = 'test-scene-1';

  beforeEach(() => {
    // Reset the service to clear state between tests
    sceneBeatService.reset();
    // Clear any existing mocks
    vi.clearAllMocks();
  });

  describe('Beat Creation', () => {
    it('should create a new beat', () => {
      const beat = sceneBeatService.createBeat(testSceneId, 'Hero enters the tavern', 'action');
      
      expect(beat).toMatchObject({
        content: 'Hero enters the tavern',
        type: 'action',
        position: 0,
        isExpanded: false,
      });
      expect(beat.id).toBeDefined();
      expect(beat.createdAt).toBeInstanceOf(Date);
    });

    it('should create beats with correct positions', () => {
      const beat1 = sceneBeatService.createBeat(testSceneId, 'First beat', 'action');
      const beat2 = sceneBeatService.createBeat(testSceneId, 'Second beat', 'dialogue');
      
      expect(beat1.position).toBe(0);
      expect(beat2.position).toBe(1);
    });

    it('should insert beat at specific position', () => {
      sceneBeatService.createBeat(testSceneId, 'First beat', 'action');
      sceneBeatService.createBeat(testSceneId, 'Third beat', 'action');
      const insertedBeat = sceneBeatService.createBeat(testSceneId, 'Second beat', 'dialogue', 1);
      
      const beats = sceneBeatService.getSceneBeats(testSceneId);
      expect(beats[1].content).toBe('Second beat');
      expect(insertedBeat.position).toBe(1);
    });
  });

  describe('Slash Command Parsing', () => {
    it('should parse single slash command', () => {
      const content = '/action Hero draws sword';
      const commands = sceneBeatService.parseSlashCommands(content);
      
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        command: 'action',
        args: 'Hero draws sword',
        position: 0,
      });
    });

    it('should parse multiple slash commands', () => {
      const content = '/action Hero enters /dialogue "Hello there" /desc The room is dark';
      const commands = sceneBeatService.parseSlashCommands(content);
      
      expect(commands).toHaveLength(3);
      expect(commands[0].command).toBe('action');
      expect(commands[1].command).toBe('dialogue');
      expect(commands[2].command).toBe('desc');
    });

    it('should handle commands without arguments', () => {
      const content = '/transition';
      const commands = sceneBeatService.parseSlashCommands(content);
      
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({
        command: 'transition',
        args: '',
      });
    });

    it('should process slash commands into beats', async () => {
      const content = '/action Hero fights /dialogue "Stay back!"';
      const newBeats = await sceneBeatService.processSlashCommands(testSceneId, content);
      
      expect(newBeats).toHaveLength(2);
      expect(newBeats[0].type).toBe('action');
      expect(newBeats[1].type).toBe('dialogue');
    });
  });

  describe('Beat Expansion', () => {
    it('should expand beat using AI', async () => {
      const mockExpandedContent = 'The hero dramatically drew his gleaming sword from its sheath, the metal singing as it caught the light.';
      (aiWritingService.generateContent as any).mockResolvedValue(mockExpandedContent);

      const beat = sceneBeatService.createBeat(testSceneId, 'Hero draws sword', 'action');
      const expandedContent = await sceneBeatService.expandBeat(beat.id, testSceneId);

      expect(expandedContent).toBe(mockExpandedContent);
      expect(beat.isExpanded).toBe(true);
      expect(beat.expandedContent).toBe(mockExpandedContent);
    });

    it('should build correct expansion prompt', async () => {
      const options: BeatExpansionOptions = {
        tone: 'dramatic',
        style: 'detailed',
        perspective: 'third-limited',
        targetLength: 'medium',
      };

      const beat = sceneBeatService.createBeat(testSceneId, 'Hero draws sword', 'action');
      await sceneBeatService.expandBeat(beat.id, testSceneId, options);

      expect(aiWritingService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Hero draws sword'),
        expect.objectContaining({
          maxTokens: 300,
          temperature: 0.7,
        })
      );
    });

    it('should handle AI expansion failure', async () => {
      (aiWritingService.generateContent as vi.Mock).mockRejectedValue(new Error('AI service error'));

      const beat = sceneBeatService.createBeat(testSceneId, 'Hero draws sword', 'action');
      
      await expect(sceneBeatService.expandBeat(beat.id, testSceneId)).rejects.toThrow('Failed to expand beat with AI');
    });
  });

  describe('Beat Suggestions', () => {
    it('should get AI-powered beat suggestions', async () => {
      const mockSuggestions = [
        { type: 'dialogue', content: 'Character responds to action', confidence: 0.8 },
        { type: 'description', content: 'Describe the aftermath', confidence: 0.6 },
      ];
      (aiWritingService.generateContent as any).mockResolvedValue(JSON.stringify(mockSuggestions));

      sceneBeatService.createBeat(testSceneId, 'Hero fights monster', 'action');
      const suggestions = await sceneBeatService.getBeatSuggestions(testSceneId, 'Current content', 100);

      expect(suggestions).toEqual(mockSuggestions);
    });

    it('should provide fallback suggestions when AI fails', async () => {
      (aiWritingService.generateContent as vi.Mock).mockRejectedValue(new Error('AI error'));

      const suggestions = await sceneBeatService.getBeatSuggestions(testSceneId, 'Content', 0);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('content');
      expect(suggestions[0]).toHaveProperty('confidence');
    });
  });

  describe('Template Application', () => {
    it('should apply beat template', () => {
      const newBeats = sceneBeatService.applyTemplate(testSceneId, 'action-sequence');

      expect(newBeats.length).toBeGreaterThan(0);
      expect(newBeats.every(beat => beat.id && beat.type && beat.content)).toBe(true);
    });

    it('should apply template with context', () => {
      const context = {
        characters: ['Alice', 'Bob'],
        location: 'Castle',
      };

      const newBeats = sceneBeatService.applyTemplate(testSceneId, 'dialogue-heavy', context);
      
      // Check that character and location placeholders were replaced
      const hasCharacterContent = newBeats.some(beat => 
        beat.content.includes('Alice') || beat.content.includes('Bob')
      );
      const hasLocationContent = newBeats.some(beat => 
        beat.content.includes('Castle')
      );

      expect(hasCharacterContent).toBe(true);
      expect(hasLocationContent).toBe(true);
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        sceneBeatService.applyTemplate(testSceneId, 'non-existent-template');
      }).toThrow('Template not found');
    });
  });

  describe('Beat Management', () => {
    it('should retrieve beats by scene', () => {
      sceneBeatService.createBeat(testSceneId, 'Beat 1', 'action');
      sceneBeatService.createBeat(testSceneId, 'Beat 2', 'dialogue');
      sceneBeatService.createBeat('other-scene', 'Other beat', 'description');

      const sceneBeats = sceneBeatService.getSceneBeats(testSceneId);
      expect(sceneBeats).toHaveLength(2);
      expect(sceneBeats.every(beat => beat.content.includes('Beat'))).toBe(true);
    });

    it('should update beat', () => {
      const beat = sceneBeatService.createBeat(testSceneId, 'Original content', 'action');
      const updated = sceneBeatService.updateBeat(testSceneId, beat.id, {
        content: 'Updated content',
        type: 'dialogue',
      });

      expect(updated).toBeTruthy();
      expect(updated?.content).toBe('Updated content');
      expect(updated?.type).toBe('dialogue');
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete beat', () => {
      const beat = sceneBeatService.createBeat(testSceneId, 'To be deleted', 'action');
      const deleted = sceneBeatService.deleteBeat(testSceneId, beat.id);

      expect(deleted).toBe(true);
      
      const beats = sceneBeatService.getSceneBeats(testSceneId);
      expect(beats.find(b => b.id === beat.id)).toBeUndefined();
    });

    it('should reorder beats when one is deleted', () => {
      const beat1 = sceneBeatService.createBeat(testSceneId, 'Beat 1', 'action');
      const beat2 = sceneBeatService.createBeat(testSceneId, 'Beat 2', 'dialogue');
      const beat3 = sceneBeatService.createBeat(testSceneId, 'Beat 3', 'description');

      sceneBeatService.deleteBeat(testSceneId, beat2.id);

      const beats = sceneBeatService.getSceneBeats(testSceneId);
      expect(beats).toHaveLength(2);
      expect(beats[0].position).toBe(0);
      expect(beats[1].position).toBe(1);
    });

    it('should move beat to new position', () => {
      const beat1 = sceneBeatService.createBeat(testSceneId, 'Beat 1', 'action');
      const beat2 = sceneBeatService.createBeat(testSceneId, 'Beat 2', 'dialogue');
      const beat3 = sceneBeatService.createBeat(testSceneId, 'Beat 3', 'description');

      const moved = sceneBeatService.moveBeat(testSceneId, beat3.id, 0);
      expect(moved).toBe(true);

      const beats = sceneBeatService.getSceneBeats(testSceneId);
      expect(beats[0].content).toBe('Beat 3');
      expect(beats[1].content).toBe('Beat 1');
      expect(beats[2].content).toBe('Beat 2');
    });
  });

  describe('Scene Prose Generation', () => {
    it('should generate prose from all beats', async () => {
      const mockExpansions = [
        'Expanded beat 1 content.',
        'Expanded beat 2 content.',
      ];
      
      (aiWritingService.generateContent as vi.Mock)
        .mockResolvedValueOnce(mockExpansions[0])
        .mockResolvedValueOnce(mockExpansions[1]);

      sceneBeatService.createBeat(testSceneId, 'Beat 1', 'action');
      sceneBeatService.createBeat(testSceneId, 'Beat 2', 'dialogue');

      const prose = await sceneBeatService.generateSceneProse(testSceneId);

      expect(prose).toBe(mockExpansions.join('\n\n'));
    });

    it('should use already expanded beats', async () => {
      const beat1 = sceneBeatService.createBeat(testSceneId, 'Beat 1', 'action');
      const beat2 = sceneBeatService.createBeat(testSceneId, 'Beat 2', 'dialogue');

      // Pre-expand one beat
      beat1.isExpanded = true;
      beat1.expandedContent = 'Already expanded content.';

      (aiWritingService.generateContent as any).mockResolvedValue('New expansion.');

      const prose = await sceneBeatService.generateSceneProse(testSceneId);

      expect(prose).toBe('Already expanded content.\n\nNew expansion.');
      expect(aiWritingService.generateContent).toHaveBeenCalledTimes(1); // Only for the unexpanded beat
    });
  });

  describe('Templates', () => {
    it('should get all templates', () => {
      const templates = sceneBeatService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('beats');
    });

    it('should get templates by category', () => {
      const actionTemplates = sceneBeatService.getTemplatesByCategory('action');
      expect(actionTemplates.every(t => t.category === 'action')).toBe(true);
    });

    it('should create custom template', () => {
      const customTemplate = sceneBeatService.createCustomTemplate({
        name: 'Custom Action Scene',
        description: 'My custom action template',
        category: 'action',
        beats: [
          { type: 'description', content: 'Set the scene' },
          { type: 'action', content: 'Action begins' },
        ],
      });

      expect(customTemplate.id).toBeDefined();
      expect(customTemplate.name).toBe('Custom Action Scene');
      
      const templates = sceneBeatService.getTemplates();
      expect(templates).toContain(customTemplate);
    });
  });
});