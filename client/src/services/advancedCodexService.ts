/**
 * Advanced Codex Service - Phase 1C Implementation
 * Comprehensive entity management surpassing NovelCrafter's Codex
 * Features: 7 entity types, AI-powered linking, visual relationships, universe management
 */

import { api } from './api';
import { collaborationService } from './collaborationService';
import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  CharacterEntity,
  LocationEntity,
  ObjectEntity,
  LoreEntity,
  ThemeEntity,
  SubplotEntity,
  OrganizationEntity,
  EntityLink,
  EntityMention,
  AISuggestion,
  ConsistencyFlag,
  AdvancedSearchFilters,
  SearchResult,
  Universe,
  Series,
  CodexAnalytics,
  CodexExportOptions,
  Timeline,
  TimelineEvent,
  CodexCollaborationEvent,
  CodexPresence
} from '@/types/codex';

// Enhanced search and analysis interfaces
export interface AutoLinkingResult {
  suggestions: EntityMention[];
  newEntitySuggestions: NewEntitySuggestion[];
  conflictWarnings: ConflictWarning[];
}

export interface NewEntitySuggestion {
  text: string;
  suggestedType: AdvancedEntityType;
  confidence: number;
  context: string;
  frequency: number;
  reasoning: string;
}

export interface ConflictWarning {
  type: 'name_conflict' | 'attribute_mismatch' | 'timeline_inconsistency' | 'relationship_conflict';
  entityIds: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution?: string;
}

export interface RelationshipSuggestion {
  fromEntityId: string;
  toEntityId: string;
  suggestedLinkType: string;
  confidence: number;
  evidence: string[];
  reasoning: string;
}

export interface VisualNetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  clusters: NetworkCluster[];
  stats: NetworkStats;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: AdvancedEntityType;
  size: number;
  color: string;
  importance: number;
  position?: { x: number; y: number };
  entity: AdvancedCodexEntity;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  color: string;
  label?: string;
  bidirectional: boolean;
}

export interface NetworkCluster {
  id: string;
  name: string;
  nodes: string[];
  color: string;
  type: 'family' | 'organization' | 'location' | 'theme' | 'subplot' | 'auto';
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  averageConnections: number;
  networkDensity: number;
  centralityScores: Record<string, number>;
  clusterCount: number;
}

export interface ConsistencyCheckResult {
  entityId: string;
  issues: ConsistencyIssue[];
  suggestions: string[];
  overallScore: number;
}

export interface ConsistencyIssue {
  type: 'missing_information' | 'contradictory_data' | 'timeline_conflict' | 'relationship_mismatch';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  affectedFields: string[];
  evidence: string[];
  suggestedFix?: string;
}

class AdvancedCodexService {
  private baseUrl = '/api/codex/advanced';
  private realtimeConnection: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  
  constructor() {
    this.initializeRealtimeConnection();
  }

  // ENTITY MANAGEMENT - Enhanced CRUD operations
  
  async createEntity(
    projectId: string,
    type: AdvancedEntityType,
    data: Partial<AdvancedCodexEntity>
  ): Promise<AdvancedCodexEntity> {
    const response = await api.post(`${this.baseUrl}/entities`, {
      projectId,
      type,
      ...data
    });
    
    const entity = response.data;
    
    // Trigger auto-linking analysis
    this.analyzeAutoLinking(entity.id);
    
    // Emit real-time event
    this.emitCollaborationEvent('entity_created', entity.id, entity);
    
    return entity;
  }

  async updateEntity(
    entityId: string,
    updates: Partial<AdvancedCodexEntity>,
    options: { skipAutoLink?: boolean; skipConsistencyCheck?: boolean } = {}
  ): Promise<AdvancedCodexEntity> {
    const response = await api.put(`${this.baseUrl}/entities/${entityId}`, {
      updates,
      options
    });
    
    const entity = response.data;
    
    if (!options.skipAutoLink && (updates.name || updates.aliases)) {
      this.analyzeAutoLinking(entityId);
    }
    
    if (!options.skipConsistencyCheck) {
      this.runConsistencyCheck(entityId);
    }
    
    this.emitCollaborationEvent('entity_updated', entityId, { updates });
    
    return entity;
  }

