/**
 * Core Codex Service - Central repository for all story entities
 * Provides comprehensive entity management with intelligent connections
 */

import { api } from './api';

// Type definitions for the Codex system
export interface CodexEntity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  data: Record<string, any>; // Type-specific fields
  tags: string[];
  category?: string;
  subcategory?: string;
  importance: number; // 1-5 scale
  avatar?: string;
  color?: string;
  notes: string;
  isUniversal: boolean;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType = 
  | 'character' 
  | 'location' 
  | 'object' 
  | 'lore' 
  | 'subplot' 
  | 'organization' 
  | 'event' 
  | 'concept'
  | 'custom';

export interface EntityRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  description?: string;
  strength: number; // 1-10
  isDirectional: boolean;
  startDate?: Date;
  endDate?: Date;
  status: 'active' | 'ended' | 'complicated';
  fromEntity?: CodexEntity;
  toEntity?: CodexEntity;
}

export type RelationshipType = 
  | 'family' 
  | 'organization' 
  | 'location' 
  | 'conflict' 
  | 'alliance' 
  | 'owns' 
  | 'member_of' 
  | 'located_in'
  | 'loves'
  | 'hates'
  | 'rivals'
  | 'mentor'
  | 'custom';

export interface TextReference {
  id: string;
  entityId: string;
  sourceType: string;
  sourceId: string;
  text: string;
  startPos: number;
  endPos: number;
  contextBefore: string;
  contextAfter: string;
  confidence: number;
  isConfirmed: boolean;
  isIgnored: boolean;
}

export interface MentionSuggestion {
  id: string;
  text: string;
  sourceType: string;
  sourceId: string;
  context: string;
  frequency: number;
  suggestedType?: EntityType;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected' | 'ignored';
  entityId?: string;
}

export interface EntityCollection {
  id: string;
  name: string;
  description?: string;
  type: 'manual' | 'smart' | 'auto';
  criteria: Record<string, any>;
  color?: string;
  icon?: string;
  isPublic: boolean;
  projectId?: string;
  members?: EntityCollectionMember[];
}

export interface EntityCollectionMember {
  id: string;
  collectionId: string;
  entityId: string;
  order: number;
  addedAt: Date;
}

export interface ConsistencyCheck {
  id: string;
  entityId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conflictingData: Record<string, any>;
  suggestions: string[];
  status: 'open' | 'resolved' | 'ignored';
  resolvedAt?: Date;
  resolution?: string;
}

export interface EntitySearchFilters {
  types?: EntityType[];
  tags?: string[];
  categories?: string[];
  importance?: number[];
  isUniversal?: boolean;
  projectId?: string;
  search?: string;
  hasRelationships?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface EntityStats {
  totalEntities: number;
  entitiesByType: Record<EntityType, number>;
  totalRelationships: number;
  averageImportance: number;
  mostConnectedEntity: CodexEntity | null;
  recentlyCreated: CodexEntity[];
  popularTags: Array<{ tag: string; count: number }>;
}

class CodexService {
  private baseUrl = '/api/codex';

  // ENTITY MANAGEMENT
  async createEntity(entity: Omit<CodexEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CodexEntity> {
    const response = await api.post(`${this.baseUrl}/entities`, entity);
    return response.data;
  }

  async updateEntity(id: string, updates: Partial<CodexEntity>): Promise<CodexEntity> {
    const response = await api.put(`${this.baseUrl}/entities/${id}`, updates);
    return response.data;
  }

  async deleteEntity(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/entities/${id}`);
  }

  async getEntity(id: string): Promise<CodexEntity> {
    const response = await api.get(`${this.baseUrl}/entities/${id}`);
    return response.data;
  }

  async getEntityWithRelationships(id: string): Promise<CodexEntity & { relationships: EntityRelationship[] }> {
    const response = await api.get(`${this.baseUrl}/entities/${id}/relationships`);
    return response.data;
  }

  // ENTITY SEARCH AND FILTERING
  async searchEntities(filters: EntitySearchFilters = {}): Promise<CodexEntity[]> {
    const response = await api.get(`${this.baseUrl}/entities/search`, { params: filters });
    return response.data;
  }

  async getEntitiesByProject(projectId: string, type?: EntityType): Promise<CodexEntity[]> {
    const params = type ? { type } : {};
    const response = await api.get(`${this.baseUrl}/entities/project/${projectId}`, { params });
    return response.data;
  }

  async getUniversalEntities(type?: EntityType): Promise<CodexEntity[]> {
    const params = type ? { type } : {};
    const response = await api.get(`${this.baseUrl}/entities/universal`, { params });
    return response.data;
  }

  async getEntitiesByType(type: EntityType, projectId?: string): Promise<CodexEntity[]> {
    const params = projectId ? { projectId } : {};
    const response = await api.get(`${this.baseUrl}/entities/type/${type}`, { params });
    return response.data;
  }

  // RELATIONSHIP MANAGEMENT
  async createRelationship(relationship: Omit<EntityRelationship, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityRelationship> {
    const response = await api.post(`${this.baseUrl}/relationships`, relationship);
    return response.data;
  }

  async updateRelationship(id: string, updates: Partial<EntityRelationship>): Promise<EntityRelationship> {
    const response = await api.put(`${this.baseUrl}/relationships/${id}`, updates);
    return response.data;
  }

  async deleteRelationship(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/relationships/${id}`);
  }

