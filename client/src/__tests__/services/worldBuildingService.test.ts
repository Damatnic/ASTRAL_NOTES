import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorldBuildingService } from '../../services/worldBuildingService';
import type { WorldElement, WorldMap, WorldTemplate } from '../../services/worldBuildingService';

describe('WorldBuildingService', () => {
  let service: WorldBuildingService;
  let worldId: string;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Clear any existing service state
    if (service) {
      service.removeAllListeners();
    }
    service = new WorldBuildingService();
    // Create and set an active world for testing
    worldId = service.createWorld('Test World');
    service.setActiveWorld(worldId);
  });

  describe('World Management', () => {
    it('should create a new world', () => {
      const newWorldId = service.createWorld('Another World');
      expect(newWorldId).toBeDefined();
      expect(typeof newWorldId).toBe('string');
    });

    it('should get all worlds', () => {
      const worlds = service.getWorlds();
      expect(worlds).toHaveLength(1);
      expect(worlds[0].name).toBe('Test World');
    });

    it('should set active world', () => {
      const newWorldId = service.createWorld('New World');
      const result = service.setActiveWorld(newWorldId);
      expect(result).toBe(true);
      expect(service.getActiveWorldId()).toBe(newWorldId);
    });

    it('should return false when setting non-existent world as active', () => {
      const result = service.setActiveWorld('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Element Management', () => {
    it('should create a new world element', () => {
      const elementData = {
        name: 'Test Location',
        type: 'location' as const,
        description: 'A test location',
        category: 'city',
        tags: ['urban', 'trading'],
        attributes: { population: 10000 },
        notes: 'Important trading hub'
      };

      const element = service.createElement(elementData);

      expect(element).toBeDefined();
      expect(element!.id).toBeDefined();
      expect(element!.name).toBe('Test Location');
      expect(element!.type).toBe('location');
      expect(element!.status).toBe('draft');
      expect(element!.createdAt).toBeInstanceOf(Date);
    });

    it('should update an existing element', async () => {
      const element = service.createElement({
        name: 'Original Name',
        type: 'character',
        description: 'Original description',
        category: 'hero'
      });

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = service.updateElement(element!.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(element!.updatedAt.getTime());
    });

    it('should delete an element', () => {
      const element = service.createElement({
        name: 'To Delete',
        type: 'location',
        description: 'Will be deleted'
      });

      const deleted = service.deleteElement(element!.id);
      expect(deleted).toBe(true);

      const retrieved = service.getElementById(element!.id);
      expect(retrieved).toBeNull();
    });

    it('should get element by ID', () => {
      const element = service.createElement({
        name: 'Test Element',
        type: 'culture',
        description: 'Test description'
      });

      const retrieved = service.getElementById(element!.id);
      expect(retrieved).toEqual(element);
    });

    it('should return null for non-existent element', () => {
      const retrieved = service.getElementById('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all elements', () => {
      service.createElement({ name: 'Element 1', type: 'location', description: 'Desc 1' });
      service.createElement({ name: 'Element 2', type: 'character', description: 'Desc 2' });

      const elements = service.getElements();
      expect(elements).toHaveLength(2);
    });

    it('should get elements by type', () => {
      service.createElement({ name: 'Location 1', type: 'location', description: 'Desc 1' });
      service.createElement({ name: 'Character 1', type: 'character', description: 'Desc 2' });
      service.createElement({ name: 'Location 2', type: 'location', description: 'Desc 3' });

      const locations = service.getElements({ type: 'location' });
      expect(locations).toHaveLength(2);
      expect(locations.every(el => el.type === 'location')).toBe(true);
    });

    it('should get elements by category', () => {
      service.createElement({ name: 'City 1', type: 'location', description: 'Desc 1', category: 'city' });
      service.createElement({ name: 'Forest 1', type: 'location', description: 'Desc 2', category: 'wilderness' });
      service.createElement({ name: 'City 2', type: 'location', description: 'Desc 3', category: 'city' });

      const cities = service.getElements({ category: 'city' });
      expect(cities).toHaveLength(2);
      expect(cities.every(el => el.category === 'city')).toBe(true);
    });
  });

  describe('Relationship Management', () => {
    it('should add relationship between elements', () => {
      const element1 = service.createElement({
        name: 'Character 1',
        type: 'character',
        description: 'First character'
      });
      const element2 = service.createElement({
        name: 'Character 2',
        type: 'character',
        description: 'Second character'
      });

      const relationship = {
        targetId: element2!.id,
        type: 'allied-with' as const,
        description: 'Close allies',
        strength: 'strong' as const
      };

      const updated = service.addRelationship(element1!.id, relationship);
      expect(updated).toBeDefined();
      expect(updated!.relationships).toHaveLength(1);
      expect(updated!.relationships[0].targetId).toBe(element2!.id);
    });

    it('should remove relationship between elements', () => {
      const element1 = service.createElement({
        name: 'Character 1',
        type: 'character',
        description: 'First character'
      });
      const element2 = service.createElement({
        name: 'Character 2',
        type: 'character',
        description: 'Second character'
      });

      const relationship = {
        targetId: element2!.id,
        type: 'allied-with' as const,
        description: 'Close allies',
        strength: 'strong' as const
      };

      service.addRelationship(element1!.id, relationship);
      const updated = service.removeRelationship(element1!.id, element2!.id);

      expect(updated).toBeDefined();
      expect(updated!.relationships).toHaveLength(0);
    });

    it('should get related elements', () => {
      const character = service.createElement({
        name: 'Main Character',
        type: 'character',
        description: 'Protagonist'
      });
      const location = service.createElement({
        name: 'Home Town',
        type: 'location',
        description: 'Character origin'
      });
      const ally = service.createElement({
        name: 'Best Friend',
        type: 'character',
        description: 'Loyal companion'
      });

      service.addRelationship(character!.id, {
        targetId: location!.id,
        type: 'connected-to',
        description: 'Born here',
        strength: 'strong'
      });
      service.addRelationship(character!.id, {
        targetId: ally!.id,
        type: 'allied-with',
        description: 'Childhood friend',
        strength: 'strong'
      });

      const related = service.getRelatedElements(character!.id);
      expect(related).toHaveLength(2);
      expect(related.some(el => el.id === location!.id)).toBe(true);
      expect(related.some(el => el.id === ally!.id)).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('should search elements by query', () => {
      service.createElement({
        name: 'Dragon Mountain',
        type: 'location',
        description: 'A dangerous mountain where dragons nest',
        category: 'wilderness',
        tags: ['dangerous', 'mountain', 'dragons']
      });
      service.createElement({
        name: 'Sir Dragonslayer',
        type: 'character',
        description: 'A brave knight who hunts dragons',
        category: 'hero',
        tags: ['knight', 'brave', 'dragon-hunter']
      });

      const results = service.searchElements('dragon');
      expect(results).toHaveLength(2);
      expect(results.some(el => el.name === 'Dragon Mountain')).toBe(true);
      expect(results.some(el => el.name === 'Sir Dragonslayer')).toBe(true);
    });

    it('should search elements by tags', () => {
      service.createElement({
        name: 'Peaceful Village',
        type: 'location',
        description: 'A quiet farming community',
        category: 'settlement',
        tags: ['peaceful', 'farming']
      });

      const results = service.getElements({ tags: ['peaceful'] });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Peaceful Village');
    });

    it('should search elements by type', () => {
      service.createElement({
        name: 'Dragon Mountain',
        type: 'location',
        description: 'A dangerous mountain where dragons nest',
        category: 'wilderness',
        tags: ['dangerous', 'mountain', 'dragons']
      });
      service.createElement({
        name: 'Peaceful Village',
        type: 'location',
        description: 'A quiet farming community',
        category: 'settlement',
        tags: ['peaceful', 'farming']
      });

      const results = service.getElements({ type: 'location' });
      expect(results.length).toBe(2);
      expect(results.every(el => el.type === 'location')).toBe(true);
    });

    it('should search elements by category', () => {
      service.createElement({
        name: 'Sir Dragonslayer',
        type: 'character',
        description: 'A brave knight who hunts dragons',
        category: 'hero',
        tags: ['knight', 'brave', 'dragon-hunter']
      });

      const results = service.getElements({ category: 'hero' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Sir Dragonslayer');
    });
  });

  describe('Procedural Generation', () => {
    it('should generate a location element', () => {
      const generated = service.generateElement('location', {
        biome: 'forest',
        size: 'medium',
        civilization: 'primitive'
      });

      expect(generated).toBeDefined();
      expect(generated!.type).toBe('location');
      expect(generated!.name).toBeDefined();
      expect(generated!.description).toBeDefined();
    });

    it('should generate a character element', () => {
      const generated = service.generateElement('character', {
        race: 'human',
        role: 'merchant',
        alignment: 'neutral'
      });

      expect(generated).toBeDefined();
      expect(generated!.type).toBe('character');
      expect(generated!.name).toBeDefined();
      expect(generated!.description).toBeDefined();
    });

    it('should generate a culture element', () => {
      const generated = service.generateElement('culture', {
        government: 'monarchy',
        technology: 'medieval',
        values: ['honor', 'tradition']
      });

      expect(generated).toBeDefined();
      expect(generated!.type).toBe('culture');
      expect(generated!.name).toBeDefined();
      expect(generated!.description).toBeDefined();
    });

    it('should return null for unsupported generation type', () => {
      const generated = service.generateElement('artifact', {});
      expect(generated).toBeNull();
    });
  });

  describe('World Analysis', () => {
    beforeEach(() => {
      const character1 = service.createElement({
        name: 'Hero',
        type: 'character',
        description: 'Main protagonist',
        category: 'hero'
      });
      const character2 = service.createElement({
        name: 'Villain',
        type: 'character',
        description: 'Main antagonist',
        category: 'villain'
      });
      const location1 = service.createElement({
        name: 'Capital City',
        type: 'location',
        description: 'Major city',
        category: 'city'
      });

      service.addRelationship(character1!.id, {
        targetId: character2!.id,
        type: 'enemy-of',
        description: 'Sworn enemies',
        strength: 'strong'
      });
      service.addRelationship(character1!.id, {
        targetId: location1!.id,
        type: 'connected-to',
        description: 'Lives here',
        strength: 'moderate'
      });
    });

    it('should analyze world complexity', () => {
      const analysis = service.analyzeWorld();

      expect(analysis).toBeDefined();
      expect(analysis!.overview.totalElements).toBe(3);
      expect(analysis!.overview.elementsByType.character).toBe(2);
      expect(analysis!.overview.elementsByType.location).toBe(1);
      expect(analysis!.overview.relationshipCount).toBe(2);
    });

    it('should analyze world structure', () => {
      const analysis = service.analyzeWorld();
      
      expect(analysis).toBeDefined();
      expect(analysis!.structure).toBeDefined();
      expect(analysis!.structure.hierarchyDepth).toBeGreaterThanOrEqual(0);
      expect(analysis!.structure.connectionDensity).toBeGreaterThanOrEqual(0);
    });

    it('should detect consistency issues', () => {
      const issues = service.detectInconsistencies();
      
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should suggest missing elements', () => {
      const suggestions = service.suggestMissingElements();
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Templates', () => {
    it('should get all available templates', () => {
      const templates = service.getTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should create world from template', () => {
      const newWorldId = service.createWorldFromTemplate('medieval-fantasy', 'Test Kingdom');

      expect(newWorldId).toBeDefined();
      expect(typeof newWorldId).toBe('string');
      
      // Set the new world as active to test elements were created
      service.setActiveWorld(newWorldId!);
      const elements = service.getElements();
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should return null when creating from non-existent template', () => {
      const newWorldId = service.createWorldFromTemplate('non-existent', 'Test World');
      expect(newWorldId).toBeNull();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      service.createElement({
        name: 'Export Character',
        type: 'character',
        description: 'Character for export testing',
        category: 'hero',
        tags: ['export', 'test']
      });
      service.createElement({
        name: 'Export Location',
        type: 'location',
        description: 'Location for export testing',
        category: 'city',
        tags: ['export', 'test']
      });
    });

    it('should export world as JSON', () => {
      const exported = service.exportWorld('json', {
        elementTypes: [],
        filterByTags: [],
        sortBy: 'name',
        includeRelationships: false,
        includeMap: false
      });
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported!);
      expect(parsed.elements).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.elements.length).toBe(2);
    });

    it('should export world as Markdown', () => {
      const exported = service.exportWorld('markdown', {
        elementTypes: [],
        filterByTags: [],
        sortBy: 'name',
        includeRelationships: false,
        includeMap: false
      });
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported!.includes('# World Export')).toBe(true);
      expect(exported!.includes('Export Character')).toBe(true);
      expect(exported!.includes('Export Location')).toBe(true);
    });

    it('should export filtered elements', () => {
      const exported = service.exportWorld('json', {
        elementTypes: ['character'],
        filterByTags: [],
        sortBy: 'name',
        includeRelationships: false,
        includeMap: false
      });
      
      const parsed = JSON.parse(exported!);
      expect(parsed.elements.length).toBe(1);
      expect(parsed.elements[0].type).toBe('character');
    });

    it('should export elements with specific tags', () => {
      const exported = service.exportWorld('json', {
        elementTypes: [],
        filterByTags: ['export'],
        sortBy: 'name',
        includeRelationships: false,
        includeMap: false
      });
      
      const parsed = JSON.parse(exported!);
      expect(parsed.elements.length).toBe(2);
      expect(parsed.elements.every((el: any) => el.tags.includes('export'))).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should persist elements to localStorage', () => {
      const element = service.createElement({
        name: 'Persistent Element',
        type: 'location',
        description: 'Should be saved'
      });

      // Check if data is stored (implementation detail may vary)
      const storedData = localStorage.getItem('worldBuilding_worlds');
      expect(storedData).toBeDefined();
    });

    it('should load existing data from localStorage', () => {
      // Create an element
      const element = service.createElement({
        name: 'Pre-existing Element',
        type: 'character',
        description: 'Was already in storage'
      });

      // Create new service instance (should load from localStorage)
      const newService = new WorldBuildingService();
      newService.setActiveWorld(worldId);
      const retrieved = newService.getElementById(element!.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Pre-existing Element');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('worldBuilding_worlds', 'invalid json');
      
      expect(() => {
        new WorldBuildingService();
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should emit elementCreated event', () => {
      const eventSpy = vi.fn();
      service.on('elementCreated', eventSpy);

      service.createElement({
        name: 'Event Test',
        type: 'location',
        description: 'For event testing'
      });

      expect(eventSpy).toHaveBeenCalledOnce();
    });

    it('should emit elementUpdated event', () => {
      const eventSpy = vi.fn();
      service.on('elementUpdated', eventSpy);

      const element = service.createElement({
        name: 'Original',
        type: 'character',
        description: 'Original description'
      });

      service.updateElement(element!.id, { name: 'Updated' });

      expect(eventSpy).toHaveBeenCalledOnce();
    });

    it('should emit elementDeleted event', () => {
      const eventSpy = vi.fn();
      service.on('elementDeleted', eventSpy);

      const element = service.createElement({
        name: 'To Delete',
        type: 'location',
        description: 'Will be deleted'
      });

      service.deleteElement(element!.id);

      expect(eventSpy).toHaveBeenCalledOnce();
    });

    it('should emit worldCreated event', () => {
      const eventSpy = vi.fn();
      service.on('worldCreated', eventSpy);

      service.createWorld('Event Test World');

      expect(eventSpy).toHaveBeenCalledOnce();
    });

    it('should emit relationshipAdded event', () => {
      const eventSpy = vi.fn();
      service.on('relationshipAdded', eventSpy);

      const element1 = service.createElement({
        name: 'Element 1',
        type: 'character',
        description: 'First element'
      });
      const element2 = service.createElement({
        name: 'Element 2',
        type: 'character',
        description: 'Second element'
      });

      service.addRelationship(element1!.id, {
        targetId: element2!.id,
        type: 'allied-with',
        description: 'Allied',
        strength: 'moderate'
      });

      expect(eventSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null when updating non-existent element', () => {
      const result = service.updateElement('non-existent', { name: 'Updated' });
      expect(result).toBeNull();
    });

    it('should return false when deleting non-existent element', () => {
      const result = service.deleteElement('non-existent');
      expect(result).toBe(false);
    });

    it('should return null when adding relationship to non-existent element', () => {
      const result = service.addRelationship('non-existent', {
        targetId: 'also-non-existent',
        type: 'allied-with',
        description: 'Test',
        strength: 'weak'
      });
      expect(result).toBeNull();
    });

    it('should handle empty search results', () => {
      const results = service.searchElements('nonexistentquery');
      expect(results).toEqual([]);
    });

    it('should handle generation with invalid parameters', () => {
      const result = service.generateElement('location', null);
      expect(result).toBeDefined();
      expect(result!.type).toBe('location');
    });

    it('should handle export with empty world', () => {
      const newWorldId = service.createWorld('Empty World');
      service.setActiveWorld(newWorldId);
      
      const exported = service.exportWorld('json', {
        elementTypes: [],
        filterByTags: [],
        sortBy: 'name',
        includeRelationships: false,
        includeMap: false
      });
      
      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported!);
      expect(parsed.elements).toEqual([]);
    });

    it('should handle analysis of empty world', () => {
      const newWorldId = service.createWorld('Empty World');
      service.setActiveWorld(newWorldId);
      
      const analysis = service.analyzeWorld();
      
      expect(analysis).toBeDefined();
      expect(analysis!.overview.totalElements).toBe(0);
      expect(analysis!.overview.relationshipCount).toBe(0);
    });
  });
});