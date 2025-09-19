/**
 * Universe Management Service - Phase 1C Feature
 * Multi-book support with shared entities, cross-series references, and universe-wide consistency
 */

import { api } from './api';
import { advancedCodexService } from './advancedCodexService';
import { collaborationService } from './collaborationService';
import type {
  Universe,
  Series,
  AdvancedCodexEntity,
  UniverseCollaborator,
  UniversePermission,
  ConsistencyRule,
  Timeline
} from '@/types/codex';

// Extended interfaces for universe management
export interface UniverseCreationData {
  name: string;
  description: string;
  genre?: string;
  setting?: string;
  timeframe?: string;
  scope?: 'single_world' | 'multiverse' | 'alternate_realities';
  isPublic?: boolean;
  collaborationSettings?: UniverseCollaborationSettings;
}

export interface UniverseCollaborationSettings {
  allowPublicContributions: boolean;
  requireApprovalForChanges: boolean;
  autoMergeMinorEdits: boolean;
  notificationPreferences: NotificationPreferences;
  conflictResolutionStrategy: 'manual' | 'auto_latest' | 'auto_majority';
}

export interface NotificationPreferences {
  entityChanges: boolean;
  newSeries: boolean;
  collaboratorJoined: boolean;
  consistencyIssues: boolean;
  majorUpdates: boolean;
}

export interface SeriesCreationData {
  name: string;
  description: string;
  plannedBooks: number;
  genre?: string;
  targetAudience?: string;
  status: 'planned' | 'writing' | 'published' | 'completed' | 'hiatus';
  chronologyType: 'sequential' | 'parallel' | 'standalone' | 'anthology';
}

export interface EntitySyncConflict {
  entityId: string;
  entityName: string;
  conflictType: 'attribute_mismatch' | 'timeline_conflict' | 'relationship_inconsistency' | 'existence_conflict';
  sourceProject: string;
  targetProject: string;
  sourceData: any;
  targetData: any;
  suggestedResolution: ConflictResolution;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface ConflictResolution {
  action: 'use_source' | 'use_target' | 'merge' | 'create_variant' | 'manual_review';
  reasoning: string;
  mergedData?: any;
  requiresApproval: boolean;
}

export interface CrossReferenceAnalysis {
  entity: AdvancedCodexEntity;
  referencesAcrossSeries: CrossReference[];
  consistencyScore: number;
  recommendedUpdates: string[];
  potentialConflicts: string[];
}

export interface CrossReference {
  seriesId: string;
  seriesName: string;
  projectId: string;
  projectName: string;
  mentionCount: number;
  lastMentioned: string;
  contextSummary: string;
  importanceInSeries: number;
}

export interface UniverseAnalytics {
  totalSeries: number;
  totalBooks: number;
  totalEntities: number;
  sharedEntities: number;
  uniqueEntities: number;
  consistencyScore: number;
  collaboratorActivity: CollaboratorActivity[];
  popularEntities: EntityPopularity[];
  timelineComplexity: number;
  crossReferences: number;
}

export interface CollaboratorActivity {
  collaboratorId: string;
  collaboratorName: string;
  entitiesCreated: number;
  entitiesModified: number;
  lastActivity: string;
  contributionScore: number;
}

export interface EntityPopularity {
  entityId: string;
  entityName: string;
  entityType: string;
  mentionCount: number;
  seriesCount: number;
  importance: number;
}

export interface UniverseBrowser {
  universes: UniverseListItem[];
  publicUniverses: UniverseListItem[];
  collaboratingUniverses: UniverseListItem[];
  totalCount: number;
  filters: UniverseBrowserFilters;
}

export interface UniverseListItem {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  seriesCount: number;
  entityCount: number;
  collaboratorCount: number;
  isPublic: boolean;
  lastUpdated: string;
  thumbnail?: string;
  tags: string[];
}

export interface UniverseBrowserFilters {
  genre?: string;
  scope?: string;
  collaboratorRole?: string;
  isPublic?: boolean;
  hasActiveCollaboration?: boolean;
  minSeriesCount?: number;
  sortBy: 'name' | 'created' | 'updated' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

export interface EntityMigrationPlan {
  sourceProjectId: string;
  targetUniverseId: string;
  entitiesToMigrate: string[];
  migrationStrategy: 'copy' | 'move' | 'link';
  handleConflicts: 'skip' | 'rename' | 'merge' | 'prompt';
  preserveRelationships: boolean;
  updateReferences: boolean;
}

export interface MigrationResult {
  successful: number;
  failed: number;
  conflicts: EntitySyncConflict[];
  warnings: string[];
  newEntityMappings: Record<string, string>; // old ID -> new ID
}

class UniverseManagementService {
  private baseUrl = '/api/universe';
  private eventListeners: Map<string, Function[]> = new Map();

