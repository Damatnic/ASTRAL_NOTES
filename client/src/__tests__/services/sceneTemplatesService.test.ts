import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sceneTemplatesService } from '../../services/sceneTemplatesService';
import type { SceneTemplate, TemplateCustomization, SceneGeneration } from '../../services/sceneTemplatesService';

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

describe('SceneTemplatesService', () => {
  const testUserId = 'test-user-1';
  const testAuthor = 'Test Author';

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
    
    // Clear all internal state
    sceneTemplatesService['templates'].clear();
    sceneTemplatesService['customizations'].clear();
    sceneTemplatesService['generations'].clear();
    sceneTemplatesService['analytics'].clear();
    
    // Reinitialize official templates
    sceneTemplatesService['initializeOfficialTemplates']();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Template Management', () => {
    it('should initialize with official templates', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.metadata.isOfficial)).toBe(true);
      expect(templates.some(t => t.title === 'Action Sequence')).toBe(true);
      expect(templates.some(t => t.title === 'Intimate Dialogue')).toBe(true);
    });

    it('should get template by ID', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const firstTemplate = templates[0];
      
      const retrieved = sceneTemplatesService.getTemplate(firstTemplate.id);
      
      expect(retrieved).toEqual(firstTemplate);
    });

    it('should return null for non-existent template', () => {
      const retrieved = sceneTemplatesService.getTemplate('non-existent-id');
      
      expect(retrieved).toBeNull();
    });

    it('should get templates by genre', () => {
      const actionTemplates = sceneTemplatesService.getTemplatesByGenre('Action');
      
      expect(actionTemplates.length).toBeGreaterThan(0);
      expect(actionTemplates.every(t => t.genre.includes('Action'))).toBe(true);
    });

    it('should get templates by category', () => {
      const actionTemplates = sceneTemplatesService.getTemplatesByCategory('action');
      
      expect(actionTemplates.length).toBeGreaterThan(0);
      expect(actionTemplates.every(t => t.category === 'action')).toBe(true);
    });

    it('should get templates by difficulty', () => {
      const beginnerTemplates = sceneTemplatesService.getTemplatesByDifficulty('beginner');
      
      expect(beginnerTemplates.length).toBeGreaterThan(0);
      expect(beginnerTemplates.every(t => t.difficulty === 'beginner')).toBe(true);
    });

    it('should search templates by query', () => {
      const results = sceneTemplatesService.searchTemplates('action sequence');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.title.toLowerCase().includes('action'))).toBe(true);
    });

    it('should search templates with multiple terms', () => {
      const results = sceneTemplatesService.searchTemplates('dialogue character');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => 
        t.title.toLowerCase().includes('dialogue') || 
        t.category === 'dialogue' ||
        t.tags.includes('character development')
      )).toBe(true);
    });
  });

  describe('Custom Template Creation', () => {
    it('should create custom template from scratch', () => {
      const templateData = {
        title: 'Custom Mystery Scene',
        description: 'A custom mystery scene template',
        genre: 'Mystery',
        category: 'plot' as const,
        difficulty: 'intermediate' as const,
        tags: ['mystery', 'investigation', 'clues']
      };

      const template = sceneTemplatesService.createCustomTemplate(null, templateData, testAuthor);

      expect(template.id).toBeTruthy();
      expect(template.title).toBe(templateData.title);
      expect(template.description).toBe(templateData.description);
      expect(template.genre).toBe(templateData.genre);
      expect(template.category).toBe(templateData.category);
      expect(template.difficulty).toBe(templateData.difficulty);
      expect(template.tags).toEqual(templateData.tags);
      expect(template.metadata.author).toBe(testAuthor);
      expect(template.metadata.isOfficial).toBe(false);
      expect(template.metadata.isCustom).toBe(true);
      expect(template.structure).toBeDefined();
      expect(template.prompts).toBeDefined();
    });

    it('should create custom template based on existing template', () => {
      const existingTemplates = sceneTemplatesService.getAllTemplates();
      const baseTemplate = existingTemplates[0];

      const customTemplate = sceneTemplatesService.createCustomTemplate(
        baseTemplate.id,
        {
          title: 'Modified Action Scene',
          description: 'A modified version of the action template'
        },
        testAuthor
      );

      expect(customTemplate.title).toBe('Modified Action Scene');
      expect(customTemplate.structure).toEqual(baseTemplate.structure);
      expect(customTemplate.prompts.length).toBeGreaterThanOrEqual(baseTemplate.prompts.length);
    });

    it('should update custom template', () => {
      const customTemplate = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'Original Title', genre: 'Original Genre' },
        testAuthor
      );

      const updated = sceneTemplatesService.updateTemplate(customTemplate.id, {
        title: 'Updated Title',
        genre: 'Updated Genre'
      });

      expect(updated).toBeTruthy();
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.genre).toBe('Updated Genre');
      expect(updated!.metadata.updatedAt.getTime()).toBeGreaterThanOrEqual(customTemplate.metadata.createdAt.getTime());
    });

    it('should not update official template', () => {
      const officialTemplates = sceneTemplatesService.getAllTemplates();
      const officialTemplate = officialTemplates.find(t => t.metadata.isOfficial);

      const updated = sceneTemplatesService.updateTemplate(officialTemplate!.id, {
        title: 'Should Not Update'
      });

      expect(updated).toBeNull();
    });

    it('should delete custom template', () => {
      const customTemplate = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'To Be Deleted' },
        testAuthor
      );

      const deleted = sceneTemplatesService.deleteTemplate(customTemplate.id);
      const retrieved = sceneTemplatesService.getTemplate(customTemplate.id);

      expect(deleted).toBe(true);
      expect(retrieved).toBeNull();
    });

    it('should not delete official template', () => {
      const officialTemplates = sceneTemplatesService.getAllTemplates();
      const officialTemplate = officialTemplates.find(t => t.metadata.isOfficial);

      const deleted = sceneTemplatesService.deleteTemplate(officialTemplate!.id);

      expect(deleted).toBe(false);
    });
  });

  describe('Template Usage and Analytics', () => {
    it('should track template usage', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];
      const originalUsageCount = template.metadata.usageCount;

      const usedTemplate = sceneTemplatesService.useTemplate(template.id, testUserId);

      expect(usedTemplate).toBeTruthy();
      expect(usedTemplate!.metadata.usageCount).toBe(originalUsageCount + 1);
      expect(usedTemplate!.metadata.popularity).toBeGreaterThanOrEqual(template.metadata.popularity);
    });

    it('should handle usage of non-existent template', () => {
      const result = sceneTemplatesService.useTemplate('non-existent', testUserId);
      expect(result).toBeNull();
    });

    it('should rate template', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];
      const originalRating = template.metadata.rating;

      const rated = sceneTemplatesService.rateTemplate(template.id, 5, testUserId);
      const updatedTemplate = sceneTemplatesService.getTemplate(template.id);

      expect(rated).toBe(true);
      expect(updatedTemplate!.metadata.rating).toBeGreaterThanOrEqual(originalRating);
    });

    it('should reject invalid ratings', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const invalidLow = sceneTemplatesService.rateTemplate(template.id, 0, testUserId);
      const invalidHigh = sceneTemplatesService.rateTemplate(template.id, 6, testUserId);

      expect(invalidLow).toBe(false);
      expect(invalidHigh).toBe(false);
    });

    it('should get popular templates', () => {
      // Use a few templates to create popularity
      const templates = sceneTemplatesService.getAllTemplates();
      sceneTemplatesService.useTemplate(templates[0].id);
      sceneTemplatesService.useTemplate(templates[0].id);
      sceneTemplatesService.useTemplate(templates[1].id);

      const popular = sceneTemplatesService.getPopularTemplates(5);

      expect(popular.length).toBeGreaterThan(0);
      expect(popular.length).toBeLessThanOrEqual(5);
      // Most used template should be first
      expect(popular[0].metadata.usageCount).toBeGreaterThanOrEqual(popular[1]?.metadata.usageCount || 0);
    });

    it('should get trending templates', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      sceneTemplatesService.useTemplate(templates[0].id);

      const trending = sceneTemplatesService.getTrendingTemplates('week');

      expect(Array.isArray(trending)).toBe(true);
      expect(trending.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Scene Generation', () => {
    it('should generate scene from template', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const customizations = {
        genre: 'Fantasy',
        characters: ['Hero', 'Villain'],
        setting: 'Dark Forest',
        mood: 'Tense',
        pointOfView: 'third-limited' as const,
        tense: 'past' as const,
        tone: 'Serious',
        conflict: 'Battle for survival',
        theme: 'Good vs Evil'
      };

      const generation = sceneTemplatesService.generateScene(template.id, customizations);

      expect(generation.templateId).toBe(template.id);
      expect(generation.customizations).toEqual(customizations);
      expect(generation.generatedContent.outline).toBeTruthy();
      expect(generation.generatedContent.opening).toBeTruthy();
      expect(generation.generatedContent.keyScenes.length).toBeGreaterThan(0);
      expect(generation.generatedContent.transitions.length).toBeGreaterThan(0);
      expect(generation.generatedContent.notes.length).toBeGreaterThan(0);
      expect(generation.metadata.estimatedLength).toBeGreaterThan(0);
      expect(generation.metadata.complexity).toBeGreaterThan(0);
    });

    it('should throw error for non-existent template in generation', () => {
      const customizations = {
        genre: 'Fantasy',
        characters: ['Hero'],
        setting: 'Forest',
        mood: 'Peaceful',
        pointOfView: 'first' as const,
        tense: 'present' as const,
        tone: 'Light',
        conflict: 'None',
        theme: 'Nature'
      };

      expect(() => {
        sceneTemplatesService.generateScene('non-existent', customizations);
      }).toThrow('Template not found');
    });

    it('should generate different content for different customizations', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const customizations1 = {
        genre: 'Horror',
        characters: ['Victim'],
        setting: 'Haunted House',
        mood: 'Terrifying',
        pointOfView: 'first' as const,
        tense: 'present' as const,
        tone: 'Dark',
        conflict: 'Supernatural threat',
        theme: 'Fear'
      };

      const customizations2 = {
        genre: 'Romance',
        characters: ['Lover 1', 'Lover 2'],
        setting: 'Beach',
        mood: 'Romantic',
        pointOfView: 'third-limited' as const,
        tense: 'past' as const,
        tone: 'Warm',
        conflict: 'Misunderstanding',
        theme: 'Love'
      };

      const generation1 = sceneTemplatesService.generateScene(template.id, customizations1);
      const generation2 = sceneTemplatesService.generateScene(template.id, customizations2);

      expect(generation1.generatedContent.outline).not.toBe(generation2.generatedContent.outline);
      expect(generation1.generatedContent.opening).not.toBe(generation2.generatedContent.opening);
    });
  });

  describe('Template Customization', () => {
    it('should save template customization', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const customization: TemplateCustomization = {
        templateId: template.id,
        userId: testUserId,
        customizations: {
          title: 'My Custom Version',
          description: 'My personalized template',
          structure: {
            sections: [],
            pacing: [],
            transitions: [],
            requirements: ['Custom requirement'],
            optional: []
          },
          additionalPrompts: [],
          personalNotes: 'My notes here'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      sceneTemplatesService.saveCustomization(customization);

      const userCustomizations = sceneTemplatesService.getUserCustomizations(testUserId);
      const templateCustomizations = sceneTemplatesService.getTemplateCustomizations(template.id);

      expect(userCustomizations.length).toBe(1);
      expect(userCustomizations[0].customizations.title).toBe('My Custom Version');
      expect(templateCustomizations.length).toBe(1);
      expect(templateCustomizations[0].userId).toBe(testUserId);
    });

    it('should get user customizations sorted by date', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template1 = templates[0];
      const template2 = templates[1];

      const customization1: TemplateCustomization = {
        templateId: template1.id,
        userId: testUserId,
        customizations: { title: 'First', description: '', structure: {}, additionalPrompts: [], personalNotes: '' },
        createdAt: new Date(Date.now() - 1000),
        updatedAt: new Date(Date.now() - 1000)
      };

      const customization2: TemplateCustomization = {
        templateId: template2.id,
        userId: testUserId,
        customizations: { title: 'Second', description: '', structure: {}, additionalPrompts: [], personalNotes: '' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      sceneTemplatesService.saveCustomization(customization1);
      sceneTemplatesService.saveCustomization(customization2);

      const userCustomizations = sceneTemplatesService.getUserCustomizations(testUserId);

      expect(userCustomizations.length).toBe(2);
      expect(userCustomizations[0].customizations.title).toBe('Second'); // Most recent first
      expect(userCustomizations[1].customizations.title).toBe('First');
    });
  });

  describe('Analytics and Insights', () => {
    it('should get template analytics', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      // Use template to generate analytics
      sceneTemplatesService.useTemplate(template.id);

      const analytics = sceneTemplatesService.getTemplateAnalytics(template.id);

      expect(analytics).toBeTruthy();
      expect(analytics!.templateId).toBe(template.id);
      expect(analytics!.usage.totalUses).toBeGreaterThan(0);
    });

    it('should return null for analytics of non-existent template', () => {
      const analytics = sceneTemplatesService.getTemplateAnalytics('non-existent');
      expect(analytics).toBeNull();
    });

    it('should get recommendations based on preferences', () => {
      const preferences = {
        genres: ['Action', 'Adventure'],
        categories: ['action'],
        difficulty: 'intermediate'
      };

      const recommendations = sceneTemplatesService.getRecommendations(testUserId, preferences);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(15);
      
      if (recommendations.length > 0) {
        expect(recommendations.some(t => 
          t.genre.includes('Action') || 
          t.category === 'action' || 
          t.difficulty === 'intermediate'
        )).toBe(true);
      }
    });

    it('should get recommendations with empty preferences', () => {
      const preferences = {
        genres: [],
        categories: [],
        difficulty: ''
      };

      const recommendations = sceneTemplatesService.getRecommendations(testUserId, preferences);

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should persist custom templates to localStorage', () => {
      const customTemplate = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'Persistence Test', genre: 'Test' },
        testAuthor
      );

      const stored = localStorage.getItem('astral_notes_scene_templates');
      expect(stored).toBeTruthy();

      const parsedData = JSON.parse(stored!);
      expect(parsedData).toHaveProperty('templates');
      expect(Array.isArray(parsedData.templates)).toBe(true);
      
      const storedTemplate = parsedData.templates.find(([id]: [string, any]) => id === customTemplate.id);
      expect(storedTemplate).toBeTruthy();
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('astral_notes_scene_templates', 'invalid json');

      // Should not throw error and should continue working
      expect(() => {
        sceneTemplatesService.createCustomTemplate(
          null,
          { title: 'Test after corruption' },
          testAuthor
        );
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should emit templateCreated event', () => {
      const templateCreatedSpy = vi.fn();
      sceneTemplatesService.on('templateCreated', templateCreatedSpy);

      const template = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'Event Test' },
        testAuthor
      );

      expect(templateCreatedSpy).toHaveBeenCalledWith(template);
    });

    it('should emit templateUpdated event', () => {
      const templateUpdatedSpy = vi.fn();
      sceneTemplatesService.on('templateUpdated', templateUpdatedSpy);

      const customTemplate = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'Update Test' },
        testAuthor
      );

      const updated = sceneTemplatesService.updateTemplate(customTemplate.id, {
        title: 'Updated Title'
      });

      expect(templateUpdatedSpy).toHaveBeenCalledWith(updated);
    });

    it('should emit templateDeleted event', () => {
      const templateDeletedSpy = vi.fn();
      sceneTemplatesService.on('templateDeleted', templateDeletedSpy);

      const customTemplate = sceneTemplatesService.createCustomTemplate(
        null,
        { title: 'Delete Test' },
        testAuthor
      );

      sceneTemplatesService.deleteTemplate(customTemplate.id);

      expect(templateDeletedSpy).toHaveBeenCalledWith({
        templateId: customTemplate.id,
        template: customTemplate
      });
    });

    it('should emit templateUsed event', () => {
      const templateUsedSpy = vi.fn();
      sceneTemplatesService.on('templateUsed', templateUsedSpy);

      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      sceneTemplatesService.useTemplate(template.id, testUserId);

      expect(templateUsedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          template: expect.objectContaining({ id: template.id }),
          userId: testUserId
        })
      );
    });

    it('should emit sceneGenerated event', () => {
      const sceneGeneratedSpy = vi.fn();
      sceneTemplatesService.on('sceneGenerated', sceneGeneratedSpy);

      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const customizations = {
        genre: 'Test',
        characters: ['Test Character'],
        setting: 'Test Setting',
        mood: 'Test Mood',
        pointOfView: 'first' as const,
        tense: 'present' as const,
        tone: 'Test Tone',
        conflict: 'Test Conflict',
        theme: 'Test Theme'
      };

      sceneTemplatesService.generateScene(template.id, customizations);

      expect(sceneGeneratedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          generationId: expect.any(String),
          generation: expect.objectContaining({
            templateId: template.id,
            customizations
          })
        })
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search query', () => {
      const results = sceneTemplatesService.searchTemplates('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle search with special characters', () => {
      const results = sceneTemplatesService.searchTemplates('!@#$%^&*()');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long search query', () => {
      const longQuery = 'a'.repeat(1000);
      const results = sceneTemplatesService.searchTemplates(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle template creation with minimal data', () => {
      const template = sceneTemplatesService.createCustomTemplate(
        null,
        {},
        testAuthor
      );

      expect(template.id).toBeTruthy();
      expect(template.title).toBe('Custom Scene Template');
      expect(template.description).toBe('A custom scene template');
      expect(template.genre).toBe('General');
      expect(template.structure).toBeDefined();
    });

    it('should calculate complexity correctly for various scenarios', () => {
      const templates = sceneTemplatesService.getAllTemplates();
      const template = templates[0];

      const simpleCustomizations = {
        genre: 'Simple',
        characters: ['One'],
        setting: 'Basic',
        mood: 'Calm',
        pointOfView: 'first' as const,
        tense: 'present' as const,
        tone: 'Simple',
        conflict: 'Minor',
        theme: 'Basic'
      };

      const complexCustomizations = {
        genre: 'Complex',
        characters: ['One', 'Two', 'Three', 'Four', 'Five'],
        setting: 'Elaborate',
        mood: 'Intense',
        pointOfView: 'third-omniscient' as const,
        tense: 'past' as const,
        tone: 'Complex',
        conflict: 'Major',
        theme: 'Philosophical'
      };

      const simpleGeneration = sceneTemplatesService.generateScene(template.id, simpleCustomizations);
      const complexGeneration = sceneTemplatesService.generateScene(template.id, complexCustomizations);

      expect(complexGeneration.metadata.complexity).toBeGreaterThan(simpleGeneration.metadata.complexity);
      expect(complexGeneration.metadata.estimatedLength).toBeGreaterThan(simpleGeneration.metadata.estimatedLength);
    });
  });
});