  async getEntity(entityId: string, includeRelationships = false): Promise<AdvancedCodexEntity> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}`, {
      params: { includeRelationships }
    });
    return response.data;
  }

  async deleteEntity(entityId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/entities/${entityId}`);
    this.emitCollaborationEvent('entity_deleted', entityId, {});
  }

  async bulkCreateEntities(entities: Array<Partial<AdvancedCodexEntity>>): Promise<AdvancedCodexEntity[]> {
    const response = await api.post(`${this.baseUrl}/entities/bulk`, { entities });
    return response.data;
  }

  async bulkUpdateEntities(
    updates: Array<{ id: string; data: Partial<AdvancedCodexEntity> }>
  ): Promise<AdvancedCodexEntity[]> {
    const response = await api.put(`${this.baseUrl}/entities/bulk`, { updates });
    return response.data;
  }

  // INTELLIGENT AUTO-LINKING ENGINE

  async analyzeDocumentForEntities(
    documentId: string,
    content: string,
    projectId: string
  ): Promise<AutoLinkingResult> {
    const response = await api.post(`${this.baseUrl}/auto-link/analyze`, {
      documentId,
      content,
      projectId
    });
    return response.data;
  }

  async analyzeAutoLinking(entityId: string): Promise<EntityMention[]> {
    const response = await api.post(`${this.baseUrl}/auto-link/entity/${entityId}`);
    return response.data;
  }

  async acceptEntitySuggestion(
    suggestionId: string,
    entityData: Partial<AdvancedCodexEntity>
  ): Promise<AdvancedCodexEntity> {
    const response = await api.post(`${this.baseUrl}/auto-link/accept/${suggestionId}`, {
      entityData
    });
    return response.data;
  }

  async getAutoLinkSettings(projectId: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/auto-link/settings/${projectId}`);
    return response.data;
  }

  async updateAutoLinkSettings(projectId: string, settings: any): Promise<void> {
    await api.put(`${this.baseUrl}/auto-link/settings/${projectId}`, settings);
  }

  // ADVANCED RELATIONSHIP MAPPING

  async createEntityLink(
    fromEntityId: string,
    toEntityId: string,
    linkType: string,
    data: Partial<EntityLink>
  ): Promise<EntityLink> {
    const response = await api.post(`${this.baseUrl}/relationships`, {
      fromEntityId,
      toEntityId,
      linkType,
      ...data
    });
    
    this.emitCollaborationEvent('relationship_created', `${fromEntityId}-${toEntityId}`, response.data);
    return response.data;
  }

  async getEntityRelationships(entityId: string, depth = 1): Promise<EntityLink[]> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/relationships`, {
      params: { depth }
    });
    return response.data;
  }

  async suggestRelationships(entityId: string): Promise<RelationshipSuggestion[]> {
    const response = await api.post(`${this.baseUrl}/relationships/suggest/${entityId}`);
    return response.data;
  }

  async generateNetworkVisualization(
    projectId: string,
    filters?: AdvancedSearchFilters
  ): Promise<VisualNetworkData> {
    const response = await api.post(`${this.baseUrl}/visualization/network/${projectId}`, {
      filters
    });
    return response.data;
  }

  async getEntitySubgraph(entityId: string, depth = 2): Promise<VisualNetworkData> {
    const response = await api.get(`${this.baseUrl}/visualization/subgraph/${entityId}`, {
      params: { depth }
    });
    return response.data;
  }

  // ADVANCED SEARCH AND FILTERING

  async searchEntities(
    filters: AdvancedSearchFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ results: SearchResult[]; total: number; page: number }> {
    const response = await api.post(`${this.baseUrl}/search`, {
      filters,
      pagination
    });
    return response.data;
  }

  async searchAcrossUniverse(
    universeId: string,
    query: string,
    filters?: Partial<AdvancedSearchFilters>
  ): Promise<SearchResult[]> {
    const response = await api.post(`${this.baseUrl}/search/universe/${universeId}`, {
      query,
      filters
    });
    return response.data;
  }

  async getSearchSuggestions(
    projectId: string,
    query: string
  ): Promise<string[]> {
    const response = await api.get(`${this.baseUrl}/search/suggestions/${projectId}`, {
      params: { query }
    });
    return response.data;
  }

  // AI-POWERED CONSISTENCY CHECKING

  async runConsistencyCheck(entityId: string): Promise<ConsistencyCheckResult> {
    const response = await api.post(`${this.baseUrl}/consistency/check/${entityId}`);
    return response.data;
  }

  async runProjectConsistencyCheck(
    projectId: string
  ): Promise<ConsistencyCheckResult[]> {
    const response = await api.post(`${this.baseUrl}/consistency/project/${projectId}`);
    return response.data;
  }

  async getConsistencyFlags(
    projectId: string,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ConsistencyFlag[]> {
    const response = await api.get(`${this.baseUrl}/consistency/flags/${projectId}`, {
      params: { severity }
    });
    return response.data;
  }

  async resolveConsistencyFlag(
    flagId: string,
    resolution: string,
    changes?: any
  ): Promise<void> {
    await api.post(`${this.baseUrl}/consistency/resolve/${flagId}`, {
      resolution,
      changes
    });
  }

  async getAISuggestions(
    entityId: string,
    type?: 'relationship' | 'attribute' | 'development'
  ): Promise<AISuggestion[]> {
    const response = await api.get(`${this.baseUrl}/ai/suggestions/${entityId}`, {
      params: { type }
    });
    return response.data;
  }

  // SERIES & UNIVERSE MANAGEMENT

  async createUniverse(data: Partial<Universe>): Promise<Universe> {
    const response = await api.post(`${this.baseUrl}/universe`, data);
    return response.data;
  }

  async getUniverse(universeId: string): Promise<Universe> {
    const response = await api.get(`${this.baseUrl}/universe/${universeId}`);
    return response.data;
  }

  async updateUniverse(universeId: string, updates: Partial<Universe>): Promise<Universe> {
    const response = await api.put(`${this.baseUrl}/universe/${universeId}`, updates);
    return response.data;
  }

  async createSeries(universeId: string, data: Partial<Series>): Promise<Series> {
    const response = await api.post(`${this.baseUrl}/universe/${universeId}/series`, data);
    return response.data;
  }

  async addProjectToSeries(seriesId: string, projectId: string, order?: number): Promise<void> {
    await api.post(`${this.baseUrl}/series/${seriesId}/projects`, {
      projectId,
      order
    });
  }

  async getSharedEntities(universeId: string): Promise<AdvancedCodexEntity[]> {
    const response = await api.get(`${this.baseUrl}/universe/${universeId}/shared-entities`);
    return response.data;
  }

  async shareEntityWithUniverse(entityId: string, universeId: string): Promise<void> {
    await api.post(`${this.baseUrl}/entities/${entityId}/share/${universeId}`);
  }

  async syncEntityAcrossSeries(entityId: string, changes: any): Promise<void> {
    await api.post(`${this.baseUrl}/entities/${entityId}/sync`, { changes });
  }

  // TIMELINE INTEGRATION

  async createTimeline(data: Partial<Timeline>): Promise<Timeline> {
    const response = await api.post(`${this.baseUrl}/timeline`, data);
    return response.data;
  }

  async addEntityToTimeline(
    timelineId: string,
    entityId: string,
    eventData: Partial<TimelineEvent>
  ): Promise<TimelineEvent> {
    const response = await api.post(`${this.baseUrl}/timeline/${timelineId}/events`, {
      entityId,
      ...eventData
    });
    return response.data;
  }

  async getEntityTimeline(entityId: string): Promise<TimelineEvent[]> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/timeline`);
    return response.data;
  }

  async detectTimelineConflicts(projectId: string): Promise<ConflictWarning[]> {
    const response = await api.post(`${this.baseUrl}/timeline/conflicts/${projectId}`);
    return response.data;
  }

  // COLLABORATION FEATURES

  async getActiveCollaborators(projectId: string): Promise<CodexPresence[]> {
    const response = await api.get(`${this.baseUrl}/collaboration/presence/${projectId}`);
    return response.data;
  }

  async updatePresence(projectId: string, entityId?: string): Promise<void> {
    await api.post(`${this.baseUrl}/collaboration/presence/${projectId}`, {
      entityId,
      timestamp: new Date().toISOString()
    });
  }

  async getCollaborationHistory(
    projectId: string,
    since?: string
  ): Promise<CodexCollaborationEvent[]> {
    const response = await api.get(`${this.baseUrl}/collaboration/history/${projectId}`, {
      params: { since }
    });
    return response.data;
  }

  async addCollaborativeNote(
    entityId: string,
    content: string,
    type: 'comment' | 'suggestion' | 'question'
  ): Promise<void> {
    await api.post(`${this.baseUrl}/entities/${entityId}/notes`, {
      content,
      type
    });
  }

  // ANALYTICS AND INSIGHTS

  async getCodexAnalytics(
    projectId: string,
    timeframe?: 'day' | 'week' | 'month' | 'year'
  ): Promise<CodexAnalytics> {
    const response = await api.get(`${this.baseUrl}/analytics/${projectId}`, {
      params: { timeframe }
    });
    return response.data;
  }

  async getEntityInsights(entityId: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/analytics/entity/${entityId}`);
    return response.data;
  }

  async getRelationshipAnalysis(projectId: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/analytics/relationships/${projectId}`);
    return response.data;
  }

  // EXPORT AND IMPORT

  async exportCodex(
    projectId: string,
    options: CodexExportOptions
  ): Promise<Blob> {
    const response = await api.post(`${this.baseUrl}/export/${projectId}`, options, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportUniverse(
    universeId: string,
    options: CodexExportOptions
  ): Promise<Blob> {
    const response = await api.post(`${this.baseUrl}/export/universe/${universeId}`, options, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importCodex(
    projectId: string,
    file: File,
    options: { mergeStrategy: 'replace' | 'merge' | 'skip'; validateConsistency: boolean }
  ): Promise<{ imported: number; warnings: string[]; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    const response = await api.post(`${this.baseUrl}/import/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // TEMPLATE AND PRESET MANAGEMENT

  async getEntityTemplates(type: AdvancedEntityType): Promise<any[]> {
    const response = await api.get(`${this.baseUrl}/templates/${type}`);
    return response.data;
  }

  async createEntityFromTemplate(
    templateId: string,
    projectId: string,
    customData: any
  ): Promise<AdvancedCodexEntity> {
    const response = await api.post(`${this.baseUrl}/templates/${templateId}/create`, {
      projectId,
      customData
    });
    return response.data;
  }

  async saveAsTemplate(
    entityId: string,
    templateName: string,
    isPublic = false
  ): Promise<void> {
    await api.post(`${this.baseUrl}/entities/${entityId}/save-template`, {
      templateName,
      isPublic
    });
  }

  // REAL-TIME COLLABORATION

  private initializeRealtimeConnection(): void {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/codex`;
    
    this.realtimeConnection = new WebSocket(wsUrl);
    
    this.realtimeConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeEvent(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.realtimeConnection.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.initializeRealtimeConnection(), 5000);
    };
  }

  private handleRealtimeEvent(event: CodexCollaborationEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));
  }

  private emitCollaborationEvent(
    type: CodexCollaborationEvent['type'],
    entityId: string,
    data: any
  ): void {
    if (this.realtimeConnection?.readyState === WebSocket.OPEN) {
      this.realtimeConnection.send(JSON.stringify({
        type,
        entityId,
        data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // UTILITY METHODS

  async validateEntityData(
    type: AdvancedEntityType,
    data: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const response = await api.post(`${this.baseUrl}/validate/${type}`, data);
    return response.data;
  }

  async getEntityTypeInfo(type: AdvancedEntityType): Promise<any> {
    const response = await api.get(`${this.baseUrl}/types/${type}/info`);
    return response.data;
  }

  async getRecommendedFields(
    type: AdvancedEntityType,
    existingData: any
  ): Promise<string[]> {
    const response = await api.post(`${this.baseUrl}/types/${type}/recommend-fields`, {
      existingData
    });
    return response.data;
  }

  // INTEGRATION HELPERS

  async linkToPlotBoard(entityId: string, sceneId: string): Promise<void> {
    await api.post(`${this.baseUrl}/integration/plot-board`, {
      entityId,
      sceneId
    });
  }

  async linkToTimeline(entityId: string, timelineEventId: string): Promise<void> {
    await api.post(`${this.baseUrl}/integration/timeline`, {
      entityId,
      timelineEventId
    });
  }

  async syncWithExistingCharacters(projectId: string): Promise<void> {
    await api.post(`${this.baseUrl}/integration/sync-characters/${projectId}`);
  }

  // CLEANUP

  dispose(): void {
    if (this.realtimeConnection) {
      this.realtimeConnection.close();
      this.realtimeConnection = null;
    }
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const advancedCodexService = new AdvancedCodexService();
export default advancedCodexService;