  // UNIVERSE CRUD OPERATIONS

  async createUniverse(data: UniverseCreationData): Promise<Universe> {
    const response = await api.post(`${this.baseUrl}/create`, data);
    const universe = response.data;
    
    // Set up default consistency rules
    await this.setupDefaultConsistencyRules(universe.id);
    
    // Create universal timeline if needed
    if (data.timeframe) {
      await this.createUniverseTimeline(universe.id, data.timeframe);
    }
    
    this.emitEvent('universe_created', universe);
    return universe;
  }

  async getUniverse(universeId: string, includeDetail = false): Promise<Universe> {
    const response = await api.get(`${this.baseUrl}/${universeId}`, {
      params: { includeDetail }
    });
    return response.data;
  }

  async updateUniverse(universeId: string, updates: Partial<Universe>): Promise<Universe> {
    const response = await api.put(`${this.baseUrl}/${universeId}`, updates);
    this.emitEvent('universe_updated', response.data);
    return response.data;
  }

  async deleteUniverse(universeId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${universeId}`);
    this.emitEvent('universe_deleted', { universeId });
  }

  async duplicateUniverse(
    universeId: string,
    newName: string,
    includeCollaborators = false
  ): Promise<Universe> {
    const response = await api.post(`${this.baseUrl}/${universeId}/duplicate`, {
      newName,
      includeCollaborators
    });
    return response.data;
  }

  // SERIES MANAGEMENT

  async createSeries(universeId: string, data: SeriesCreationData): Promise<Series> {
    const response = await api.post(`${this.baseUrl}/${universeId}/series`, data);
    const series = response.data;
    
    this.emitEvent('series_created', { universeId, series });
    return series;
  }

  async updateSeries(seriesId: string, updates: Partial<Series>): Promise<Series> {
    const response = await api.put(`${this.baseUrl}/series/${seriesId}`, updates);
    this.emitEvent('series_updated', response.data);
    return response.data;
  }

  async deleteSeries(seriesId: string, handleOrphanedEntities: 'delete' | 'move_to_universe' | 'keep'): Promise<void> {
    await api.delete(`${this.baseUrl}/series/${seriesId}`, {
      data: { handleOrphanedEntities }
    });
    this.emitEvent('series_deleted', { seriesId });
  }

  async addBookToSeries(seriesId: string, projectId: string, order?: number): Promise<void> {
    await api.post(`${this.baseUrl}/series/${seriesId}/books`, {
      projectId,
      order
    });
    this.emitEvent('book_added_to_series', { seriesId, projectId });
  }

  async removeBookFromSeries(seriesId: string, projectId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/series/${seriesId}/books/${projectId}`);
    this.emitEvent('book_removed_from_series', { seriesId, projectId });
  }

  async reorderBooksInSeries(seriesId: string, bookOrder: Array<{ projectId: string; order: number }>): Promise<void> {
    await api.put(`${this.baseUrl}/series/${seriesId}/reorder`, { bookOrder });
    this.emitEvent('series_reordered', { seriesId, bookOrder });
  }

  // SHARED ENTITY MANAGEMENT

