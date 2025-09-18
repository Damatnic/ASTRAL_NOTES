/**
 * Template Service Tests
 * Comprehensive tests for novel template functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { templateService, type NovelTemplate, type TemplateSection } from '../../services/templateService';

describe('TemplateService', () => {
  describe('Template Retrieval', () => {
    it('should return all templates', () => {
      const templates = templateService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.id && t.title && t.sections)).toBe(true);
    });

    it('should get template by ID', () => {
      const template = templateService.getTemplate('three-act-novel');
      
      expect(template).toBeTruthy();
      expect(template?.id).toBe('three-act-novel');
      expect(template?.title).toBe('Three-Act Novel Structure');
    });

    it('should return null for non-existent template', () => {
      const template = templateService.getTemplate('non-existent');
      expect(template).toBeNull();
    });

    it('should get templates by genre', () => {
      const fantasyTemplates = templateService.getTemplatesByGenre('fantasy');
      
      expect(fantasyTemplates.length).toBeGreaterThan(0);
      expect(fantasyTemplates.every(t => t.genre.includes('fantasy'))).toBe(true);
    });

    it('should get templates by difficulty', () => {
      const beginnerTemplates = templateService.getTemplatesByDifficulty('beginner');
      
      expect(beginnerTemplates.length).toBeGreaterThan(0);
      expect(beginnerTemplates.every(t => t.difficulty === 'beginner')).toBe(true);
    });

    it('should search templates', () => {
      const searchResults = templateService.searchTemplates('hero');
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(
        searchResults.every(t => 
          t.title.toLowerCase().includes('hero') ||
          t.description.toLowerCase().includes('hero') ||
          t.tags.some(tag => tag.includes('hero'))
        )
      ).toBe(true);
    });

    it('should search templates by genre', () => {
      const romanceResults = templateService.searchTemplates('romance');
      
      expect(romanceResults.length).toBeGreaterThan(0);
      expect(
        romanceResults.some(t => t.genre.includes('romance'))
      ).toBe(true);
    });
  });

  describe('Categories', () => {
    it('should return all categories', () => {
      const categories = templateService.getCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(c => c.id && c.name && c.templates)).toBe(true);
    });

    it('should get category by ID', () => {
      const category = templateService.getCategory('popular');
      
      expect(category).toBeTruthy();
      expect(category?.id).toBe('popular');
      expect(category?.name).toBe('Popular Templates');
    });

    it('should get templates by category', () => {
      const popularTemplates = templateService.getTemplatesByCategory('popular');
      
      expect(popularTemplates.length).toBeGreaterThan(0);
      
      const category = templateService.getCategory('popular');
      expect(popularTemplates.length).toBe(category?.templates.length);
    });

    it('should return empty array for non-existent category', () => {
      const templates = templateService.getTemplatesByCategory('non-existent');
      expect(templates).toEqual([]);
    });
  });

  describe('Custom Templates', () => {
    it('should create custom template', () => {
      const customTemplate = templateService.createCustomTemplate(
        'My Custom Template',
        'A custom template for testing'
      );

      expect(customTemplate.id).toBeDefined();
      expect(customTemplate.name).toBe('My Custom Template');
      expect(customTemplate.description).toBe('A custom template for testing');
      expect(customTemplate.createdAt).toBeInstanceOf(Date);

      const customTemplates = templateService.getCustomTemplates();
      expect(customTemplates).toContain(customTemplate);
    });

    it('should create custom template based on existing template', () => {
      const customTemplate = templateService.createCustomTemplate(
        'Modified Three-Act',
        'My version of three-act structure',
        'three-act-novel'
      );

      expect(customTemplate.baseTemplateId).toBe('three-act-novel');
    });

    it('should update custom template', () => {
      const customTemplate = templateService.createCustomTemplate(
        'Test Template',
        'Original description'
      );

      const updated = templateService.updateCustomTemplate(customTemplate.id, {
        description: 'Updated description',
      });

      expect(updated).toBe(true);
      
      const updatedTemplate = templateService.getCustomTemplates()
        .find(t => t.id === customTemplate.id);
      expect(updatedTemplate?.description).toBe('Updated description');
    });

    it('should delete custom template', () => {
      const customTemplate = templateService.createCustomTemplate(
        'To Delete',
        'Will be deleted'
      );

      const deleted = templateService.deleteCustomTemplate(customTemplate.id);
      expect(deleted).toBe(true);

      const customTemplates = templateService.getCustomTemplates();
      expect(customTemplates.find(t => t.id === customTemplate.id)).toBeUndefined();
    });

    it('should fail to update non-existent custom template', () => {
      const updated = templateService.updateCustomTemplate('non-existent', {
        description: 'New description',
      });
      expect(updated).toBe(false);
    });
  });

  describe('Template Application', () => {
    it('should apply template to project', () => {
      const projectData = {
        title: 'My Novel',
        genre: 'fantasy',
        characters: ['Hero', 'Villain'],
      };

      const result = templateService.applyTemplate('three-act-novel', projectData);

      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.metadata.templateId).toBe('three-act-novel');
      expect(result.metadata.templateTitle).toBe('Three-Act Novel Structure');
      expect(result.metadata.appliedAt).toBeInstanceOf(Date);
      expect(result.estimatedStructure).toBeDefined();
    });

    it('should generate section content', () => {
      const result = templateService.applyTemplate('three-act-novel', {});
      const firstSection = result.sections[0];

      expect(firstSection.content).toContain('# Act I: Setup');
      expect(firstSection.content).toContain('## Writing Guidelines');
      expect(firstSection.content).toContain('## Notes');
      expect(firstSection.content).toContain('## Draft');
    });

    it('should include word count in generated content', () => {
      const result = templateService.applyTemplate('three-act-novel', {});
      const sectionWithWordCount = result.sections.find(s => s.estimatedWordCount);

      expect(sectionWithWordCount?.content).toContain('Target word count:');
      expect(sectionWithWordCount?.content).toContain(sectionWithWordCount.estimatedWordCount!.toString());
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateService.applyTemplate('non-existent', {});
      }).toThrow('Template not found');
    });

    it('should calculate project structure', () => {
      const result = templateService.applyTemplate('heros-journey', {});
      
      expect(result.estimatedStructure.totalSections).toBeGreaterThan(0);
      expect(result.estimatedStructure.requiredSections).toBeGreaterThan(0);
      expect(result.estimatedStructure.avgWordsPerSection).toBeGreaterThan(0);
      expect(result.estimatedStructure.structure).toBe('hero-journey');
      expect(result.estimatedStructure.difficulty).toBe('intermediate');
    });
  });

  describe('Template Preview', () => {
    it('should generate template preview', () => {
      const preview = templateService.generatePreview('romance-novel');

      expect(preview.outline).toContain('Romance Novel Structure');
      expect(preview.outline).toContain('Genre:');
      expect(preview.outline).toContain('Target Length:');
      expect(preview.outline).toContain('## Structure');

      expect(preview.structure).toBeDefined();
      expect(preview.timeline).toContain('Estimated timeline');
    });

    it('should include section details in outline', () => {
      const preview = templateService.generatePreview('mystery-novel');
      
      expect(preview.outline).toContain('Crime and Setup');
      expect(preview.outline).toContain('Initial Investigation');
      expect(preview.outline).toContain('Target:');
    });

    it('should calculate timeline in preview', () => {
      const preview = templateService.generatePreview('three-act-novel');
      
      expect(preview.timeline).toContain('Planning phase:');
      expect(preview.timeline).toContain('First draft:');
      expect(preview.timeline).toContain('Revision phases:');
      expect(preview.timeline).toContain('Total estimated time:');
    });

    it('should throw error for non-existent template preview', () => {
      expect(() => {
        templateService.generatePreview('non-existent');
      }).toThrow('Template not found');
    });
  });

  describe('Export/Import', () => {
    it('should export template', () => {
      const exported = templateService.exportTemplate('three-act-novel');
      
      expect(exported).toBeTruthy();
      
      const data = JSON.parse(exported!);
      expect(data.template.id).toBe('three-act-novel');
      expect(data.version).toBe('1.0.0');
      expect(data.exportedAt).toBeDefined();
    });

    it('should return null for non-existent template export', () => {
      const exported = templateService.exportTemplate('non-existent');
      expect(exported).toBeNull();
    });

    it('should import template', () => {
      const templateData = {
        template: {
          id: 'original-id',
          title: 'Imported Template',
          description: 'Test import',
          genre: ['test'],
          structure: 'custom',
          targetWordCount: 50000,
          estimatedDuration: '3-6 months',
          difficulty: 'beginner',
          tags: ['imported'],
          sections: [
            {
              id: 'test-section',
              title: 'Test Section',
              type: 'chapter',
              order: 1,
              isRequired: true,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          rating: 4.5,
          downloads: 100,
        },
        version: '1.0.0',
        exportedAt: new Date(),
      };

      const imported = templateService.importTemplate(JSON.stringify(templateData));
      
      expect(imported).toBeTruthy();
      expect(imported?.title).toBe('Imported Template');
      expect(imported?.isPublic).toBe(false);
      expect(imported?.downloads).toBe(0);
      expect(imported?.rating).toBeUndefined();
      expect(imported?.id).not.toBe('original-id');

      const templates = templateService.getTemplates();
      expect(templates).toContain(imported);
    });

    it('should handle invalid import data', () => {
      const imported1 = templateService.importTemplate('invalid json');
      expect(imported1).toBeNull();

      const imported2 = templateService.importTemplate('{"invalid": "data"}');
      expect(imported2).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should calculate template statistics', () => {
      const stats = templateService.getTemplateStats();

      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(Object.keys(stats.templatesByGenre).length).toBeGreaterThan(0);
      expect(Object.keys(stats.templatesByDifficulty)).toEqual(['beginner', 'intermediate', 'advanced']);
      expect(stats.averageWordCount).toBeGreaterThan(0);
      expect(stats.mostPopular.length).toBeGreaterThanOrEqual(0);
    });

    it('should count templates by genre correctly', () => {
      const stats = templateService.getTemplateStats();
      const templates = templateService.getTemplates();

      // Count fantasy templates manually
      const fantasyCount = templates.filter(t => t.genre.includes('fantasy')).length;
      expect(stats.templatesByGenre.fantasy).toBe(fantasyCount);
    });

    it('should sort most popular templates', () => {
      const stats = templateService.getTemplateStats();
      
      if (stats.mostPopular.length > 1) {
        for (let i = 1; i < stats.mostPopular.length; i++) {
          const prev = stats.mostPopular[i - 1];
          const curr = stats.mostPopular[i];
          
          const prevScore = (prev.rating || 0) * Math.log(prev.downloads || 1);
          const currScore = (curr.rating || 0) * Math.log(curr.downloads || 1);
          
          expect(prevScore).toBeGreaterThanOrEqual(currScore);
        }
      }
    });
  });

  describe('Template Validation', () => {
    it('should have valid default templates', () => {
      const templates = templateService.getTemplates();

      templates.forEach(template => {
        // Basic structure validation
        expect(template.id).toBeTruthy();
        expect(template.title).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.genre.length).toBeGreaterThan(0);
        expect(['three-act', 'five-act', 'hero-journey', 'save-the-cat', 'snowflake', 'custom']).toContain(template.structure);
        expect(template.targetWordCount).toBeGreaterThan(0);
        expect(['beginner', 'intermediate', 'advanced']).toContain(template.difficulty);
        expect(template.sections.length).toBeGreaterThan(0);

        // Section validation
        template.sections.forEach((section, index) => {
          expect(section.id).toBeTruthy();
          expect(section.title).toBeTruthy();
          expect(['chapter', 'scene', 'act', 'part', 'section', 'note']).toContain(section.type);
          expect(section.order).toBe(index + 1);
          expect(typeof section.isRequired).toBe('boolean');
        });
      });
    });

    it('should have consistent section ordering', () => {
      const templates = templateService.getTemplates();

      templates.forEach(template => {
        const sections = template.sections;
        
        for (let i = 0; i < sections.length; i++) {
          expect(sections[i].order).toBe(i + 1);
        }
      });
    });

    it('should have realistic word counts', () => {
      const templates = templateService.getTemplates();

      templates.forEach(template => {
        expect(template.targetWordCount).toBeGreaterThan(10000); // Minimum for a novel
        expect(template.targetWordCount).toBeLessThan(500000); // Reasonable maximum

        const totalSectionWordCount = template.sections
          .filter(s => s.estimatedWordCount)
          .reduce((sum, s) => sum + (s.estimatedWordCount || 0), 0);

        if (totalSectionWordCount > 0) {
          // Section word counts should roughly match target (within 50% tolerance)
          const ratio = totalSectionWordCount / template.targetWordCount;
          expect(ratio).toBeGreaterThan(0.5);
          expect(ratio).toBeLessThan(1.5);
        }
      });
    });
  });

  describe('Event System', () => {
    it('should emit template events', () => {
      const appliedListener = vi.fn();
      const importedListener = vi.fn();

      templateService.on('template-applied', appliedListener);
      templateService.on('template-imported', importedListener);

      templateService.applyTemplate('three-act-novel', { title: 'Test' });
      expect(appliedListener).toHaveBeenCalled();

      const templateData = {
        template: {
          id: 'test',
          title: 'Test',
          description: 'Test',
          genre: ['test'],
          structure: 'custom',
          targetWordCount: 50000,
          estimatedDuration: '3 months',
          difficulty: 'beginner',
          tags: [],
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: false,
        },
        version: '1.0.0',
        exportedAt: new Date(),
      };

      templateService.importTemplate(JSON.stringify(templateData));
      expect(importedListener).toHaveBeenCalled();
    });

    it('should emit custom template events', () => {
      const createdListener = vi.fn();
      const updatedListener = vi.fn();
      const deletedListener = vi.fn();

      templateService.on('custom-template-created', createdListener);
      templateService.on('custom-template-updated', updatedListener);
      templateService.on('custom-template-deleted', deletedListener);

      const customTemplate = templateService.createCustomTemplate('Test', 'Description');
      expect(createdListener).toHaveBeenCalledWith(customTemplate);

      templateService.updateCustomTemplate(customTemplate.id, { description: 'New' });
      expect(updatedListener).toHaveBeenCalled();

      templateService.deleteCustomTemplate(customTemplate.id);
      expect(deletedListener).toHaveBeenCalledWith(customTemplate.id);
    });
  });
});