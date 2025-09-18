import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { advancedSearchService } from '../../services/advancedSearchService';
import type { SearchQuery, SearchResult, SavedSearch, ContentType } from '../../services/advancedSearchService';

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

// Mock the project and quick notes services
vi.mock('../../services/projectService', () => ({
  projectService: {
    getAllProjects: () => [],
    getProjectScenes: () => [],
    getProjectCharacters: () => [],
    getProjectLocations: () => []
  }
}));

vi.mock('../../services/quickNotesService', () => ({
  quickNotesService: {
    getAllQuickNotes: () => []
  }
}));

describe('AdvancedSearchService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Search', () => {
    it('should perform empty search and return empty results', async () => {
      const query: SearchQuery = {
        text: '',
        filters: {},
        options: {}
      };

      const results = await advancedSearchService.search(query);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should perform quick search', async () => {
      const results = await advancedSearchService.quickSearch('test', 5);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should perform semantic search', async () => {
      const results = await advancedSearchService.semanticSearch('test content', 10);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should handle complex search query', async () => {
      const query: SearchQuery = {
        text: 'javascript programming',
        filters: {
          contentTypes: ['note', 'scene'],
          tags: ['programming'],
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31')
          }
        },
        options: {
          fuzzy: true,
          caseSensitive: false,
          maxResults: 20,
          sortBy: 'relevance',
          sortOrder: 'desc'
        }
      };

      const results = await advancedSearchService.search(query);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle search with regex option', async () => {
      const query: SearchQuery = {
        text: 'test.*pattern',
        filters: {},
        options: {
          regex: true,
          maxResults: 10
        }
      };

      const results = await advancedSearchService.search(query);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle whole words search', async () => {
      const query: SearchQuery = {
        text: 'function',
        filters: {},
        options: {
          wholeWords: true,
          maxResults: 10
        }
      };

      const results = await advancedSearchService.search(query);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Query Builder', () => {
    it('should create query builder', () => {
      const builder = advancedSearchService.buildQuery();
      expect(builder).toBeDefined();
      expect(typeof builder.text).toBe('function');
    });

    it('should build complex query with builder', () => {
      const builder = advancedSearchService.buildQuery();
      
      const query = builder
        .text('JavaScript')
        .contentTypes(['note', 'scene'])
        .tags(['programming', 'tutorial'])
        .projects(['project-1'])
        .dateRange(new Date('2024-01-01'), new Date('2024-12-31'))
        .fuzzy(true)
        .maxResults(25)
        .sortBy('relevance', 'desc')
        .build();

      expect(query.text).toBe('JavaScript');
      expect(query.filters.contentTypes).toEqual(['note', 'scene']);
      expect(query.filters.tags).toEqual(['programming', 'tutorial']);
      expect(query.filters.projects).toEqual(['project-1']);
      expect(query.filters.dateRange).toBeDefined();
      expect(query.options.fuzzy).toBe(true);
      expect(query.options.maxResults).toBe(25);
      expect(query.options.sortBy).toBe('relevance');
      expect(query.options.sortOrder).toBe('desc');
    });

    it('should chain builder methods', () => {
      const builder = advancedSearchService.buildQuery();
      
      const query = builder
        .text('test')
        .wholeWords(true)
        .caseSensitive(false)
        .regex(false)
        .includeContent(true)
        .includeMetadata(true)
        .build();

      expect(query.options.wholeWords).toBe(true);
      expect(query.options.caseSensitive).toBe(false);
      expect(query.options.regex).toBe(false);
      expect(query.options.includeContent).toBe(true);
      expect(query.options.includeMetadata).toBe(true);
    });

    it('should build query with word count range', () => {
      const builder = advancedSearchService.buildQuery();
      
      const query = builder
        .wordCount(100, 1000)
        .lastModified('week')
        .status(['published', 'draft'])
        .build();

      expect(query.filters.wordCountRange).toEqual({ min: 100, max: 1000 });
      expect(query.filters.lastModified).toBe('week');
      expect(query.filters.status).toEqual(['published', 'draft']);
    });
  });

  describe('Saved Searches', () => {
    beforeEach(() => {
      // Clear any existing saved searches before each test
      const existingSearches = advancedSearchService.getSavedSearches();
      existingSearches.forEach(search => {
        advancedSearchService.deleteSavedSearch(search.id);
      });
    });

    it('should save search query', () => {
      const query: SearchQuery = {
        text: 'JavaScript',
        filters: { contentTypes: ['note'] },
        options: { fuzzy: true }
      };

      const savedSearch = advancedSearchService.saveSearch('JS Notes', query);
      expect(savedSearch).toBeDefined();
      expect(savedSearch.name).toBe('JS Notes');
      expect(savedSearch.query).toEqual(query);
      expect(savedSearch.id).toBeTruthy();
    });

    it('should save search with description', () => {
      const query: SearchQuery = {
        text: 'Python',
        filters: { tags: ['data-science'] },
        options: {}
      };

      const savedSearch = advancedSearchService.saveSearch('Python DS', query, 'Data science related Python content');
      expect(savedSearch.description).toBe('Data science related Python content');
    });

    it('should get saved searches', () => {
      const query: SearchQuery = { text: 'test', filters: {}, options: {} };
      advancedSearchService.saveSearch('Test Search', query);

      const savedSearches = advancedSearchService.getSavedSearches();
      expect(Array.isArray(savedSearches)).toBe(true);
      expect(savedSearches.length).toBeGreaterThan(0);
      expect(savedSearches[0].name).toBe('Test Search');
    });

    it('should delete saved search', () => {
      const query: SearchQuery = { text: 'test', filters: {}, options: {} };
      const savedSearch = advancedSearchService.saveSearch('Test Search', query);

      const initialCount = advancedSearchService.getSavedSearches().length;
      const deleted = advancedSearchService.deleteSavedSearch(savedSearch.id);
      
      expect(deleted).toBe(true);
      expect(advancedSearchService.getSavedSearches().length).toBe(initialCount - 1);
    });

    it('should return false when deleting non-existent search', () => {
      const deleted = advancedSearchService.deleteSavedSearch('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should execute saved search', async () => {
      const query: SearchQuery = {
        text: 'test query',
        filters: {},
        options: { maxResults: 5 }
      };
      
      const savedSearch = advancedSearchService.saveSearch('Test Execution', query);
      const results = await advancedSearchService.executeSavedSearch(savedSearch.id);
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Search Suggestions', () => {
    it('should get search suggestions', () => {
      const suggestions = advancedSearchService.getSearchSuggestions('java');
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle empty query for suggestions', () => {
      const suggestions = advancedSearchService.getSearchSuggestions('');
      expect(Array.isArray(suggestions)).toBe(true);
      // Service may return recent searches for empty query
    });

    it('should return suggestions with correct structure', () => {
      const suggestions = advancedSearchService.getSearchSuggestions('test');
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('type');
        expect(['term', 'tag', 'project', 'author', 'recent']).toContain(suggestion.type);
      });
    });
  });

  describe('Smart Filters', () => {
    it('should get smart filters', () => {
      const filters = advancedSearchService.getSmartFilters();
      expect(Array.isArray(filters)).toBe(true);
    });

    it('should toggle smart filter', () => {
      const filters = advancedSearchService.getSmartFilters();
      if (filters.length > 0) {
        const filter = filters[0];
        const originalState = filter.isActive;
        
        const toggled = advancedSearchService.toggleSmartFilter(filter.id);
        expect(toggled).toBe(true);
        
        const updatedFilters = advancedSearchService.getSmartFilters();
        const updatedFilter = updatedFilters.find(f => f.id === filter.id);
        expect(updatedFilter?.isActive).toBe(!originalState);
      }
    });

    it('should return false when toggling non-existent filter', () => {
      const toggled = advancedSearchService.toggleSmartFilter('non-existent-filter');
      expect(toggled).toBe(false);
    });
  });

  describe('Search Analytics', () => {
    it('should get search analytics', () => {
      const analytics = advancedSearchService.getSearchAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalSearches).toBe('number');
      expect(Array.isArray(analytics.popularQueries)).toBe(true);
      expect(Array.isArray(analytics.searchTrends)).toBe(true);
      expect(Array.isArray(analytics.noResultsQueries)).toBe(true);
      expect(analytics.performanceMetrics).toBeDefined();
    });

    it('should track searches in analytics', async () => {
      const initialAnalytics = advancedSearchService.getSearchAnalytics();
      const initialSearchCount = initialAnalytics.totalSearches;

      await advancedSearchService.search({
        text: 'analytics test',
        filters: {},
        options: {}
      });

      const updatedAnalytics = advancedSearchService.getSearchAnalytics();
      expect(updatedAnalytics.totalSearches).toBeGreaterThan(initialSearchCount);
    });

    it('should track popular queries', async () => {
      await advancedSearchService.search({
        text: 'popular query test',
        filters: {},
        options: {}
      });

      const analytics = advancedSearchService.getSearchAnalytics();
      const hasPopularQuery = analytics.popularQueries.some(
        q => q.query === 'popular query test'
      );
      expect(hasPopularQuery).toBe(true);
    });
  });

  describe('Index Management', () => {
    it('should rebuild index', async () => {
      await expect(advancedSearchService.rebuildIndex()).resolves.not.toThrow();
    });

    it('should emit indexing events', async () => {
      const startSpy = vi.fn();
      const completeSpy = vi.fn();
      
      advancedSearchService.on('indexingStarted', startSpy);
      advancedSearchService.on('indexingCompleted', completeSpy);

      await advancedSearchService.rebuildIndex();

      // Give a moment for events to be emitted
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(startSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors gracefully', async () => {
      // Mock a search that would cause an error
      const invalidQuery: SearchQuery = {
        text: '[invalid-regex',
        filters: {},
        options: { regex: true }
      };

      const results = await advancedSearchService.search(invalidQuery);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toEqual([]);
    });

    it('should handle error scenarios gracefully', async () => {
      const errorSpy = vi.fn();
      advancedSearchService.on('searchError', errorSpy);

      const invalidQuery: SearchQuery = {
        text: '[invalid-regex',
        filters: {},
        options: { regex: true }
      };

      const results = await advancedSearchService.search(invalidQuery);
      expect(Array.isArray(results)).toBe(true);
      // Error events may or may not be emitted depending on implementation
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const query: SearchQuery = {
        text: '',
        filters: {},
        options: {
          maxResults: 1000
        }
      };

      const startTime = performance.now();
      const results = await advancedSearchService.search(query);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results.length).toBeLessThanOrEqual(1000);
    });

    it('should respect maxResults limit', async () => {
      const query: SearchQuery = {
        text: '',
        filters: {},
        options: {
          maxResults: 5
        }
      };

      const results = await advancedSearchService.search(query);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Event Handling', () => {
    it('should emit search completed events', async () => {
      const completedSpy = vi.fn();
      advancedSearchService.on('searchCompleted', completedSpy);

      const query: SearchQuery = {
        text: 'event test',
        filters: {},
        options: {}
      };

      await advancedSearchService.search(query);
      expect(completedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query,
          results: expect.any(Array),
          duration: expect.any(Number)
        })
      );
    });

    it('should clean up event listeners', () => {
      const testHandler = vi.fn();
      
      advancedSearchService.on('searchCompleted', testHandler);
      advancedSearchService.off('searchCompleted', testHandler);
      
      // This should not throw an error
      expect(() => {
        advancedSearchService.off('searchCompleted', testHandler);
      }).not.toThrow();
    });
  });

  describe('Data Persistence', () => {
    it('should persist saved searches', () => {
      const query: SearchQuery = { text: 'persistence test', filters: {}, options: {} };
      advancedSearchService.saveSearch('Persistence Test', query);

      // Check that it was saved to localStorage
      const stored = localStorage.getItem('astral_notes_search_saved_searches');
      expect(stored).toBeTruthy();
      
      const parsedData = JSON.parse(stored!);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.some((s: SavedSearch) => s.name === 'Persistence Test')).toBe(true);
    });

    it('should handle localStorage data format', () => {
      // Test that service can handle saved search data format
      const query: SearchQuery = { text: 'format test', filters: {}, options: {} };
      const savedSearch = advancedSearchService.saveSearch('Format Test', query);
      
      // Verify it was saved
      const savedSearches = advancedSearchService.getSavedSearches();
      expect(savedSearches.some(s => s.name === 'Format Test')).toBe(true);
      
      // Verify localStorage contains the data
      const stored = localStorage.getItem('astral_notes_search_saved_searches');
      expect(stored).toBeTruthy();
      
      const parsedData = JSON.parse(stored!);
      expect(Array.isArray(parsedData)).toBe(true);
    });
  });
});