  async shareEntityWithUniverse(entityId: string, universeId: string): Promise<void> {
    await api.post(`${this.baseUrl}/${universeId}/shared-entities`, { entityId });
    this.emitEvent('entity_shared_with_universe', { entityId, universeId });
  }

  async unshareEntityFromUniverse(entityId: string, universeId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${universeId}/shared-entities/${entityId}`);
    this.emitEvent('entity_unshared_from_universe', { entityId, universeId });
  }

  async getSharedEntities(universeId: string, filters?: {
    type?: string;
    series?: string[];
    importance?: number;
  }): Promise<AdvancedCodexEntity[]> {
    const response = await api.get(`${this.baseUrl}/${universeId}/shared-entities`, {
      params: filters
    });
    return response.data;
  }

  async syncEntityAcrossUniverse(
    entityId: string,
    changes: any,
    affectedProjects: string[]
  ): Promise<EntitySyncConflict[]> {
    const response = await api.post(`${this.baseUrl}/entities/${entityId}/sync`, {
      changes,
      affectedProjects
    });
    
    const conflicts = response.data.conflicts;
    if (conflicts.length > 0) {
      this.emitEvent('sync_conflicts_detected', { entityId, conflicts });
    }
    
    return conflicts;
  }

  async resolveEntitySyncConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    await api.post(`${this.baseUrl}/conflicts/${conflictId}/resolve`, resolution);
    this.emitEvent('conflict_resolved', { conflictId, resolution });
  }

  async bulkSyncEntities(
    universeId: string,
    entityIds: string[],
    syncStrategy: 'conservative' | 'aggressive' | 'interactive'
  ): Promise<{
    successful: number;
    conflicts: EntitySyncConflict[];
    warnings: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/${universeId}/bulk-sync`, {
      entityIds,
      syncStrategy
    });
    return response.data;
  }

  // CROSS-REFERENCE ANALYSIS

  async analyzeCrossReferences(universeId: string): Promise<CrossReferenceAnalysis[]> {
    const response = await api.get(`${this.baseUrl}/${universeId}/cross-references`);
    return response.data;
  }

  async getEntityCrossReferences(entityId: string): Promise<CrossReference[]> {
    const response = await api.get(`${this.baseUrl}/entities/${entityId}/cross-references`);
    return response.data;
  }

  async findInconsistentReferences(universeId: string): Promise<{
    inconsistencies: any[];
    suggestedFixes: any[];
  }> {
    const response = await api.post(`${this.baseUrl}/${universeId}/check-consistency`);
    return response.data;
  }

  async updateCrossReferences(
    entityId: string,
    updates: Record<string, any>
  ): Promise<void> {
    await api.put(`${this.baseUrl}/entities/${entityId}/update-references`, updates);
    this.emitEvent('cross_references_updated', { entityId, updates });
  }

  // COLLABORATION MANAGEMENT

  async addCollaborator(
    universeId: string,
    email: string,
    role: UniverseCollaborator['role'],
    permissions: UniversePermission[]
  ): Promise<UniverseCollaborator> {
    const response = await api.post(`${this.baseUrl}/${universeId}/collaborators`, {
      email,
      role,
      permissions
    });
    
    const collaborator = response.data;
    this.emitEvent('collaborator_added', { universeId, collaborator });
    return collaborator;
  }

  async updateCollaboratorRole(
    universeId: string,
    collaboratorId: string,
    role: UniverseCollaborator['role'],
    permissions: UniversePermission[]
  ): Promise<void> {
    await api.put(`${this.baseUrl}/${universeId}/collaborators/${collaboratorId}`, {
      role,
      permissions
    });
    this.emitEvent('collaborator_updated', { universeId, collaboratorId, role, permissions });
  }

