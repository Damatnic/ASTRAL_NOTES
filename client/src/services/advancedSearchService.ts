/**
 * Advanced Search & Discovery Service
 * Powerful content search, filtering, and discovery across all writing projects
 */

import { BrowserEventEmitter } from '@/utils/BrowserEventEmitter';
import { projectService } from './projectService';
import { quickNotesService } from './quickNotesService';

export interface SearchQuery {
  text?: string;
  filters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
    projects?: string[];
    authors?: string[];
    contentTypes?: ContentType[];
    status?: string[];
    wordCountRange?: {
      min: number;
      max: number;
    };
    lastModified?: 'today' | 'week' | 'month' | 'year';
  };
  options: {
    fuzzy?: boolean;
    caseSensitive?: boolean;
    wholeWords?: boolean;
    regex?: boolean;
    includeContent?: boolean;
    includeMetadata?: boolean;
    maxResults?: number;
    sortBy?: SortField;
    sortOrder?: 'asc' | 'desc';
  };
}

export type ContentType = 'project' | 'note' | 'scene' | 'character' | 'location' | 'quicknote' | 'timeline';
export type SortField = 'relevance' | 'date' | 'title' | 'wordCount' | 'lastModified';

export interface SearchResult {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  excerpt: string;
  highlights: TextHighlight[];
  metadata: {
    project?: {
      id: string;
      title: string;
    };
    tags: string[];
    author?: string;
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
    status?: string;
  };
  relevanceScore: number;
  path: string; // Navigation path
}

export interface TextHighlight {
  text: string;
  start: number;
  end: number;
  context: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: SearchQuery;
  isGlobal: boolean;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'term' | 'tag' | 'project' | 'author' | 'recent';
  count?: number;
  category?: string;
}

export interface ContentIndex {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  vector?: number[]; // For semantic search
  lastIndexed: Date;
}

export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: Date; count: number }>;
  averageResultsClicked: number;
  noResultsQueries: string[];
  performanceMetrics: {
    averageSearchTime: number;
    indexSize: number;
    lastIndexUpdate: Date;
  };
}

export interface SmartFilter {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'temporal' | 'project' | 'quality';
  filter: (item: ContentIndex) => boolean;
  isActive: boolean;
}

class AdvancedSearchService extends BrowserEventEmitter {
  private contentIndex: Map<string, ContentIndex> = new Map();
  private savedSearches: SavedSearch[] = [];
  private searchHistory: Array<{ query: SearchQuery; timestamp: Date; resultCount: number }> = [];
  private searchAnalytics: SearchAnalytics;
  private smartFilters: SmartFilter[] = [];
  private storageKey = 'astral_notes_search';
  private indexingInProgress = false;

  constructor() {
    super();
    this.initializeAnalytics();
    this.initializeSmartFilters();
    this.loadData();
    this.startIndexing();
  }

  // Core Search Functionality
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const startTime = performance.now();
    