  async getEntityRelationships(entityId: string): Promise<EntityRelationship[]> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/relationships`);
    return response.data;
  }

  async getRelationshipsByType(type: RelationshipType, projectId?: string): Promise<EntityRelationship[]> {
    const params = projectId ? { projectId } : {};
    const response = await api.get(`${this.baseUrl}/relationships/type/${type}`, { params });
    return response.data;
  }

  // TEXT REFERENCE MANAGEMENT
  async getTextReferences(entityId: string): Promise<TextReference[]> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/references`);
    return response.data;
  }

  async createTextReference(reference: Omit<TextReference, 'id' | 'createdAt'>): Promise<TextReference> {
    const response = await api.post(`${this.baseUrl}/references`, reference);
    return response.data;
  }

  async updateTextReference(id: string, updates: Partial<TextReference>): Promise<TextReference> {
    const response = await api.put(`${this.baseUrl}/references/${id}`, updates);
    return response.data;
  }

  async deleteTextReference(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/references/${id}`);
  }

  async getReferencesForDocument(sourceType: string, sourceId: string): Promise<TextReference[]> {
    const response = await api.get(`${this.baseUrl}/references/document/${sourceType}/${sourceId}`);
    return response.data;
  }

  // MENTION SUGGESTIONS
  async getMentionSuggestions(projectId?: string, status: string = 'pending'): Promise<MentionSuggestion[]> {
    const params = { status, ...(projectId && { projectId }) };
    const response = await api.get(`${this.baseUrl}/suggestions`, { params });
    return response.data;
  }

  async acceptMentionSuggestion(suggestionId: string, entityData: Partial<CodexEntity>): Promise<{ entity: CodexEntity; suggestion: MentionSuggestion }> {
    const response = await api.post(`${this.baseUrl}/suggestions/${suggestionId}/accept`, entityData);
    return response.data;
  }

  async rejectMentionSuggestion(suggestionId: string): Promise<MentionSuggestion> {
    const response = await api.put(`${this.baseUrl}/suggestions/${suggestionId}/reject`);
    return response.data;
  }

  async ignoreMentionSuggestion(suggestionId: string): Promise<MentionSuggestion> {
    const response = await api.put(`${this.baseUrl}/suggestions/${suggestionId}/ignore`);
    return response.data;
  }

  // ENTITY COLLECTIONS
  async createCollection(collection: Omit<EntityCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<EntityCollection> {
    const response = await api.post(`${this.baseUrl}/collections`, collection);
    return response.data;
  }

  async updateCollection(id: string, updates: Partial<EntityCollection>): Promise<EntityCollection> {
    const response = await api.put(`${this.baseUrl}/collections/${id}`, updates);
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/collections/${id}`);
  }

  async getCollection(id: string): Promise<EntityCollection> {
    const response = await api.get(`${this.baseUrl}/collections/${id}`);
    return response.data;
  }

  async getCollectionsByProject(projectId: string): Promise<EntityCollection[]> {
    const response = await api.get(`${this.baseUrl}/collections/project/${projectId}`);
    return response.data;
  }

  async addEntityToCollection(collectionId: string, entityId: string, order?: number): Promise<EntityCollectionMember> {
    const response = await api.post(`${this.baseUrl}/collections/${collectionId}/members`, { entityId, order });
    return response.data;
  }

  async removeEntityFromCollection(collectionId: string, entityId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/collections/${collectionId}/members/${entityId}`);
  }

  async reorderCollectionMembers(collectionId: string, memberOrders: Array<{ entityId: string; order: number }>): Promise<void> {
    await api.put(`${this.baseUrl}/collections/${collectionId}/reorder`, { memberOrders });
  }

  // CONSISTENCY CHECKS
  async getConsistencyChecks(projectId?: string, severity?: string): Promise<ConsistencyCheck[]> {
    const params = { ...(projectId && { projectId }), ...(severity && { severity }) };
    const response = await api.get(`${this.baseUrl}/consistency`, { params });
    return response.data;
  }

  async runConsistencyCheck(entityId: string): Promise<ConsistencyCheck[]> {
    const response = await api.post(`${this.baseUrl}/consistency/run/${entityId}`);
    return response.data;
  }

  async resolveConsistencyCheck(checkId: string, resolution: string): Promise<ConsistencyCheck> {
    const response = await api.put(`${this.baseUrl}/consistency/${checkId}/resolve`, { resolution });
    return response.data;
  }

  async ignoreConsistencyCheck(checkId: string): Promise<ConsistencyCheck> {
    const response = await api.put(`${this.baseUrl}/consistency/${checkId}/ignore`);
    return response.data;
  }

  // ANALYTICS AND STATISTICS
  async getEntityStats(projectId?: string): Promise<EntityStats> {
    const params = projectId ? { projectId } : {};
    const response = await api.get(`${this.baseUrl}/stats`, { params });
    return response.data;
  }

  async getPopularTags(projectId?: string, limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    const params = { limit, ...(projectId && { projectId }) };
    const response = await api.get(`${this.baseUrl}/tags/popular`, { params });
    return response.data;
  }

  async getEntityConnections(entityId: string, depth: number = 2): Promise<{ entities: CodexEntity[]; relationships: EntityRelationship[] }> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/connections`, { params: { depth } });
    return response.data;
  }

  // BULK OPERATIONS
  async bulkCreateEntities(entities: Array<Omit<CodexEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CodexEntity[]> {
    const response = await api.post(`${this.baseUrl}/entities/bulk`, { entities });
    return response.data;
  }

  async bulkUpdateEntities(updates: Array<{ id: string; data: Partial<CodexEntity> }>): Promise<CodexEntity[]> {
    const response = await api.put(`${this.baseUrl}/entities/bulk`, { updates });
    return response.data;
  }

  async bulkDeleteEntities(entityIds: string[]): Promise<void> {
    await api.delete(`${this.baseUrl}/entities/bulk`, { data: { entityIds } });
  }

  async exportProject(projectId: string, format: 'json' | 'csv' | 'markdown' = 'json'): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/export/${projectId}`, { 
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async importProject(projectId: string, file: File, mergeStrategy: 'replace' | 'merge' | 'skip' = 'merge'): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mergeStrategy', mergeStrategy);
    
    const response = await api.post(`${this.baseUrl}/import/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // TEMPLATES AND PRESETS
  async getEntityTemplates(type: EntityType): Promise<Array<{ name: string; template: Partial<CodexEntity> }>> {
    const response = await api.get(`${this.baseUrl}/templates/${type}`);
    return response.data;
  }

  async createEntityFromTemplate(templateName: string, type: EntityType, customData: Partial<CodexEntity>): Promise<CodexEntity> {
    const response = await api.post(`${this.baseUrl}/templates/${type}/${templateName}`, customData);
    return response.data;
  }

  // MIGRATION AND LEGACY SUPPORT
  async migrateLegacyEntities(projectId: string): Promise<{ migrated: number; errors: string[] }> {
    const response = await api.post(`${this.baseUrl}/migrate/${projectId}`);
    return response.data;
  }

  async syncWithLegacyModels(projectId: string): Promise<{ synced: number; created: number; updated: number }> {
    const response = await api.post(`${this.baseUrl}/sync-legacy/${projectId}`);
    return response.data;
  }
}

// Export singleton instance
export const codexService = new CodexService();
export default codexService;