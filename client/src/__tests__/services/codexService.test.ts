/**
 * Codex Service Unit Tests
 * Comprehensive testing for NovelCrafter's entity management system
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { codexService, CodexEntity, EntityType, EntityRelationship, RelationshipType, EntitySearchFilters, MentionSuggestion, EntityCollection, ConsistencyCheck, TextReference } from '../../services/codexService';
import { api } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CodexService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Entity Management', () => {
    const mockEntity: CodexEntity = {
      id: 'entity-1',
      type: 'character',
      name: 'John Doe',
      description: 'Main protagonist',
      data: { age: 30, occupation: 'Detective' },
      tags: ['protagonist', 'detective'],
      category: 'main',
      importance: 5,
      notes: 'Key character notes',
      isUniversal: false,
      projectId: 'project-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    test('should create entity successfully', async () => {
      const createData = { ...mockEntity };
      delete (createData as any).id;
      delete (createData as any).createdAt;
      delete (createData as any).updatedAt;

      (api.post as Mock).mockResolvedValue({ data: mockEntity });

      const result = await codexService.createEntity(createData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/entities', createData);
      expect(result).toEqual(mockEntity);
    });

    test('should update entity successfully', async () => {
      const updates = { name: 'Jane Doe', description: 'Updated character' };
      const updatedEntity = { ...mockEntity, ...updates };

      (api.put as Mock).mockResolvedValue({ data: updatedEntity });

      const result = await codexService.updateEntity('entity-1', updates);

      expect(api.put).toHaveBeenCalledWith('/api/codex/entities/entity-1', updates);
      expect(result).toEqual(updatedEntity);
    });

    test('should delete entity successfully', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await codexService.deleteEntity('entity-1');

      expect(api.delete).toHaveBeenCalledWith('/api/codex/entities/entity-1');
    });

    test('should get entity by id', async () => {
      (api.get as Mock).mockResolvedValue({ data: mockEntity });

      const result = await codexService.getEntity('entity-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1');
      expect(result).toEqual(mockEntity);
    });

    test('should get entity with relationships', async () => {
      const entityWithRelationships = {
        ...mockEntity,
        relationships: [
          {
            id: 'rel-1',
            fromEntityId: 'entity-1',
            toEntityId: 'entity-2',
            type: 'family',
            strength: 8,
            isDirectional: false,
            status: 'active',
          },
        ],
      };

      (api.get as Mock).mockResolvedValue({ data: entityWithRelationships });

      const result = await codexService.getEntityWithRelationships('entity-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1/relationships');
      expect(result).toEqual(entityWithRelationships);
      expect(result.relationships).toBeDefined();
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Entity not found';
      (api.get as Mock).mockRejectedValue(new Error(errorMessage));

      await expect(codexService.getEntity('nonexistent')).rejects.toThrow(errorMessage);
    });
  });

  describe('Entity Search and Filtering', () => {
    const mockEntities: CodexEntity[] = [
      {
        id: 'entity-1',
        type: 'character',
        name: 'John Doe',
        description: 'Detective',
        data: {},
        tags: ['protagonist'],
        importance: 5,
        notes: '',
        isUniversal: false,
        projectId: 'project-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'entity-2',
        type: 'location',
        name: 'City Hall',
        description: 'Government building',
        data: {},
        tags: ['government'],
        importance: 3,
        notes: '',
        isUniversal: false,
        projectId: 'project-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    test('should search entities with filters', async () => {
      const filters: EntitySearchFilters = {
        types: ['character', 'location'],
        tags: ['protagonist'],
        search: 'John',
        importance: [4, 5],
      };

      (api.get as Mock).mockResolvedValue({ data: [mockEntities[0]] });

      const result = await codexService.searchEntities(filters);

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/search', { params: filters });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    test('should search entities without filters', async () => {
      (api.get as Mock).mockResolvedValue({ data: mockEntities });

      const result = await codexService.searchEntities();

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/search', { params: {} });
      expect(result).toEqual(mockEntities);
    });

    test('should get entities by project', async () => {
      (api.get as Mock).mockResolvedValue({ data: mockEntities });

      const result = await codexService.getEntitiesByProject('project-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/project/project-1', { params: {} });
      expect(result).toEqual(mockEntities);
    });

    test('should get entities by project and type', async () => {
      (api.get as Mock).mockResolvedValue({ data: [mockEntities[0]] });

      const result = await codexService.getEntitiesByProject('project-1', 'character');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/project/project-1', { params: { type: 'character' } });
      expect(result).toEqual([mockEntities[0]]);
    });

    test('should get universal entities', async () => {
      const universalEntities = mockEntities.map(e => ({ ...e, isUniversal: true }));
      (api.get as Mock).mockResolvedValue({ data: universalEntities });

      const result = await codexService.getUniversalEntities();

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/universal', { params: {} });
      expect(result).toEqual(universalEntities);
    });

    test('should get entities by type', async () => {
      (api.get as Mock).mockResolvedValue({ data: [mockEntities[0]] });

      const result = await codexService.getEntitiesByType('character');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/type/character', { params: {} });
      expect(result).toEqual([mockEntities[0]]);
    });
  });

  describe('Relationship Management', () => {
    const mockRelationship: EntityRelationship = {
      id: 'rel-1',
      fromEntityId: 'entity-1',
      toEntityId: 'entity-2',
      type: 'family',
      description: 'Father and son',
      strength: 9,
      isDirectional: true,
      status: 'active',
    };

    test('should create relationship', async () => {
      const createData = { ...mockRelationship };
      delete (createData as any).id;

      (api.post as Mock).mockResolvedValue({ data: mockRelationship });

      const result = await codexService.createRelationship(createData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/relationships', createData);
      expect(result).toEqual(mockRelationship);
    });

    test('should update relationship', async () => {
      const updates = { strength: 7, description: 'Updated relationship' };
      const updatedRelationship = { ...mockRelationship, ...updates };

      (api.put as Mock).mockResolvedValue({ data: updatedRelationship });

      const result = await codexService.updateRelationship('rel-1', updates);

      expect(api.put).toHaveBeenCalledWith('/api/codex/relationships/rel-1', updates);
      expect(result).toEqual(updatedRelationship);
    });

    test('should delete relationship', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await codexService.deleteRelationship('rel-1');

      expect(api.delete).toHaveBeenCalledWith('/api/codex/relationships/rel-1');
    });

    test('should get entity relationships', async () => {
      const relationships = [mockRelationship];
      (api.get as Mock).mockResolvedValue({ data: relationships });

      const result = await codexService.getEntityRelationships('entity-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1/relationships');
      expect(result).toEqual(relationships);
    });

    test('should get relationships by type', async () => {
      const familyRelationships = [mockRelationship];
      (api.get as Mock).mockResolvedValue({ data: familyRelationships });

      const result = await codexService.getRelationshipsByType('family');

      expect(api.get).toHaveBeenCalledWith('/api/codex/relationships/type/family', { params: {} });
      expect(result).toEqual(familyRelationships);
    });

    test('should get relationships by type with project filter', async () => {
      const familyRelationships = [mockRelationship];
      (api.get as Mock).mockResolvedValue({ data: familyRelationships });

      const result = await codexService.getRelationshipsByType('family', 'project-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/relationships/type/family', { params: { projectId: 'project-1' } });
      expect(result).toEqual(familyRelationships);
    });
  });

  describe('Text Reference Management', () => {
    const mockTextReference: TextReference = {
      id: 'ref-1',
      entityId: 'entity-1',
      sourceType: 'note',
      sourceId: 'note-1',
      text: 'John Doe',
      startPos: 10,
      endPos: 18,
      contextBefore: 'The detective ',
      contextAfter: ' investigated the case',
      confidence: 0.95,
      isConfirmed: true,
      isIgnored: false,
    };

    test('should get text references for entity', async () => {
      const references = [mockTextReference];
      (api.get as Mock).mockResolvedValue({ data: references });

      const result = await codexService.getTextReferences('entity-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1/references');
      expect(result).toEqual(references);
    });

    test('should create text reference', async () => {
      const createData = { ...mockTextReference };
      delete (createData as any).id;

      (api.post as Mock).mockResolvedValue({ data: mockTextReference });

      const result = await codexService.createTextReference(createData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/references', createData);
      expect(result).toEqual(mockTextReference);
    });

    test('should update text reference', async () => {
      const updates = { isConfirmed: false, confidence: 0.8 };
      const updatedReference = { ...mockTextReference, ...updates };

      (api.put as Mock).mockResolvedValue({ data: updatedReference });

      const result = await codexService.updateTextReference('ref-1', updates);

      expect(api.put).toHaveBeenCalledWith('/api/codex/references/ref-1', updates);
      expect(result).toEqual(updatedReference);
    });

    test('should delete text reference', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await codexService.deleteTextReference('ref-1');

      expect(api.delete).toHaveBeenCalledWith('/api/codex/references/ref-1');
    });

    test('should get references for document', async () => {
      const references = [mockTextReference];
      (api.get as Mock).mockResolvedValue({ data: references });

      const result = await codexService.getReferencesForDocument('note', 'note-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/references/document/note/note-1');
      expect(result).toEqual(references);
    });
  });

  describe('Mention Suggestions', () => {
    const mockSuggestion: MentionSuggestion = {
      id: 'suggestion-1',
      text: 'Detective Smith',
      sourceType: 'note',
      sourceId: 'note-1',
      context: 'The experienced Detective Smith arrived at the scene',
      frequency: 3,
      suggestedType: 'character',
      confidence: 0.85,
      status: 'pending',
    };

    test('should get mention suggestions', async () => {
      const suggestions = [mockSuggestion];
      (api.get as Mock).mockResolvedValue({ data: suggestions });

      const result = await codexService.getMentionSuggestions();

      expect(api.get).toHaveBeenCalledWith('/api/codex/suggestions', { params: { status: 'pending' } });
      expect(result).toEqual(suggestions);
    });

    test('should get mention suggestions with project filter', async () => {
      const suggestions = [mockSuggestion];
      (api.get as Mock).mockResolvedValue({ data: suggestions });

      const result = await codexService.getMentionSuggestions('project-1', 'accepted');

      expect(api.get).toHaveBeenCalledWith('/api/codex/suggestions', { 
        params: { status: 'accepted', projectId: 'project-1' } 
      });
      expect(result).toEqual(suggestions);
    });

    test('should accept mention suggestion', async () => {
      const entityData = { name: 'Detective Smith', type: 'character' as EntityType };
      const responseData = {
        entity: { id: 'entity-1', ...entityData },
        suggestion: { ...mockSuggestion, status: 'accepted' as const },
      };

      (api.post as Mock).mockResolvedValue({ data: responseData });

      const result = await codexService.acceptMentionSuggestion('suggestion-1', entityData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/suggestions/suggestion-1/accept', entityData);
      expect(result).toEqual(responseData);
    });

    test('should reject mention suggestion', async () => {
      const rejectedSuggestion = { ...mockSuggestion, status: 'rejected' as const };
      (api.put as Mock).mockResolvedValue({ data: rejectedSuggestion });

      const result = await codexService.rejectMentionSuggestion('suggestion-1');

      expect(api.put).toHaveBeenCalledWith('/api/codex/suggestions/suggestion-1/reject');
      expect(result).toEqual(rejectedSuggestion);
    });

    test('should ignore mention suggestion', async () => {
      const ignoredSuggestion = { ...mockSuggestion, status: 'ignored' as const };
      (api.put as Mock).mockResolvedValue({ data: ignoredSuggestion });

      const result = await codexService.ignoreMentionSuggestion('suggestion-1');

      expect(api.put).toHaveBeenCalledWith('/api/codex/suggestions/suggestion-1/ignore');
      expect(result).toEqual(ignoredSuggestion);
    });
  });

  describe('Entity Collections', () => {
    const mockCollection: EntityCollection = {
      id: 'collection-1',
      name: 'Main Characters',
      description: 'Primary story characters',
      type: 'manual',
      criteria: {},
      color: '#ff0000',
      icon: 'users',
      isPublic: true,
      projectId: 'project-1',
    };

    test('should create collection', async () => {
      const createData = { ...mockCollection };
      delete (createData as any).id;

      (api.post as Mock).mockResolvedValue({ data: mockCollection });

      const result = await codexService.createCollection(createData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/collections', createData);
      expect(result).toEqual(mockCollection);
    });

    test('should update collection', async () => {
      const updates = { name: 'Updated Characters', description: 'Updated description' };
      const updatedCollection = { ...mockCollection, ...updates };

      (api.put as Mock).mockResolvedValue({ data: updatedCollection });

      const result = await codexService.updateCollection('collection-1', updates);

      expect(api.put).toHaveBeenCalledWith('/api/codex/collections/collection-1', updates);
      expect(result).toEqual(updatedCollection);
    });

    test('should delete collection', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await codexService.deleteCollection('collection-1');

      expect(api.delete).toHaveBeenCalledWith('/api/codex/collections/collection-1');
    });

    test('should get collection by id', async () => {
      (api.get as Mock).mockResolvedValue({ data: mockCollection });

      const result = await codexService.getCollection('collection-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/collections/collection-1');
      expect(result).toEqual(mockCollection);
    });

    test('should get collections by project', async () => {
      const collections = [mockCollection];
      (api.get as Mock).mockResolvedValue({ data: collections });

      const result = await codexService.getCollectionsByProject('project-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/collections/project/project-1');
      expect(result).toEqual(collections);
    });

    test('should add entity to collection', async () => {
      const member = {
        id: 'member-1',
        collectionId: 'collection-1',
        entityId: 'entity-1',
        order: 0,
        addedAt: new Date(),
      };

      (api.post as Mock).mockResolvedValue({ data: member });

      const result = await codexService.addEntityToCollection('collection-1', 'entity-1', 0);

      expect(api.post).toHaveBeenCalledWith('/api/codex/collections/collection-1/members', { entityId: 'entity-1', order: 0 });
      expect(result).toEqual(member);
    });

    test('should remove entity from collection', async () => {
      (api.delete as Mock).mockResolvedValue({});

      await codexService.removeEntityFromCollection('collection-1', 'entity-1');

      expect(api.delete).toHaveBeenCalledWith('/api/codex/collections/collection-1/members/entity-1');
    });

    test('should reorder collection members', async () => {
      const memberOrders = [
        { entityId: 'entity-1', order: 1 },
        { entityId: 'entity-2', order: 0 },
      ];

      (api.put as Mock).mockResolvedValue({});

      await codexService.reorderCollectionMembers('collection-1', memberOrders);

      expect(api.put).toHaveBeenCalledWith('/api/codex/collections/collection-1/reorder', { memberOrders });
    });
  });

  describe('Consistency Checks', () => {
    const mockConsistencyCheck: ConsistencyCheck = {
      id: 'check-1',
      entityId: 'entity-1',
      type: 'attribute_conflict',
      description: 'Character age inconsistency detected',
      severity: 'medium',
      conflictingData: { age: [25, 30] },
      suggestions: ['Update age to consistent value', 'Add timeline clarification'],
      status: 'open',
    };

    test('should get consistency checks', async () => {
      const checks = [mockConsistencyCheck];
      (api.get as Mock).mockResolvedValue({ data: checks });

      const result = await codexService.getConsistencyChecks();

      expect(api.get).toHaveBeenCalledWith('/api/codex/consistency', { params: {} });
      expect(result).toEqual(checks);
    });

    test('should get consistency checks with filters', async () => {
      const checks = [mockConsistencyCheck];
      (api.get as Mock).mockResolvedValue({ data: checks });

      const result = await codexService.getConsistencyChecks('project-1', 'high');

      expect(api.get).toHaveBeenCalledWith('/api/codex/consistency', { 
        params: { projectId: 'project-1', severity: 'high' } 
      });
      expect(result).toEqual(checks);
    });

    test('should run consistency check for entity', async () => {
      const checks = [mockConsistencyCheck];
      (api.post as Mock).mockResolvedValue({ data: checks });

      const result = await codexService.runConsistencyCheck('entity-1');

      expect(api.post).toHaveBeenCalledWith('/api/codex/consistency/run/entity-1');
      expect(result).toEqual(checks);
    });

    test('should resolve consistency check', async () => {
      const resolvedCheck = { 
        ...mockConsistencyCheck, 
        status: 'resolved' as const, 
        resolution: 'Updated age to 30',
        resolvedAt: new Date(),
      };

      (api.put as Mock).mockResolvedValue({ data: resolvedCheck });

      const result = await codexService.resolveConsistencyCheck('check-1', 'Updated age to 30');

      expect(api.put).toHaveBeenCalledWith('/api/codex/consistency/check-1/resolve', { resolution: 'Updated age to 30' });
      expect(result).toEqual(resolvedCheck);
    });

    test('should ignore consistency check', async () => {
      const ignoredCheck = { ...mockConsistencyCheck, status: 'ignored' as const };
      (api.put as Mock).mockResolvedValue({ data: ignoredCheck });

      const result = await codexService.ignoreConsistencyCheck('check-1');

      expect(api.put).toHaveBeenCalledWith('/api/codex/consistency/check-1/ignore');
      expect(result).toEqual(ignoredCheck);
    });
  });

  describe('Analytics and Statistics', () => {
    test('should get entity stats', async () => {
      const stats = {
        totalEntities: 25,
        entitiesByType: {
          character: 10,
          location: 8,
          object: 4,
          lore: 3,
        },
        totalRelationships: 45,
        averageImportance: 3.2,
        mostConnectedEntity: null,
        recentlyCreated: [],
        popularTags: [
          { tag: 'protagonist', count: 5 },
          { tag: 'villain', count: 3 },
        ],
      };

      (api.get as Mock).mockResolvedValue({ data: stats });

      const result = await codexService.getEntityStats();

      expect(api.get).toHaveBeenCalledWith('/api/codex/stats', { params: {} });
      expect(result).toEqual(stats);
    });

    test('should get entity stats for project', async () => {
      const stats = { totalEntities: 10 };
      (api.get as Mock).mockResolvedValue({ data: stats });

      const result = await codexService.getEntityStats('project-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/stats', { params: { projectId: 'project-1' } });
      expect(result).toEqual(stats);
    });

    test('should get popular tags', async () => {
      const tags = [
        { tag: 'protagonist', count: 10 },
        { tag: 'villain', count: 5 },
      ];

      (api.get as Mock).mockResolvedValue({ data: tags });

      const result = await codexService.getPopularTags();

      expect(api.get).toHaveBeenCalledWith('/api/codex/tags/popular', { params: { limit: 20 } });
      expect(result).toEqual(tags);
    });

    test('should get popular tags with custom limit and project', async () => {
      const tags = [{ tag: 'protagonist', count: 10 }];
      (api.get as Mock).mockResolvedValue({ data: tags });

      const result = await codexService.getPopularTags('project-1', 10);

      expect(api.get).toHaveBeenCalledWith('/api/codex/tags/popular', { 
        params: { limit: 10, projectId: 'project-1' } 
      });
      expect(result).toEqual(tags);
    });

    test('should get entity connections', async () => {
      const connections = {
        entities: [{ id: 'entity-1' }, { id: 'entity-2' }],
        relationships: [{ id: 'rel-1' }],
      };

      (api.get as Mock).mockResolvedValue({ data: connections });

      const result = await codexService.getEntityConnections('entity-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1/connections', { params: { depth: 2 } });
      expect(result).toEqual(connections);
    });

    test('should get entity connections with custom depth', async () => {
      const connections = { entities: [], relationships: [] };
      (api.get as Mock).mockResolvedValue({ data: connections });

      const result = await codexService.getEntityConnections('entity-1', 3);

      expect(api.get).toHaveBeenCalledWith('/api/codex/entities/entity-1/connections', { params: { depth: 3 } });
      expect(result).toEqual(connections);
    });
  });

  describe('Bulk Operations', () => {
    test('should bulk create entities', async () => {
      const entities = [
        { name: 'Entity 1', type: 'character' as EntityType },
        { name: 'Entity 2', type: 'location' as EntityType },
      ];
      const createdEntities = entities.map((e, i) => ({ ...e, id: `entity-${i + 1}` }));

      (api.post as Mock).mockResolvedValue({ data: createdEntities });

      const result = await codexService.bulkCreateEntities(entities);

      expect(api.post).toHaveBeenCalledWith('/api/codex/entities/bulk', { entities });
      expect(result).toEqual(createdEntities);
    });

    test('should bulk update entities', async () => {
      const updates = [
        { id: 'entity-1', data: { name: 'Updated Name 1' } },
        { id: 'entity-2', data: { name: 'Updated Name 2' } },
      ];
      const updatedEntities = updates.map(u => ({ ...u.data, id: u.id }));

      (api.put as Mock).mockResolvedValue({ data: updatedEntities });

      const result = await codexService.bulkUpdateEntities(updates);

      expect(api.put).toHaveBeenCalledWith('/api/codex/entities/bulk', { updates });
      expect(result).toEqual(updatedEntities);
    });

    test('should bulk delete entities', async () => {
      const entityIds = ['entity-1', 'entity-2', 'entity-3'];
      (api.delete as Mock).mockResolvedValue({});

      await codexService.bulkDeleteEntities(entityIds);

      expect(api.delete).toHaveBeenCalledWith('/api/codex/entities/bulk', { data: { entityIds } });
    });
  });

  describe('Import/Export Operations', () => {
    test('should export project as JSON', async () => {
      const mockBlob = new Blob(['{"entities": []}'], { type: 'application/json' });
      (api.get as Mock).mockResolvedValue({ data: mockBlob });

      const result = await codexService.exportProject('project-1');

      expect(api.get).toHaveBeenCalledWith('/api/codex/export/project-1', {
        params: { format: 'json' },
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });

    test('should export project with custom format', async () => {
      const mockBlob = new Blob(['Name,Type\nJohn,Character'], { type: 'text/csv' });
      (api.get as Mock).mockResolvedValue({ data: mockBlob });

      const result = await codexService.exportProject('project-1', 'csv');

      expect(api.get).toHaveBeenCalledWith('/api/codex/export/project-1', {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });

    test('should import project', async () => {
      const file = new File(['{"entities": []}'], 'import.json', { type: 'application/json' });
      const importResult = { imported: 5, skipped: 2, errors: ['Warning: duplicate entity'] };

      (api.post as Mock).mockResolvedValue({ data: importResult });

      const result = await codexService.importProject('project-1', file);

      expect(api.post).toHaveBeenCalledWith(
        '/api/codex/import/project-1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(importResult);
    });

    test('should import project with custom merge strategy', async () => {
      const file = new File(['{}'], 'import.json');
      const importResult = { imported: 3, skipped: 0, errors: [] };

      (api.post as Mock).mockResolvedValue({ data: importResult });

      const result = await codexService.importProject('project-1', file, 'replace');

      const call = (api.post as Mock).mock.calls[0];
      const formData = call[1] as FormData;
      
      expect(formData.get('mergeStrategy')).toBe('replace');
      expect(result).toEqual(importResult);
    });
  });

  describe('Templates and Presets', () => {
    test('should get entity templates', async () => {
      const templates = [
        { name: 'Protagonist', template: { importance: 5, tags: ['main'] } },
        { name: 'Antagonist', template: { importance: 4, tags: ['villain'] } },
      ];

      (api.get as Mock).mockResolvedValue({ data: templates });

      const result = await codexService.getEntityTemplates('character');

      expect(api.get).toHaveBeenCalledWith('/api/codex/templates/character');
      expect(result).toEqual(templates);
    });

    test('should create entity from template', async () => {
      const customData = { name: 'Hero Name', description: 'Custom description' };
      const createdEntity = { 
        id: 'entity-1',
        type: 'character' as EntityType,
        ...customData,
        importance: 5,
        tags: ['main'],
      };

      (api.post as Mock).mockResolvedValue({ data: createdEntity });

      const result = await codexService.createEntityFromTemplate('Protagonist', 'character', customData);

      expect(api.post).toHaveBeenCalledWith('/api/codex/templates/character/Protagonist', customData);
      expect(result).toEqual(createdEntity);
    });
  });

  describe('Migration and Legacy Support', () => {
    test('should migrate legacy entities', async () => {
      const migrationResult = { migrated: 15, errors: ['Could not migrate entity-old-1'] };
      (api.post as Mock).mockResolvedValue({ data: migrationResult });

      const result = await codexService.migrateLegacyEntities('project-1');

      expect(api.post).toHaveBeenCalledWith('/api/codex/migrate/project-1');
      expect(result).toEqual(migrationResult);
    });

    test('should sync with legacy models', async () => {
      const syncResult = { synced: 20, created: 5, updated: 15 };
      (api.post as Mock).mockResolvedValue({ data: syncResult });

      const result = await codexService.syncWithLegacyModels('project-1');

      expect(api.post).toHaveBeenCalledWith('/api/codex/sync-legacy/project-1');
      expect(result).toEqual(syncResult);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (api.get as Mock).mockRejectedValue(networkError);

      await expect(codexService.getEntity('entity-1')).rejects.toThrow('Network Error');
    });

    test('should handle invalid JSON responses', async () => {
      (api.get as Mock).mockResolvedValue({ data: 'invalid json' });

      const result = await codexService.getEntity('entity-1');
      expect(result).toBe('invalid json');
    });

    test('should handle empty results gracefully', async () => {
      (api.get as Mock).mockResolvedValue({ data: [] });

      const result = await codexService.searchEntities();
      expect(result).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large entity searches efficiently', async () => {
      const largeEntityList = Array.from({ length: 1000 }, (_, i) => ({
        id: `entity-${i}`,
        name: `Entity ${i}`,
        type: 'character' as EntityType,
      }));

      (api.get as Mock).mockResolvedValue({ data: largeEntityList });

      const startTime = performance.now();
      const result = await codexService.searchEntities();
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle bulk operations efficiently', async () => {
      const entities = Array.from({ length: 100 }, (_, i) => ({
        name: `Entity ${i}`,
        type: 'character' as EntityType,
        description: '',
        data: {},
        tags: [],
        importance: 1,
        notes: '',
        isUniversal: false,
      }));

      (api.post as Mock).mockResolvedValue({ data: entities });

      const startTime = performance.now();
      await codexService.bulkCreateEntities(entities);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete quickly
      expect(api.post).toHaveBeenCalledWith('/api/codex/entities/bulk', { entities });
    });
  });
});