    try {
      // Record search
      this.recordSearch(query);
      
      // Get all indexed content
      const allContent = Array.from(this.contentIndex.values());
      
      // Apply filters
      let filteredContent = this.applyFilters(allContent, query.filters);
      
      // Apply smart filters
      filteredContent = this.applySmartFilters(filteredContent);
      
      // Perform text search if query provided
      if (query.text && query.text.trim()) {
        filteredContent = this.performTextSearch(filteredContent, query.text, query.options);
      }
      
      // Calculate relevance scores
      const scoredResults = this.calculateRelevanceScores(filteredContent, query);
      
      // Sort results
      const sortedResults = this.sortResults(scoredResults, query.options.sortBy || 'relevance', query.options.sortOrder || 'desc');
      
      // Limit results
      const limitedResults = sortedResults.slice(0, query.options.maxResults || 50);
      
      // Convert to search results with highlights
      const searchResults = await this.convertToSearchResults(limitedResults, query.text);
      
      // Update analytics
      const endTime = performance.now();
      this.updateSearchAnalytics(query, searchResults.length, endTime - startTime);
      
      this.emit('searchCompleted', { query, results: searchResults, duration: endTime - startTime });
      
      return searchResults;
    } catch (error) {
      console.error('Search error:', error);
      this.emit('searchError', { query, error });
      return [];
    }
  }

  // Quick search for simple text queries
  async quickSearch(text: string, maxResults: number = 10): Promise<SearchResult[]> {
    const query: SearchQuery = {
      text,
      filters: {},
      options: {
        maxResults,
        includeContent: true,
        includeMetadata: true,
        sortBy: 'relevance'
      }
    };
    
    return this.search(query);
  }

  // Semantic search using content vectors (placeholder for AI integration)
  async semanticSearch(text: string, maxResults: number = 10): Promise<SearchResult[]> {
    // This would integrate with AI services for semantic search
    // For now, fall back to regular search
    return this.quickSearch(text, maxResults);
  }

  // Advanced query builder
  buildQuery(): QueryBuilder {
    return new QueryBuilder();
  }

  // Content Indexing
  async rebuildIndex(): Promise<void> {
    if (this.indexingInProgress) return;
    
    this.indexingInProgress = true;
    this.emit('indexingStarted');
    
    try {
      this.contentIndex.clear();
      
      // Index projects
      await this.indexProjects();
      
      // Index quick notes
      await this.indexQuickNotes();
      
      // Index other content types as available
      await this.indexOtherContent();
      
      this.saveIndex();
      this.emit('indexingCompleted', { itemCount: this.contentIndex.size });
    } catch (error) {
      console.error('Indexing error:', error);
      this.emit('indexingError', error);
    } finally {
      this.indexingInProgress = false;
    }
  }

  private async indexProjects(): Promise<void> {
    const projects = projectService.getAllProjects();
    
    for (const project of projects) {
      // Index project itself
      this.addToIndex({
        id: `project-${project.id}`,
        type: 'project',
        title: project.title,
        content: `${project.title} ${project.description || ''} ${project.tags.join(' ')}`,
        tags: project.tags,
        metadata: {
          status: project.status,
          wordCount: project.wordCount,
          genre: project.genre,
          createdAt: project.createdAt,
          updatedAt: project.lastEditedAt
        },
        lastIndexed: new Date()
      });
      
      // Index project scenes/chapters
      const scenes = projectService.getProjectScenes(project.id);
      scenes.forEach(scene => {
        this.addToIndex({
          id: `scene-${scene.id}`,
          type: 'scene',
          title: scene.title,
          content: `${scene.title} ${scene.content || ''} ${scene.summary || ''}`,
          tags: scene.tags || [],
          metadata: {
            project: { id: project.id, title: project.title },
            wordCount: scene.wordCount || 0,
            order: scene.order,
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt
          },
          lastIndexed: new Date()
        });
      });
      
      // Index project characters
      const characters = projectService.getProjectCharacters(project.id);
      characters.forEach(character => {
        this.addToIndex({
          id: `character-${character.id}`,
          type: 'character',
          title: character.name,
          content: `${character.name} ${character.description || ''} ${character.personality || ''} ${character.background || ''}`,
          tags: character.tags || [],
          metadata: {
            project: { id: project.id, title: project.title },
            age: character.age,
            role: character.role,
            createdAt: character.createdAt,
            updatedAt: character.updatedAt
          },
          lastIndexed: new Date()
        });
      });
      
      // Index project locations
      const locations = projectService.getProjectLocations(project.id);
      locations.forEach(location => {
        this.addToIndex({
          id: `location-${location.id}`,
          type: 'location',
          title: location.name,
          content: `${location.name} ${location.description || ''} ${location.history || ''}`,
          tags: location.tags || [],
          metadata: {
            project: { id: project.id, title: project.title },
            type: location.type,
            createdAt: location.createdAt,
            updatedAt: location.updatedAt
          },
          lastIndexed: new Date()
        });
      });
    }
  }

  private async indexQuickNotes(): Promise<void> {
    const quickNotes = quickNotesService.getAllQuickNotes();
    
    quickNotes.forEach(note => {
      this.addToIndex({
        id: `quicknote-${note.id}`,
        type: 'quicknote',
        title: note.title,
        content: `${note.title} ${note.content}`,
        tags: note.tags,
        metadata: {
          project: note.projectId ? { id: note.projectId, title: 'Attached Project' } : undefined,
          priority: note.priority,
          status: note.status,
          wordCount: note.wordCount,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        },
        lastIndexed: new Date()
      });
    });
  }

  private async indexOtherContent(): Promise<void> {
    // Placeholder for indexing other content types
    // (timelines, notes, etc.)
  }

  private addToIndex(item: ContentIndex): void {
    this.contentIndex.set(item.id, item);
  }

  // Filtering
  private applyFilters(content: ContentIndex[], filters: SearchQuery['filters']): ContentIndex[] {
    return content.filter(item => {
      // Date range filter
      if (filters.dateRange) {
        const itemDate = new Date(item.metadata.updatedAt || item.metadata.createdAt);
        if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          item.tags.some(itemTag => itemTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }
      
      // Projects filter
      if (filters.projects && filters.projects.length > 0) {
        if (!item.metadata.project || !filters.projects.includes(item.metadata.project.id)) {
          return false;
        }
      }
      
      // Content types filter
      if (filters.contentTypes && filters.contentTypes.length > 0) {
        if (!filters.contentTypes.includes(item.type)) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!item.metadata.status || !filters.status.includes(item.metadata.status)) {
          return false;
        }
      }
      
      // Word count range filter
      if (filters.wordCountRange) {
        const wordCount = item.metadata.wordCount || 0;
        if (wordCount < filters.wordCountRange.min || wordCount > filters.wordCountRange.max) {
          return false;
        }
      }
      
      // Last modified filter
      if (filters.lastModified) {
        const itemDate = new Date(item.metadata.updatedAt || item.metadata.createdAt);
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (filters.lastModified) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (itemDate < cutoffDate) return false;
      }
      
      return true;
    });
  }

  private applySmartFilters(content: ContentIndex[]): ContentIndex[] {
    const activeFilters = this.smartFilters.filter(f => f.isActive);
    
    return content.filter(item => 
      activeFilters.every(filter => filter.filter(item))
    );
  }

  // Text Search
  private performTextSearch(content: ContentIndex[], searchText: string, options: SearchQuery['options']): ContentIndex[] {
    if (!searchText.trim()) return content;
    
    const searchTerms = this.parseSearchText(searchText, options);
    
    return content.filter(item => {
      if (options.regex) {
        try {
          const regex = new RegExp(searchText, options.caseSensitive ? 'g' : 'gi');
          return regex.test(item.title) || regex.test(item.content);
        } catch {
          // Invalid regex, fall back to normal search
        }
      }
      
      return searchTerms.every(term => this.matchesTerm(item, term, options));
    });
  }

  private parseSearchText(text: string, options: SearchQuery['options']): string[] {
    // Handle quoted phrases
    const phrases: string[] = [];
    const quotedRegex = /"([^"]+)"/g;
    let match;
    
    while ((match = quotedRegex.exec(text)) !== null) {
      phrases.push(match[1]);
      text = text.replace(match[0], '');
    }
    
    // Split remaining text into terms
    const terms = text.split(/\s+/).filter(term => term.length > 0);
    
    return [...phrases, ...terms];
  }

  private matchesTerm(item: ContentIndex, term: string, options: SearchQuery['options']): boolean {
    const searchIn = [item.title, ...(options.includeContent ? [item.content] : [])];
    
    if (options.includeMetadata) {
      searchIn.push(...item.tags, JSON.stringify(item.metadata));
    }
    
    const searchText = searchIn.join(' ');
    const searchTerm = options.caseSensitive ? term : term.toLowerCase();
    const content = options.caseSensitive ? searchText : searchText.toLowerCase();
    
    if (options.wholeWords) {
      const wordRegex = new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`, options.caseSensitive ? 'g' : 'gi');
      return wordRegex.test(content);
    }
    
    if (options.fuzzy) {
      return this.fuzzyMatch(content, searchTerm);
    }
    
    return content.includes(searchTerm);
  }

  private fuzzyMatch(content: string, term: string, threshold: number = 0.8): boolean {
    // Simple fuzzy matching using Levenshtein distance
    const words = content.split(/\s+/);
    
    return words.some(word => {
      const distance = this.levenshteinDistance(word.toLowerCase(), term.toLowerCase());
      const similarity = 1 - (distance / Math.max(word.length, term.length));
      return similarity >= threshold;
    });
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Relevance Scoring
  private calculateRelevanceScores(content: ContentIndex[], query: SearchQuery): Array<ContentIndex & { relevanceScore: number }> {
    return content.map(item => ({
      ...item,
      relevanceScore: this.calculateRelevance(item, query)
    }));
  }

  private calculateRelevance(item: ContentIndex, query: SearchQuery): number {
    let score = 0;
    
    if (!query.text) return 1; // Default relevance when no text query
    
    const searchTerms = this.parseSearchText(query.text, query.options);
    
    searchTerms.forEach(term => {
      const termLower = term.toLowerCase();
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();
      
      // Title matches are more important
      if (titleLower === termLower) score += 10;
      else if (titleLower.includes(termLower)) score += 5;
      
      // Content matches
      const contentMatches = (contentLower.match(new RegExp(this.escapeRegex(termLower), 'g')) || []).length;
      score += contentMatches * 0.5;
      
      // Tag matches
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(termLower)) score += 2;
      });
      
      // Metadata matches
      if (JSON.stringify(item.metadata).toLowerCase().includes(termLower)) {
        score += 1;
      }
    });
    
    // Boost based on content type
    const typeBoosts = {
      project: 1.5,
      scene: 1.2,
      character: 1.1,
      location: 1.1,
      quicknote: 1.0,
      note: 1.0,
      timeline: 0.9
    };
    
    score *= typeBoosts[item.type] || 1.0;
    
    // Boost recent content
    const daysSinceUpdate = (Date.now() - new Date(item.metadata.updatedAt || item.metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score *= 1.2;
    else if (daysSinceUpdate < 30) score *= 1.1;
    
    return score;
  }

  // Sorting
  private sortResults(results: Array<ContentIndex & { relevanceScore: number }>, sortBy: SortField, order: 'asc' | 'desc'): Array<ContentIndex & { relevanceScore: number }> {
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'date':
        case 'lastModified':
          const dateA = new Date(a.metadata.updatedAt || a.metadata.createdAt);
          const dateB = new Date(b.metadata.updatedAt || b.metadata.createdAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'wordCount':
          comparison = (a.metadata.wordCount || 0) - (b.metadata.wordCount || 0);
          break;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  }

  // Result Conversion
  private async convertToSearchResults(indexedResults: Array<ContentIndex & { relevanceScore: number }>, searchText?: string): Promise<SearchResult[]> {
    return indexedResults.map(item => {
      const highlights = searchText ? this.generateHighlights(item.content, searchText) : [];
      const excerpt = this.generateExcerpt(item.content, highlights);
      
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
        excerpt,
        highlights,
        metadata: {
          project: item.metadata.project,
          tags: item.tags,
          author: item.metadata.author,
          wordCount: item.metadata.wordCount || 0,
          createdAt: new Date(item.metadata.createdAt),
          updatedAt: new Date(item.metadata.updatedAt || item.metadata.createdAt),
          status: item.metadata.status
        },
        relevanceScore: item.relevanceScore,
        path: this.generateNavigationPath(item)
      };
    });
  }

  private generateHighlights(content: string, searchText: string): TextHighlight[] {
    const highlights: TextHighlight[] = [];
    const terms = this.parseSearchText(searchText, { caseSensitive: false });
    
    terms.forEach(term => {
      const regex = new RegExp(this.escapeRegex(term), 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + match[0].length + 50);
        
        highlights.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          context: content.substring(start, end)
        });
      }
    });
    
    return highlights;
  }

  private generateExcerpt(content: string, highlights: TextHighlight[]): string {
    if (highlights.length === 0) {
      return content.substring(0, 200) + (content.length > 200 ? '...' : '');
    }
    
    // Use the first highlight's context
    const firstHighlight = highlights[0];
    const start = Math.max(0, firstHighlight.start - 100);
    const end = Math.min(content.length, firstHighlight.end + 100);
    
    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  private generateNavigationPath(item: ContentIndex): string {
    switch (item.type) {
      case 'project':
        return `/projects/${item.id.replace('project-', '')}`;
      case 'scene':
        return `/projects/${item.metadata.project?.id}/scenes/${item.id.replace('scene-', '')}`;
      case 'character':
        return `/projects/${item.metadata.project?.id}/characters/${item.id.replace('character-', '')}`;
      case 'location':
        return `/projects/${item.metadata.project?.id}/locations/${item.id.replace('location-', '')}`;
      case 'quicknote':
        return `/quick-notes#${item.id.replace('quicknote-', '')}`;
      default:
        return '/';
    }
  }

  // Saved Searches
  saveSearch(name: string, query: SearchQuery, description?: string): SavedSearch {
    const savedSearch: SavedSearch = {
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      query,
      isGlobal: false,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0
    };
    
    this.savedSearches.push(savedSearch);
    this.saveSavedSearches();
    this.emit('searchSaved', savedSearch);
    
    return savedSearch;
  }

  getSavedSearches(): SavedSearch[] {
    return [...this.savedSearches].sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  deleteSavedSearch(searchId: string): boolean {
    const index = this.savedSearches.findIndex(s => s.id === searchId);
    if (index === -1) return false;
    
    this.savedSearches.splice(index, 1);
    this.saveSavedSearches();
    this.emit('searchDeleted', { searchId });
    
    return true;
  }

  executeSavedSearch(searchId: string): Promise<SearchResult[]> {
    const savedSearch = this.savedSearches.find(s => s.id === searchId);
    if (!savedSearch) throw new Error('Saved search not found');
    
    savedSearch.lastUsed = new Date();
    savedSearch.useCount++;
    this.saveSavedSearches();
    
    return this.search(savedSearch.query);
  }

  // Search Suggestions
  getSearchSuggestions(partialQuery: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = partialQuery.toLowerCase();
    
    // Recent search terms
    const recentQueries = this.searchHistory
      .filter(h => h.query.text && h.query.text.toLowerCase().includes(queryLower))
      .slice(0, 5)
      .map(h => ({
        text: h.query.text!,
        type: 'recent' as const,
        count: h.resultCount
      }));
    
    suggestions.push(...recentQueries);
    
    // Popular tags
    const allTags = Array.from(this.contentIndex.values())
      .flatMap(item => item.tags)
      .filter(tag => tag.toLowerCase().includes(queryLower));
    
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({
        text: tag,
        type: 'tag' as const,
        count,
        category: 'Tags'
      }));
    
    suggestions.push(...popularTags);
    
    // Project names
    const projectNames = Array.from(this.contentIndex.values())
      .filter(item => item.type === 'project' && item.title.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(item => ({
        text: item.title,
        type: 'project' as const,
        category: 'Projects'
      }));
    
    suggestions.push(...projectNames);
    
    return suggestions;
  }

  // Smart Filters
  private initializeSmartFilters(): void {
    this.smartFilters = [
      {
        id: 'high-quality',
        name: 'High Quality Content',
        description: 'Content with high word count and recent updates',
        category: 'quality',
        filter: (item: ContentIndex) => {
          const wordCount = item.metadata.wordCount || 0;
          const daysSinceUpdate = (Date.now() - new Date(item.metadata.updatedAt || item.metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return wordCount > 100 && daysSinceUpdate < 30;
        },
        isActive: false
      },
      {
        id: 'recent-content',
        name: 'Recent Content',
        description: 'Content modified in the last week',
        category: 'temporal',
        filter: (item: ContentIndex) => {
          const daysSinceUpdate = (Date.now() - new Date(item.metadata.updatedAt || item.metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpdate <= 7;
        },
        isActive: false
      },
      {
        id: 'substantial-content',
        name: 'Substantial Content',
        description: 'Content with significant word count',
        category: 'content',
        filter: (item: ContentIndex) => (item.metadata.wordCount || 0) > 500,
        isActive: false
      },
      {
        id: 'tagged-content',
        name: 'Tagged Content',
        description: 'Content with tags for better organization',
        category: 'content',
        filter: (item: ContentIndex) => item.tags.length > 0,
        isActive: false
      }
    ];
  }

  getSmartFilters(): SmartFilter[] {
    return [...this.smartFilters];
  }

  toggleSmartFilter(filterId: string): boolean {
    const filter = this.smartFilters.find(f => f.id === filterId);
    if (!filter) return false;
    
    filter.isActive = !filter.isActive;
    this.saveSmartFilters();
    this.emit('smartFilterToggled', { filterId, isActive: filter.isActive });
    
    return true;
  }

  // Analytics
  private initializeAnalytics(): void {
    this.searchAnalytics = {
      totalSearches: 0,
      popularQueries: [],
      searchTrends: [],
      averageResultsClicked: 0,
      noResultsQueries: [],
      performanceMetrics: {
        averageSearchTime: 0,
        indexSize: 0,
        lastIndexUpdate: new Date()
      }
    };
  }

  private recordSearch(query: SearchQuery): void {
    this.searchHistory.push({
      query,
      timestamp: new Date(),
      resultCount: 0 // Will be updated after search
    });
    
    // Limit history size
    if (this.searchHistory.length > 1000) {
      this.searchHistory = this.searchHistory.slice(-1000);
    }
  }

  private updateSearchAnalytics(query: SearchQuery, resultCount: number, searchTime: number): void {
    this.searchAnalytics.totalSearches++;
    
    // Update last search result count
    if (this.searchHistory.length > 0) {
      this.searchHistory[this.searchHistory.length - 1].resultCount = resultCount;
    }
    
    // Track no results queries
    if (resultCount === 0 && query.text) {
      this.searchAnalytics.noResultsQueries.push(query.text);
      this.searchAnalytics.noResultsQueries = this.searchAnalytics.noResultsQueries.slice(-100);
    }
    
    // Update performance metrics
    this.searchAnalytics.performanceMetrics.averageSearchTime = 
      (this.searchAnalytics.performanceMetrics.averageSearchTime + searchTime) / 2;
    
    this.searchAnalytics.performanceMetrics.indexSize = this.contentIndex.size;
    
    this.saveAnalytics();
  }

  getSearchAnalytics(): SearchAnalytics {
    // Calculate popular queries
    const queryCount = this.searchHistory.reduce((acc, h) => {
      if (h.query.text) {
        acc[h.query.text] = (acc[h.query.text] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    this.searchAnalytics.popularQueries = Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
    
    // Calculate search trends (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();
    
    this.searchAnalytics.searchTrends = last30Days.map(date => {
      const count = this.searchHistory.filter(h => {
        const searchDate = new Date(h.timestamp);
        searchDate.setHours(0, 0, 0, 0);
        return searchDate.getTime() === date.getTime();
      }).length;
      
      return { date: new Date(date), count };
    });
    
    return { ...this.searchAnalytics };
  }

  // Initialization
  private async startIndexing(): Promise<void> {
    // Index content on startup if index is empty or outdated
    if (this.contentIndex.size === 0) {
      await this.rebuildIndex();
    }
    
    // Set up periodic reindexing
    setInterval(() => {
      this.rebuildIndex();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // Storage
  private saveIndex(): void {
    try {
      const indexData = Array.from(this.contentIndex.entries());
      localStorage.setItem(`${this.storageKey}_index`, JSON.stringify(indexData));
    } catch (error) {
      console.error('Failed to save search index:', error);
    }
  }

  private saveSavedSearches(): void {
    try {
      localStorage.setItem(`${this.storageKey}_saved_searches`, JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('Failed to save saved searches:', error);
    }
  }

  private saveSmartFilters(): void {
    try {
      localStorage.setItem(`${this.storageKey}_smart_filters`, JSON.stringify(this.smartFilters));
    } catch (error) {
      console.error('Failed to save smart filters:', error);
    }
  }

  private saveAnalytics(): void {
    try {
      localStorage.setItem(`${this.storageKey}_analytics`, JSON.stringify(this.searchAnalytics));
      localStorage.setItem(`${this.storageKey}_history`, JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to save search analytics:', error);
    }
  }

  private loadData(): void {
    this.loadIndex();
    this.loadSavedSearches();
    this.loadSmartFilters();
    this.loadAnalytics();
  }

  private loadIndex(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_index`);
      if (stored) {
        const indexData = JSON.parse(stored);
        this.contentIndex = new Map(indexData);
      }
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }

  private loadSavedSearches(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_saved_searches`);
      if (stored) {
        this.savedSearches = JSON.parse(stored).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: new Date(search.lastUsed)
        }));
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  }

  private loadSmartFilters(): void {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_smart_filters`);
      if (stored) {
        const savedFilters = JSON.parse(stored);
        // Merge with default filters, preserving active state
        this.smartFilters.forEach(filter => {
          const saved = savedFilters.find((s: SmartFilter) => s.id === filter.id);
          if (saved) {
            filter.isActive = saved.isActive;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load smart filters:', error);
    }
  }

  private loadAnalytics(): void {
    try {
      const analyticsStored = localStorage.getItem(`${this.storageKey}_analytics`);
      if (analyticsStored) {
        this.searchAnalytics = JSON.parse(analyticsStored);
      }
      
      const historyStored = localStorage.getItem(`${this.storageKey}_history`);
      if (historyStored) {
        this.searchHistory = JSON.parse(historyStored).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    }
  }
}

// Query Builder Helper Class
class QueryBuilder {
  private query: SearchQuery = {
    filters: {},
    options: {}
  };

  text(searchText: string): QueryBuilder {
    this.query.text = searchText;
    return this;
  }

  dateRange(start: Date, end: Date): QueryBuilder {
    this.query.filters.dateRange = { start, end };
    return this;
  }

  tags(tags: string[]): QueryBuilder {
    this.query.filters.tags = tags;
    return this;
  }

  projects(projectIds: string[]): QueryBuilder {
    this.query.filters.projects = projectIds;
    return this;
  }

  contentTypes(types: ContentType[]): QueryBuilder {
    this.query.filters.contentTypes = types;
    return this;
  }

  status(statuses: string[]): QueryBuilder {
    this.query.filters.status = statuses;
    return this;
  }

  wordCount(min: number, max: number): QueryBuilder {
    this.query.filters.wordCountRange = { min, max };
    return this;
  }

  lastModified(period: 'today' | 'week' | 'month' | 'year'): QueryBuilder {
    this.query.filters.lastModified = period;
    return this;
  }

  fuzzy(enabled: boolean = true): QueryBuilder {
    this.query.options.fuzzy = enabled;
    return this;
  }

  caseSensitive(enabled: boolean = true): QueryBuilder {
    this.query.options.caseSensitive = enabled;
    return this;
  }

  wholeWords(enabled: boolean = true): QueryBuilder {
    this.query.options.wholeWords = enabled;
    return this;
  }

  regex(enabled: boolean = true): QueryBuilder {
    this.query.options.regex = enabled;
    return this;
  }

  includeContent(enabled: boolean = true): QueryBuilder {
    this.query.options.includeContent = enabled;
    return this;
  }

  includeMetadata(enabled: boolean = true): QueryBuilder {
    this.query.options.includeMetadata = enabled;
    return this;
  }

  maxResults(limit: number): QueryBuilder {
    this.query.options.maxResults = limit;
    return this;
  }

  sortBy(field: SortField, order: 'asc' | 'desc' = 'desc'): QueryBuilder {
    this.query.options.sortBy = field;
    this.query.options.sortOrder = order;
    return this;
  }

  build(): SearchQuery {
    return { ...this.query };
  }
}

export const advancedSearchService = new AdvancedSearchService();
export default advancedSearchService;