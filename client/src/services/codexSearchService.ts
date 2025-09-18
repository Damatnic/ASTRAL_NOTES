/**
 * Codex Search Service
 * Advanced search and filtering capabilities for the Codex system
 */

import { api } from './api';
import { type CodexEntity, type EntityType, type EntityRelationship, type TextReference } from './codexService';

// Search configuration and filters
export interface SearchFilters {
  // Basic filters
  query?: string;
  entityTypes?: EntityType[];
  tags?: string[];
  categories?: string[];
  importance?: {
    min: number;
    max: number;
  };
  
  // Advanced filters
  projectId?: string;
  isUniversal?: boolean;
  hasAvatar?: boolean;
  hasReferences?: boolean;
  hasRelationships?: boolean;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  
  // Relationship filters
  relatedTo?: string; // Entity ID
  relationshipType?: string;
  relationshipStrength?: {
    min: number;
    max: number;
  };
  
  // Text content filters
  contentContains?: string;
  descriptionContains?: string;
  notesContain?: string;
  
  // Sorting and pagination
  sortBy?: SearchSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type SearchSortField = 
  | 'name' 
  | 'type' 
  | 'importance' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'relevance'
  | 'connections'
  | 'references';

export interface SearchResult {
  entity: CodexEntity;
  score: number;
  matches: SearchMatch[];
  snippet: string;
  highlights: string[];
}

export interface SearchMatch {
  field: string;
  value: string;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'semantic';
  score: number;
  position?: {
    start: number;
    end: number;
  };
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets: SearchFacets;
  suggestions: string[];
  queryTime: number;
}

export interface SearchFacets {
  types: Array<{ type: EntityType; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
  importance: Array<{ level: number; count: number }>;
  projects: Array<{ projectId: string; projectName: string; count: number }>;
}

// Saved search functionality
export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilters;
  isPublic: boolean;
  userId: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed: Date;
}

// Search analytics
export interface SearchAnalytics {
  popularQueries: Array<{ query: string; count: number }>;
  popularFilters: Array<{ filter: string; value: string; count: number }>;
  averageResponseTime: number;
  totalSearches: number;
  uniqueUsers: number;
  searchTrends: Array<{ date: string; count: number }>;
}

// Auto-complete suggestions
export interface AutocompleteSuggestion {
  text: string;
  type: 'entity' | 'tag' | 'category' | 'query';
  entityType?: EntityType;
  count?: number;
  recent?: boolean;
}

class CodexSearchService {
  private recentQueries: string[] = [];
  private searchHistory: Array<{ query: string; filters: SearchFilters; timestamp: Date }> = [];
  private maxRecentQueries = 10;
  private maxSearchHistory = 100;