  async removeCollaborator(universeId: string, collaboratorId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${universeId}/collaborators/${collaboratorId}`);
    this.emitEvent('collaborator_removed', { universeId, collaboratorId });
  }

  async getCollaboratorActivity(
    universeId: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<CollaboratorActivity[]> {
    const response = await api.get(`${this.baseUrl}/${universeId}/collaborator-activity`, {
      params: { timeframe }
    });
    return response.data;
  }

  // CONSISTENCY RULES AND VALIDATION

  async setupDefaultConsistencyRules(universeId: string): Promise<void> {
    const defaultRules: Partial<ConsistencyRule>[] = [
      {
        name: 'Character Name Consistency',
        description: 'Ensure character names are used consistently across all books',
        entityTypes: ['character'],
        rule: JSON.stringify({
          type: 'name_consistency',
          fields: ['name', 'aliases'],
          tolerance: 0.95
        }),
        severity: 'error',
        active: true
      },
      {
        name: 'Timeline Coherence',
        description: 'Check for timeline conflicts across series',
        entityTypes: ['character', 'location', 'organization'],
        rule: JSON.stringify({
          type: 'timeline_validation',
          checkBirthDeath: true,
          allowParallelTimelines: false
        }),
        severity: 'warning',
        active: true
      },
      {
        name: 'Relationship Consistency',
        description: 'Validate relationship consistency across books',
        entityTypes: ['character', 'organization'],
        rule: JSON.stringify({
          type: 'relationship_validation',
          bidirectionalCheck: true,
          conflictDetection: true
        }),
        severity: 'warning',
        active: true
      }
    ];

    for (const rule of defaultRules) {
      await api.post(`${this.baseUrl}/${universeId}/consistency-rules`, rule);
    }
  }

  async getConsistencyRules(universeId: string): Promise<ConsistencyRule[]> {
    const response = await api.get(`${this.baseUrl}/${universeId}/consistency-rules`);
    return response.data;
  }

  async updateConsistencyRule(
    ruleId: string,
    updates: Partial<ConsistencyRule>
  ): Promise<ConsistencyRule> {
    const response = await api.put(`${this.baseUrl}/consistency-rules/${ruleId}`, updates);
    return response.data;
  }

  async validateUniverseConsistency(universeId: string): Promise<{
    score: number;
    issues: any[];
    recommendations: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/${universeId}/validate`);
    return response.data;
  }

  // TIMELINE MANAGEMENT

  async createUniverseTimeline(universeId: string, timeframe: string): Promise<Timeline> {
    const response = await api.post(`${this.baseUrl}/${universeId}/timeline`, {
      name: 'Universal Timeline',
      type: 'universe',
      scale: 'years',
      description: `Timeline for the entire ${timeframe} universe`
    });
    return response.data;
  }

  async getUniverseTimeline(universeId: string): Promise<Timeline | null> {
    try {
      const response = await api.get(`${this.baseUrl}/${universeId}/timeline`);
      return response.data;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async synchronizeTimelines(universeId: string): Promise<{
    conflicts: any[];
    merged: number;
    suggestions: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/${universeId}/sync-timelines`);
    return response.data;
  }

  // UNIVERSE BROWSING AND DISCOVERY

  async browseUniverses(filters: Partial<UniverseBrowserFilters> = {}): Promise<UniverseBrowser> {
    const response = await api.get(`${this.baseUrl}/browse`, { params: filters });
    return response.data;
  }

  async searchUniverses(
    query: string,
    filters: Partial<UniverseBrowserFilters> = {}
  ): Promise<UniverseListItem[]> {
    const response = await api.get(`${this.baseUrl}/search`, {
      params: { query, ...filters }
    });
    return response.data;
  }

  async getPublicUniverses(
    limit = 20,
    sortBy: 'popularity' | 'recent' | 'name' = 'popularity'
  ): Promise<UniverseListItem[]> {
    const response = await api.get(`${this.baseUrl}/public`, {
      params: { limit, sortBy }
    });
    return response.data;
  }

  async getFeaturedUniverses(): Promise<UniverseListItem[]> {
    const response = await api.get(`${this.baseUrl}/featured`);
    return response.data;
  }

  // ANALYTICS AND INSIGHTS

  async getUniverseAnalytics(
    universeId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<UniverseAnalytics> {
    const response = await api.get(`${this.baseUrl}/${universeId}/analytics`, {
      params: { timeframe }
    });
    return response.data;
  }

  async getEntityPopularityTrends(
    universeId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<EntityPopularity[]> {
    const response = await api.get(`${this.baseUrl}/${universeId}/entity-trends`, {
      params: { period }
    });
    return response.data;
  }

  async getUniverseHealthScore(universeId: string): Promise<{
    overall: number;
    consistency: number;
    completeness: number;
    collaboration: number;
    activity: number;
    suggestions: string[];
  }> {
    const response = await api.get(`${this.baseUrl}/${universeId}/health`);
    return response.data;
  }

  // MIGRATION AND IMPORT/EXPORT

  async migrateEntitiesFromProject(
    projectId: string,
    plan: EntityMigrationPlan
  ): Promise<MigrationResult> {
    const response = await api.post(`${this.baseUrl}/migrate`, {
      projectId,
      ...plan
    });
    
    const result = response.data;
    this.emitEvent('entities_migrated', { projectId, result });
    return result;
  }

  async exportUniverse(
    universeId: string,
    format: 'json' | 'yaml' | 'markdown' | 'pdf',
    options: {
      includeSeries?: boolean;
      includeEntities?: boolean;
      includeTimeline?: boolean;
      includeAnalytics?: boolean;
    } = {}
  ): Promise<Blob> {
    const response = await api.post(`${this.baseUrl}/${universeId}/export`, {
      format,
      options
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  async importUniverse(
    file: File,
    importOptions: {
      createNew?: boolean;
      mergeWith?: string; // universe ID
      handleConflicts?: 'skip' | 'rename' | 'merge';
    } = {}
  ): Promise<{
    universeId: string;
    imported: number;
    conflicts: any[];
    warnings: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(importOptions));

    const response = await api.post(`${this.baseUrl}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // TEMPLATES AND PRESETS

  async getUniverseTemplates(): Promise<any[]> {
    const response = await api.get(`${this.baseUrl}/templates`);
    return response.data;
  }

  async createUniverseFromTemplate(
    templateId: string,
    customData: Partial<UniverseCreationData>
  ): Promise<Universe> {
    const response = await api.post(`${this.baseUrl}/templates/${templateId}/create`, customData);
    return response.data;
  }

  async saveUniverseAsTemplate(
    universeId: string,
    templateData: {
      name: string;
      description: string;
      isPublic: boolean;
      category: string;
    }
  ): Promise<void> {
    await api.post(`${this.baseUrl}/${universeId}/save-template`, templateData);
  }

  // NOTIFICATION AND EVENT SYSTEM

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

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in universe event listener for ${eventType}:`, error);
      }
    });
  }

  // UTILITY METHODS

  async checkUserPermissions(
    universeId: string,
    permission: UniversePermission
  ): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseUrl}/${universeId}/permissions/${permission}`);
      return response.data.hasPermission;
    } catch (error) {
      return false;
    }
  }

  async getRecommendedConnections(universeId: string): Promise<{
    suggestedCollaborators: any[];
    relatedUniverses: UniverseListItem[];
    inspirationSources: any[];
  }> {
    const response = await api.get(`${this.baseUrl}/${universeId}/recommendations`);
    return response.data;
  }

  async generateUniverseReport(
    universeId: string,
    reportType: 'consistency' | 'analytics' | 'collaboration' | 'full'
  ): Promise<{
    reportUrl: string;
    generatedAt: string;
    expiresAt: string;
  }> {
    const response = await api.post(`${this.baseUrl}/${universeId}/reports/${reportType}`);
    return response.data;
  }

  // CLEANUP

  dispose(): void {
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const universeManagementService = new UniverseManagementService();
export default universeManagementService;