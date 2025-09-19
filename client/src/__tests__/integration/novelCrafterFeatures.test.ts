/**
 * NovelCrafter Features Integration Tests
 * Tests the complete workflow of the new core writing features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sceneBeatService } from '../../services/sceneBeatService';
import { workspaceLayoutService } from '../../services/workspaceLayoutService';
import { documentStructureService } from '../../services/documentStructureService';
import { templateService } from '../../services/templateService';

// Mock AI service
vi.mock('../../services/aiWritingService', () => ({
  aiWritingService: {
    generateContent: vi.fn(),
  },
}));

import { aiWritingService } from '../../services/aiWritingService';

// TODO: Fix NovelCrafter integration tests - service mocking and workflow issues
describe.skip('NovelCrafter Features Integration', () => {
  const projectId = 'test-project';
  const documentId = 'test-document';
  const sceneId = 'test-scene';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Novel Writing Workflow', () => {
    it('should complete end-to-end novel creation workflow', async () => {
      // 1. Apply a novel template
      const templateResult = templateService.applyTemplate('three-act-novel', {
        title: 'My Fantasy Novel',
        genre: 'fantasy',
        characters: ['Hero', 'Mentor', 'Villain'],
        location: 'Medieval Kingdom',
      });

      expect(templateResult.sections.length).toBeGreaterThan(0);
      expect(templateResult.metadata.templateId).toBe('three-act-novel');

      // 2. Set up workspace layout for novel writing
      const layoutSet = workspaceLayoutService.setActiveLayout('scene-builder');
      expect(layoutSet).toBe(true);

      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('scene-builder');

      // Configure panels for writing
      workspaceLayoutService.setPanelState('main-editor', { width: 60 });
      workspaceLayoutService.setPanelState('beats-panel', { width: 20 });
      workspaceLayoutService.setPanelState('characters-panel', { width: 20 });

      // 3. Create document structure from template
      templateResult.sections.forEach((section, index) => {
        documentStructureService.createMarker(
          documentId,
          section.type as any,
          section.title,
          index * 1000, // Simulate position in document
          {
            level: section.type === 'act' ? 1 : 2,
            metadata: {
              wordCount: section.estimatedWordCount,
              status: 'draft',
            },
          }
        );
      });

      const markers = documentStructureService.getMarkers(documentId);
      expect(markers.length).toBe(templateResult.sections.length);

      // 4. Generate navigation structure
      const navigation = documentStructureService.generateNavigation(documentId);
      expect(navigation.length).toBeGreaterThan(0);

      // 5. Create scene beats for first chapter
      const chapterMarker = markers.find(m => m.type === 'act');
      if (chapterMarker) {
        // Create beats from slash commands
        const content = '/action Hero enters tavern /dialogue "I need a room" /desc The tavern is crowded';
        const newBeats = await sceneBeatService.processSlashCommands(sceneId, content);
        
        expect(newBeats.length).toBe(3);
        expect(newBeats[0].type).toBe('action');
        expect(newBeats[1].type).toBe('dialogue');
        expect(newBeats[2].type).toBe('description');

        // 6. Expand beats to prose
        (aiWritingService.generateContent as any)
          .mockResolvedValueOnce('The hero pushed through the heavy wooden door of the tavern.')
          .mockResolvedValueOnce('"I need a room for the night," the hero said to the bartender.')
          .mockResolvedValueOnce('The tavern was filled with the chatter of patrons and the smell of ale.');

        for (const beat of newBeats) {
          await sceneBeatService.expandBeat(beat.id, sceneId, {
            tone: 'dramatic',
            style: 'detailed',
            perspective: 'third-limited',
          });
        }

        const sceneBeats = sceneBeatService.getSceneBeats(sceneId);
        expect(sceneBeats.every(beat => beat.isExpanded)).toBe(true);

        // 7. Generate complete scene prose
        const sceneProse = await sceneBeatService.generateSceneProse(sceneId);
        expect(sceneProse).toContain('tavern');
        expect(sceneProse.split('\n\n')).toHaveLength(3); // Three expanded beats
      }

      // 8. Create alternative versions for revision
      const firstMarker = markers[0];
      const alternative = documentStructureService.createAlternative(
        documentId,
        firstMarker.id,
        'Revised Opening',
        'Alternative opening scene content...',
        {
          description: 'More action-packed opening',
          author: 'Author Name',
        }
      );

      expect(alternative.isActive).toBe(true);

      const alternatives = documentStructureService.getAlternatives(documentId, firstMarker.id);
      expect(alternatives).toContain(alternative);

      // 9. Test workspace state persistence
      const panelState = workspaceLayoutService.getPanelState('main-editor');
      expect(panelState?.width).toBe(60);

      // 10. Float a panel for research
      workspaceLayoutService.floatPanel('characters-panel', { x: 100, y: 100 });
      expect(workspaceLayoutService.isFloating('characters-panel')).toBe(true);
    });

    it('should handle complex template application with customization', () => {
      // Apply hero's journey template
      const result = templateService.applyTemplate('heros-journey', {
        characters: ['Hero', 'Mentor', 'Villain', 'Ally'],
        location: 'Fantasy Realm',
      });

      // Verify character placeholders were replaced
      const hasCharacterContent = result.sections.some(section => 
        section.content && (
          section.content.includes('Hero') || 
          section.content.includes('Mentor')
        )
      );
      expect(hasCharacterContent).toBe(true);

      // Verify location placeholders were replaced
      const hasLocationContent = result.sections.some(section =>
        section.content && section.content.includes('Fantasy Realm')
      );
      expect(hasLocationContent).toBe(true);

      // Create document structure with proper hierarchy
      let position = 0;
      result.sections.forEach(section => {
        const marker = documentStructureService.createMarker(
          documentId,
          'section',
          section.title,
          position,
          {
            level: section.order <= 2 ? 1 : 2, // First two are top-level
            metadata: {
              estimatedReadingTime: section.estimatedWordCount ? 
                Math.ceil((section.estimatedWordCount || 0) / 200) : undefined,
              purpose: section.metadata?.purpose,
            },
          }
        );
        position += 1000;
      });

      const navigation = documentStructureService.generateNavigation(documentId);
      expect(navigation.length).toBeGreaterThan(0);

      // Check hierarchical structure
      const topLevelItems = navigation.filter(item => item.level === 1);
      const secondLevelItems = navigation.filter(item => item.level === 2);
      
      expect(topLevelItems.length).toBeGreaterThan(0);
      expect(secondLevelItems.length).toBeGreaterThan(0);
    });

    it('should support multi-genre template workflow', () => {
      // Create a romance-mystery hybrid workflow
      
      // 1. Start with romance template
      const romanceResult = templateService.applyTemplate('romance-novel', {
        characters: ['Detective', 'Suspect'],
        setting: 'Small Town',
      });

      // 2. Add mystery elements using custom beats
      sceneBeatService.createBeat(sceneId, 'Crime is discovered', 'conflict');
      sceneBeatService.createBeat(sceneId, 'Detective meets suspect', 'dialogue');
      sceneBeatService.createBeat(sceneId, 'Tension builds between them', 'emotion');
      sceneBeatService.createBeat(sceneId, 'Clue points to suspect', 'description');

      const beats = sceneBeatService.getSceneBeats(sceneId);
      expect(beats.length).toBe(4);

      // 3. Apply mystery template structure to document
      const mysteryResult = templateService.applyTemplate('mystery-novel', {});
      
      // Create mixed structure
      const mixedSections = [
        ...romanceResult.sections.slice(0, 3), // Romance opening
        ...mysteryResult.sections.slice(2, 5), // Mystery investigation
        ...romanceResult.sections.slice(-2), // Romance resolution
      ];

      mixedSections.forEach((section, index) => {
        documentStructureService.createMarker(
          `${documentId}-mixed`,
          section.type as any,
          `${section.title} (Hybrid)`,
          index * 1000,
          { level: section.order <= 3 ? 1 : 2 }
        );
      });

      const mixedNavigation = documentStructureService.generateNavigation(`${documentId}-mixed`);
      expect(mixedNavigation.length).toBe(mixedSections.length);
    });
  });

  describe('Advanced Feature Combinations', () => {
    it('should handle beat templates with document markers', () => {
      // Create document markers for scene structure
      const markers = [
        documentStructureService.createMarker(documentId, 'scene', 'Opening Scene', 0),
        documentStructureService.createMarker(documentId, 'scene', 'Conflict Scene', 1000),
        documentStructureService.createMarker(documentId, 'scene', 'Resolution Scene', 2000),
      ];

      // Apply beat template to each scene
      markers.forEach((marker, index) => {
        const sceneId = `scene-${index}`;
        
        if (index === 0) {
          // Opening scene - use tension builder
          sceneBeatService.applyTemplate(sceneId, 'tension-builder');
        } else if (index === 1) {
          // Conflict scene - use action sequence
          sceneBeatService.applyTemplate(sceneId, 'action-sequence');
        } else {
          // Resolution scene - use emotional moment
          sceneBeatService.applyTemplate(sceneId, 'emotional-moment');
        }

        const sceneBeats = sceneBeatService.getSceneBeats(sceneId);
        expect(sceneBeats.length).toBeGreaterThan(0);
      });

      // Create alternatives for each scene
      markers.forEach(marker => {
        const alt = documentStructureService.createAlternative(
          documentId,
          marker.id,
          'Alternative Version',
          'Different approach to this scene...'
        );
        expect(alt.isActive).toBe(true);
      });

      const docStats = documentStructureService.getDocumentStats(documentId);
      expect(docStats.totalSections).toBe(3);
      expect(docStats.totalAlternatives).toBe(3);
    });

    it('should support workspace customization for different writing phases', () => {
      // Planning phase - use planning layout
      workspaceLayoutService.setActiveLayout('planning-overview');
      
      let currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('planning-overview');
      
      // Configure for outline creation
      workspaceLayoutService.setPanelState('timeline-panel', { width: 50 });
      workspaceLayoutService.setPanelState('outline-panel', { width: 50 });

      // Drafting phase - switch to scene builder
      workspaceLayoutService.setActiveLayout('scene-builder');
      
      currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('scene-builder');

      // Configure for scene writing
      workspaceLayoutService.setPanelState('main-editor', { width: 60 });
      workspaceLayoutService.setPanelState('beats-panel', { width: 20 });
      workspaceLayoutService.setPanelState('characters-panel', { width: 20 });

      // Research phase - switch to research layout
      workspaceLayoutService.setActiveLayout('research-mode');
      
      currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('research-mode');

      // Float research panel for easy access
      workspaceLayoutService.floatPanel('research-panel', { x: 50, y: 50 });
      expect(workspaceLayoutService.isFloating('research-panel')).toBe(true);

      // Final editing - distraction free
      workspaceLayoutService.setActiveLayout('distraction-free');
      
      currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe('distraction-free');
      expect(currentLayout?.panels.length).toBe(1); // Only editor
    });

    it('should handle version comparison and conflict resolution', () => {
      // Create a section with multiple alternatives
      const marker = documentStructureService.createMarker(
        documentId,
        'scene',
        'Critical Scene',
        0
      );

      const alt1 = documentStructureService.createAlternative(
        documentId,
        marker.id,
        'Version 1',
        'The hero approached the castle gates with confidence.'
      );

      const alt2 = documentStructureService.createAlternative(
        documentId,
        marker.id,
        'Version 2',
        'The hero approached the castle gates with trepidation and fear.'
      );

      const alt3 = documentStructureService.createAlternative(
        documentId,
        marker.id,
        'Version 3',
        'Nervously, the hero crept toward the imposing castle entrance.'
      );

      // Compare versions
      const comparison = documentStructureService.compareAlternatives(
        documentId,
        marker.id,
        alt1.id,
        alt2.id
      );

      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.similarity).toBeGreaterThan(0);
      expect(comparison.similarity).toBeLessThanOrEqual(1);

      // Activate specific version
      documentStructureService.setActiveAlternative(documentId, marker.id, alt2.id);
      
      const activeAlt = documentStructureService.getActiveAlternative(documentId, marker.id);
      expect(activeAlt?.id).toBe(alt2.id);

      // Ensure only one is active
      const allAlts = documentStructureService.getAlternatives(documentId, marker.id);
      const activeCount = allAlts.filter(alt => alt.isActive).length;
      expect(activeCount).toBe(1);
    });
  });

  describe('Performance and Scale', () => {
    it('should handle large document with many sections', () => {
      // Create a large document structure
      const sectionCount = 50;
      
      for (let i = 0; i < sectionCount; i++) {
        documentStructureService.createMarker(
          `${documentId}-large`,
          i % 3 === 0 ? 'chapter' : 'scene',
          `Section ${i + 1}`,
          i * 1000,
          { level: i % 3 === 0 ? 1 : 2 }
        );
      }

      const markers = documentStructureService.getMarkers(`${documentId}-large`);
      expect(markers.length).toBe(sectionCount);

      // Generate navigation efficiently
      const start = performance.now();
      const navigation = documentStructureService.generateNavigation(`${documentId}-large`);
      const end = performance.now();
      
      expect(navigation.length).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(100); // Should be fast

      // Test filtering
      const chapters = documentStructureService.getMarkers(`${documentId}-large`, 'chapter');
      const scenes = documentStructureService.getMarkers(`${documentId}-large`, 'scene');
      
      expect(chapters.length + scenes.length).toBe(sectionCount);
    });

    it('should handle multiple workspaces efficiently', () => {
      // Create and switch between multiple layouts rapidly
      const layouts = ['writer-focused', 'scene-builder', 'research-mode', 'planning-overview'];
      
      layouts.forEach(layoutId => {
        const start = performance.now();
        workspaceLayoutService.setActiveLayout(layoutId);
        const end = performance.now();
        
        expect(end - start).toBeLessThan(50); // Fast switching
        
        const current = workspaceLayoutService.getCurrentLayout();
        expect(current?.id).toBe(layoutId);
      });

      // Test panel state persistence across switches
      workspaceLayoutService.setActiveLayout('scene-builder');
      workspaceLayoutService.setPanelState('main-editor', { width: 75 });
      
      workspaceLayoutService.setActiveLayout('writer-focused');
      workspaceLayoutService.setActiveLayout('scene-builder');
      
      const state = workspaceLayoutService.getPanelState('main-editor');
      expect(state?.width).toBe(75); // State should persist
    });

    it('should efficiently process many beats and expansions', async () => {
      // Create many beats
      const beatCount = 20;
      const mockExpansions = Array.from({ length: beatCount }, (_, i) => 
        `Expanded content for beat ${i + 1}.`
      );

      (aiWritingService.generateContent as vi.Mock)
        .mockImplementation(() => Promise.resolve(mockExpansions.pop()));

      for (let i = 0; i < beatCount; i++) {
        sceneBeatService.createBeat(
          `${sceneId}-large`,
          `Beat ${i + 1}`,
          ['action', 'dialogue', 'description'][i % 3] as any
        );
      }

      const beats = sceneBeatService.getSceneBeats(`${sceneId}-large`);
      expect(beats.length).toBe(beatCount);

      // Expand all beats
      const start = performance.now();
      
      for (const beat of beats) {
        await sceneBeatService.expandBeat(beat.id, `${sceneId}-large`);
      }
      
      const end = performance.now();
      
      // Should complete in reasonable time (allowing for async operations)
      expect(end - start).toBeLessThan(5000);

      // Verify all expanded
      const expandedBeats = sceneBeatService.getSceneBeats(`${sceneId}-large`);
      expect(expandedBeats.every(beat => beat.isExpanded)).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      (aiWritingService.generateContent as vi.Mock).mockRejectedValue(
        new Error('AI service unavailable')
      );

      const beat = sceneBeatService.createBeat(sceneId, 'Test beat', 'action');
      
      await expect(
        sceneBeatService.expandBeat(beat.id, sceneId)
      ).rejects.toThrow('Failed to expand beat with AI');

      // Beat should remain unexpanded but intact
      const retrievedBeat = sceneBeatService.getBeat(sceneId, beat.id);
      expect(retrievedBeat?.isExpanded).toBe(false);
      expect(retrievedBeat?.content).toBe('Test beat');
    });

    it('should provide fallback suggestions when AI fails', async () => {
      (aiWritingService.generateContent as vi.Mock).mockRejectedValue(
        new Error('AI service error')
      );

      // Should still provide suggestions
      const suggestions = await sceneBeatService.getBeatSuggestions(sceneId, 'content', 0);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('content');
      expect(suggestions[0]).toHaveProperty('confidence');
    });

    it('should recover from corrupted workspace state', () => {
      // Simulate corrupted state
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn().mockReturnValue('invalid json');

      // Should use defaults without crashing
      const layouts = workspaceLayoutService.getLayouts();
      expect(layouts.length).toBeGreaterThan(0);

      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout).toBeTruthy();

      // Restore original function
      Storage.prototype.getItem = originalGetItem;
    });
  });
});

describe('Feature Integration Scenarios', () => {
  it('should support collaborative writing workflow', () => {
    // Simulate multiple writers working on different sections
    const writers = ['Alice', 'Bob', 'Charlie'];
    const sections = ['chapter-1', 'chapter-2', 'chapter-3'];

    sections.forEach((sectionId, index) => {
      const writer = writers[index];
      
      // Each writer creates their section structure
      const marker = documentStructureService.createMarker(
        'collaborative-doc',
        'chapter',
        `Chapter ${index + 1}`,
        index * 5000,
        {
          metadata: {
            author: writer,
            status: 'draft',
          },
        }
      );

      // Create multiple versions for review
      const draft1 = documentStructureService.createAlternative(
        'collaborative-doc',
        marker.id,
        `${writer}'s First Draft`,
        `First draft content by ${writer}...`,
        { author: writer }
      );

      const draft2 = documentStructureService.createAlternative(
        'collaborative-doc',
        marker.id,
        `${writer}'s Revised Draft`,
        `Revised content by ${writer}...`,
        { author: writer, changeDescription: 'Improved character development' }
      );

      // Set most recent as active
      documentStructureService.setActiveAlternative('collaborative-doc', marker.id, draft2.id);
    });

    // Verify collaborative structure
    const markers = documentStructureService.getMarkers('collaborative-doc');
    expect(markers.length).toBe(3);

    const docStats = documentStructureService.getDocumentStats('collaborative-doc');
    expect(docStats.totalAlternatives).toBe(6); // 2 per section
  });

  it('should support genre-specific writing environments', () => {
    const genres = [
      { name: 'fantasy', template: 'heros-journey', layout: 'scene-builder' },
      { name: 'mystery', template: 'mystery-novel', layout: 'research-mode' },
      { name: 'romance', template: 'romance-novel', layout: 'writer-focused' },
    ];

    genres.forEach(({ name, template, layout }) => {
      // Apply genre template
      const result = templateService.applyTemplate(template, {
        genre: name,
        setting: `${name} setting`,
      });

      expect(result.sections.length).toBeGreaterThan(0);

      // Set appropriate workspace
      workspaceLayoutService.setActiveLayout(layout);
      const currentLayout = workspaceLayoutService.getCurrentLayout();
      expect(currentLayout?.id).toBe(layout);

      // Create genre-appropriate document structure
      result.sections.forEach((section, index) => {
        documentStructureService.createMarker(
          `${name}-novel`,
          section.type as any,
          section.title,
          index * 1000,
          {
            tags: [name, section.type],
            metadata: {
              genre: name,
              estimatedWordCount: section.estimatedWordCount,
            },
          }
        );
      });

      const markers = documentStructureService.getMarkers(`${name}-novel`);
      expect(markers.length).toBe(result.sections.length);
    });
  });
});