  // MAIN SEARCH METHODS
  async search(filters: SearchFilters): Promise<SearchResults> {
    const startTime = Date.now();
    
    // Add to search history
    this.addToSearchHistory(filters);
    
    try {
      const response = await api.post('/api/codex/search', filters);
      const results: SearchResults = {
        ...response,
        queryTime: Date.now() - startTime
      };
      
      // Update recent queries if there's a text query
      if (filters.query) {
        this.addToRecentQueries(filters.query);
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async searchEntities(query: string, options?: Partial<SearchFilters>): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      query,
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: 50,
      ...options
    };
    
    const results = await this.search(filters);
    return results.results;
  }

  async advancedSearch(filters: SearchFilters): Promise<SearchResults> {
    return this.search(filters);
  }

  // FUZZY AND SEMANTIC SEARCH
  async fuzzySearch(query: string, threshold: number = 0.7, projectId?: string): Promise<SearchResult[]> {
    const response = await api.post('/api/codex/search/fuzzy', {
      query,
      threshold,
      projectId
    });
    return response;
  }

  async semanticSearch(query: string, projectId?: string, limit: number = 20): Promise<SearchResult[]> {
    const response = await api.post('/api/codex/search/semantic', {
      query,
      projectId,
      limit
    });
    return response;
  }

  async similarEntities(entityId: string, limit: number = 10): Promise<SearchResult[]> {
    const response = await api.get(`/api/codex/search/similar/${entityId}`, {
      params: { limit }
    });
    return response;
  }

  // AUTOCOMPLETE AND SUGGESTIONS
  async getAutocompleteSuggestions(query: string, types?: string[]): Promise<AutocompleteSuggestion[]> {
    const response = await api.get('/api/codex/search/autocomplete', {
      params: { query, types: types?.join(',') }
    });
    
    // Merge with local recent queries
    const recentSuggestions: AutocompleteSuggestion[] = this.recentQueries
      .filter(q => q.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(q => ({ text: q, type: 'query' as const, recent: true }));
    
    return [...recentSuggestions, ...response].slice(0, 20);
  }

  async getQuerySuggestions(partial: string): Promise<string[]> {
    const response = await api.get('/api/codex/search/suggestions', {
      params: { query: partial }
    });
    return response;
  }

  async getPopularTags(projectId?: string, limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    const response = await api.get('/api/codex/search/tags/popular', {
      params: { projectId, limit }
    });
    return response;
  }

  async getPopularCategories(projectId?: string, limit: number = 20): Promise<Array<{ category: string; count: number }>> {
    const response = await api.get('/api/codex/search/categories/popular', {
      params: { projectId, limit }
    });
    return response;
  }

  // SAVED SEARCHES
  async saveSearch(name: string, filters: SearchFilters, description?: string, isPublic: boolean = false): Promise<SavedSearch> {
    const response = await api.post('/api/codex/search/saved', {
      name,
      description,
      filters,
      isPublic
    });
    return response;
  }

  async getSavedSearches(projectId?: string): Promise<SavedSearch[]> {
    const response = await api.get('/api/codex/search/saved', {
      params: { projectId }
    });
    return response;
  }

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<SavedSearch> {
    const response = await api.put(`/api/codex/search/saved/${id}`, updates);
    return response;
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await api.delete(`/api/codex/search/saved/${id}`);
  }

  async executeSavedSearch(id: string): Promise<SearchResults> {
    const savedSearch = await api.get(`/api/codex/search/saved/${id}`);
    
    // Update usage statistics
    await api.put(`/api/codex/search/saved/${id}/use`);
    
    return this.search(savedSearch.filters);
  }

  // FACETED SEARCH
  async getFacets(filters: Partial<SearchFilters> = {}): Promise<SearchFacets> {
    const response = await api.post('/api/codex/search/facets', filters);
    return response;
  }

  async searchByFacet(facetType: string, facetValue: string, additionalFilters?: Partial<SearchFilters>): Promise<SearchResults> {
    const filters: SearchFilters = {
      ...additionalFilters
    };
    
    switch (facetType) {
      case 'type':
        filters.entityTypes = [facetValue as EntityType];
        break;
      case 'tag':
        filters.tags = [facetValue];
        break;
      case 'category':
        filters.categories = [facetValue];
        break;
      case 'importance':
        const importance = parseInt(facetValue);
        filters.importance = { min: importance, max: importance };
        break;
    }
    
    return this.search(filters);
  }

  // RELATIONSHIP-BASED SEARCH
  async searchRelatedEntities(entityId: string, relationshipTypes?: string[], depth: number = 1): Promise<SearchResult[]> {
    const response = await api.get(`/api/codex/search/related/${entityId}`, {
      params: { 
        relationshipTypes: relationshipTypes?.join(','), 
        depth 
      }
    });
    return response;
  }

  async searchByRelationship(fromEntityId: string, relationshipType: string): Promise<SearchResult[]> {
    const response = await api.get(`/api/codex/search/relationship/${fromEntityId}/${relationshipType}`);
    return response;
  }

  async findEntitiesWithoutRelationships(projectId?: string): Promise<CodexEntity[]> {
    const response = await api.get('/api/codex/search/orphaned', {
      params: { projectId }
    });
    return response;
  }

  // TEXT REFERENCE SEARCH
  async searchByTextReferences(query: string, sourceType?: string): Promise<Array<{
    entity: CodexEntity;
    references: TextReference[];
    totalReferences: number;
  }>> {
    const response = await api.get('/api/codex/search/references', {
      params: { query, sourceType }
    });
    return response;
  }

  async findEntitiesInDocument(sourceType: string, sourceId: string): Promise<Array<{
    entity: CodexEntity;
    references: TextReference[];
  }>> {
    const response = await api.get(`/api/codex/search/document/${sourceType}/${sourceId}`);
    return response;
  }

  // ANALYTICS AND INSIGHTS
  async getSearchAnalytics(projectId?: string, period: 'day' | 'week' | 'month' = 'week'): Promise<SearchAnalytics> {
    const response = await api.get('/api/codex/search/analytics', {
      params: { projectId, period }
    });
    return response;
  }

  async getEntityAccessPattern(entityId: string): Promise<{
    viewCount: number;
    searchCount: number;
    recentSearches: string[];
    relatedQueries: string[];
  }> {
    const response = await api.get(`/api/codex/search/analytics/entity/${entityId}`);
    return response;
  }

  // BULK OPERATIONS
  async bulkSearch(queries: string[], options?: Partial<SearchFilters>): Promise<Array<{
    query: string;
    results: SearchResult[];
  }>> {
    const response = await api.post('/api/codex/search/bulk', {
      queries,
      options
    });
    return response;
  }

  async exportSearchResults(filters: SearchFilters, format: 'json' | 'csv' | 'excel' = 'json'): Promise<Blob> {
    const response = await api.post('/api/codex/search/export', filters, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  }

  // LOCAL SEARCH HISTORY MANAGEMENT
  private addToRecentQueries(query: string): void {
    // Remove if already exists
    const index = this.recentQueries.indexOf(query);
    if (index > -1) {
      this.recentQueries.splice(index, 1);
    }
    
    // Add to beginning
    this.recentQueries.unshift(query);
    
    // Limit size
    if (this.recentQueries.length > this.maxRecentQueries) {
      this.recentQueries = this.recentQueries.slice(0, this.maxRecentQueries);
    }
    
    // Save to localStorage
    this.saveToLocalStorage();
  }

  private addToSearchHistory(filters: SearchFilters): void {
    this.searchHistory.unshift({
      query: filters.query || '',
      filters,
      timestamp: new Date()
    });
    
    // Limit size
    if (this.searchHistory.length > this.maxSearchHistory) {
      this.searchHistory = this.searchHistory.slice(0, this.maxSearchHistory);
    }
    
    // Save to localStorage
    this.saveToLocalStorage();
  }

  getRecentQueries(): string[] {
    return [...this.recentQueries];
  }

  getSearchHistory(): Array<{ query: string; filters: SearchFilters; timestamp: Date }> {
    return [...this.searchHistory];
  }

  clearRecentQueries(): void {
    this.recentQueries = [];
    this.saveToLocalStorage();
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveToLocalStorage();
  }

  // LOCAL STORAGE MANAGEMENT
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('codex-recent-queries', JSON.stringify(this.recentQueries));
      localStorage.setItem('codex-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search data to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const recentQueries = localStorage.getItem('codex-recent-queries');
      if (recentQueries) {
        this.recentQueries = JSON.parse(recentQueries);
      }
      
      const searchHistory = localStorage.getItem('codex-search-history');
      if (searchHistory) {
        this.searchHistory = JSON.parse(searchHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load search data from localStorage:', error);
    }
  }

  // UTILITY METHODS
  buildSearchFilters(options: {
    query?: string;
    types?: EntityType[];
    tags?: string[];
    importance?: [number, number];
    projectId?: string;
    sortBy?: SearchSortField;
    limit?: number;
  }): SearchFilters {
    const filters: SearchFilters = {};
    
    if (options.query) filters.query = options.query;
    if (options.types?.length) filters.entityTypes = options.types;
    if (options.tags?.length) filters.tags = options.tags;
    if (options.importance) {
      filters.importance = { min: options.importance[0], max: options.importance[1] };
    }
    if (options.projectId) filters.projectId = options.projectId;
    if (options.sortBy) filters.sortBy = options.sortBy;
    if (options.limit) filters.limit = options.limit;
    
    return filters;
  }

  formatSearchResults(results: SearchResult[]): Array<{
    id: string;
    name: string;
    type: EntityType;
    description: string;
    score: number;
    snippet: string;
    highlights: string[];
  }> {
    return results.map(result => ({
      id: result.entity.id,
      name: result.entity.name,
      type: result.entity.type,
      description: result.entity.description,
      score: result.score,
      snippet: result.snippet,
      highlights: result.highlights
    }));
  }

  // INITIALIZATION
  constructor() {
    this.loadFromLocalStorage();
  }
}

// Export singleton instance
export const codexSearchService = new CodexSearchService();
export default codexSearchService;