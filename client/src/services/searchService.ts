/**
 * Advanced Full-Text Search Service
 * Provides sophisticated search capabilities across all content types
 */

import type { 
  Note, 
  Character, 
  Location, 
  Item, 
  PlotThread, 
  Scene,
  SearchResult,
  SearchMatch 
} from '@/types/story';
import { storageService } from './storageService';
import { wikiLinkService } from './wikiLinkService';

export interface SearchOptions {
  query: string;
  projectId?: string;
  storyId?: string;
  types?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'date' | 'title' | 'type';
  limit?: number;
  includeContent?: boolean;
  fuzzySearch?: boolean;
  exactPhrase?: boolean;
}

export interface SearchIndex {
  id: string;
  type: 'note' | 'character' | 'location' | 'item' | 'plotthread' | 'scene';
  projectId: string;
  storyId?: string;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  wordCount: number;
  lastUpdated: string;
  searchableText: string; // Combined searchable content
}

class SearchService {
  private static instance: SearchService;
  private searchIndex: Map<string, SearchIndex> = new Map();
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'through', 'during', 'before', 'after', 'above', 'below', 'between'
  ]);

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Initialize and build search index for a project
   */
  public async buildSearchIndex(projectId: string): Promise<void> {
    console.log(`Building search index for project ${projectId}...`);
    
    // Clear existing index for this project
    for (const [key, item] of this.searchIndex) {
      if (item.projectId === projectId) {
        this.searchIndex.delete(key);
      }
    }

    // Index notes
    const notes = storageService.getProjectNotes(projectId);
    for (const note of notes) {
      this.indexNote(note);
    }

    // Index characters
    const characters = this.getProjectCharacters(projectId);
    for (const character of characters) {
      this.indexCharacter(character);
    }

    // Index locations
    const locations = this.getProjectLocations(projectId);
    for (const location of locations) {
      this.indexLocation(location);
    }

    // Index items
    const items = this.getProjectItems(projectId);
    for (const item of items) {
      this.indexItem(item);
    }

    // Index plot threads
    const plotThreads = this.getProjectPlotThreads(projectId);
    for (const thread of plotThreads) {
      this.indexPlotThread(thread);
    }

    console.log(`Search index built: ${this.searchIndex.size} items indexed`);
  }

  /**
   * Perform comprehensive search
   */
  public async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      projectId,
      storyId,
      types = [],
      tags = [],
      dateRange,
      sortBy = 'relevance',
      limit = 50,
      includeContent = true,
      fuzzySearch = false,
      exactPhrase = false
    } = options;

    if (!query.trim()) {
      return [];
    }

    // Build search index if not exists
    if (projectId && this.getIndexSize(projectId) === 0) {
      await this.buildSearchIndex(projectId);
    }

    // Get candidate items
    let candidates = Array.from(this.searchIndex.values());

    // Filter by project
    if (projectId) {
      candidates = candidates.filter(item => item.projectId === projectId);
    }

    // Filter by story
    if (storyId) {
      candidates = candidates.filter(item => item.storyId === storyId);
    }

    // Filter by types
    if (types.length > 0) {
      candidates = candidates.filter(item => types.includes(item.type));
    }

    // Filter by tags
    if (tags.length > 0) {
      candidates = candidates.filter(item => 
        tags.some(tag => item.tags.includes(tag))
      );
    }

    // Filter by date range
    if (dateRange) {
      candidates = candidates.filter(item => 
        item.lastUpdated >= dateRange.start && item.lastUpdated <= dateRange.end
      );
    }

    // Perform text search and scoring
    const searchResults: SearchResult[] = [];
    const normalizedQuery = this.normalizeQuery(query);

    for (const item of candidates) {
      const searchResult = this.searchInItem(item, normalizedQuery, {
        exactPhrase,
        fuzzySearch,
        includeContent
      });

      if (searchResult && searchResult.relevance > 0) {
        searchResults.push(searchResult);
      }
    }

    // Sort results
    this.sortResults(searchResults, sortBy);

    // Apply limit
    return searchResults.slice(0, limit);
  }

  /**
   * Get search suggestions as user types
   */
  public getSuggestions(query: string, projectId?: string, limit: number = 10): string[] {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    const normalizedQuery = query.toLowerCase();

    // Get items to search
    let items = Array.from(this.searchIndex.values());
    if (projectId) {
      items = items.filter(item => item.projectId === projectId);
    }

    // Extract suggestions from titles and content
    for (const item of items) {
      // Title suggestions
      if (item.title.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(item.title);
      }

      // Content word suggestions
      const words = item.searchableText.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.startsWith(normalizedQuery) && word.length > 2 && !this.stopWords.has(word)) {
          suggestions.add(word);
        }
      }

      // Tag suggestions
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(normalizedQuery)) {
          suggestions.add(tag);
        }
      }

      if (suggestions.size >= limit * 2) break; // Get more than needed for better sorting
    }

    // Sort suggestions by relevance
    return Array.from(suggestions)
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        // Exact matches first
        if (aLower === normalizedQuery) return -1;
        if (bLower === normalizedQuery) return 1;
        
        // Starts with query
        if (aLower.startsWith(normalizedQuery) && !bLower.startsWith(normalizedQuery)) return -1;
        if (bLower.startsWith(normalizedQuery) && !aLower.startsWith(normalizedQuery)) return 1;
        
        // Shorter strings first
        return a.length - b.length;
      })
      .slice(0, limit);
  }

  /**
   * Get popular search terms
   */
  public getPopularSearches(projectId?: string, limit: number = 10): string[] {
    // This would typically be stored in analytics, for now return common terms
    const commonTerms = ['character', 'plot', 'scene', 'location', 'dialogue', 'conflict', 'theme'];
    return commonTerms.slice(0, limit);
  }

  /**
   * Get search statistics
   */
  public getSearchStats(projectId?: string): {
    totalItems: number;
    itemsByType: Record<string, number>;
    totalWords: number;
    lastIndexed: string;
  } {
    let items = Array.from(this.searchIndex.values());
    if (projectId) {
      items = items.filter(item => item.projectId === projectId);
    }

    const itemsByType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalWords = items.reduce((sum, item) => sum + item.wordCount, 0);
    const lastIndexed = items.length > 0 
      ? Math.max(...items.map(item => new Date(item.lastUpdated).getTime()))
      : Date.now();

    return {
      totalItems: items.length,
      itemsByType,
      totalWords,
      lastIndexed: new Date(lastIndexed).toISOString()
    };
  }

  /**
   * Update index when content changes
   */
  public updateIndex(item: Note | Character | Location | Item | PlotThread): void {
    switch (item.constructor.name) {
      case 'Note':
        this.indexNote(item as Note);
        break;
      // Add other types as needed
    }
  }

  /**
   * Remove item from index
   */
  public removeFromIndex(id: string): void {
    this.searchIndex.delete(id);
  }

  // Private methods

  private indexNote(note: Note): void {
    const searchableText = [
      note.title,
      note.content,
      ...note.tags,
      note.type
    ].join(' ');

    this.searchIndex.set(note.id, {
      id: note.id,
      type: 'note',
      projectId: note.projectId,
      storyId: note.storyId,
      title: note.title,
      content: note.content,
      tags: note.tags,
      metadata: {
        type: note.type,
        wordCount: note.wordCount,
        status: note.status,
        priority: note.priority
      },
      wordCount: note.wordCount,
      lastUpdated: note.updatedAt,
      searchableText: this.normalizeText(searchableText)
    });
  }

  private indexCharacter(character: Character): void {
    const searchableText = [
      character.name,
      character.fullName || '',
      ...character.nicknames,
      character.occupation || '',
      character.backstory || '',
      ...character.personality.traits,
      ...character.personality.motivations,
      character.role,
      ...character.tags
    ].join(' ');

    this.searchIndex.set(character.id, {
      id: character.id,
      type: 'character',
      projectId: character.projectId,
      title: character.name,
      content: character.backstory || '',
      tags: character.tags,
      metadata: {
        role: character.role,
        importance: character.importance,
        occupation: character.occupation
      },
      wordCount: (character.backstory || '').split(/\s+/).length,
      lastUpdated: character.updatedAt,
      searchableText: this.normalizeText(searchableText)
    });
  }

  private indexLocation(location: Location): void {
    const searchableText = [
      location.name,
      location.description,
      location.type,
      ...location.atmosphere,
      location.mood || '',
      location.notes || '',
      ...location.tags
    ].join(' ');

    this.searchIndex.set(location.id, {
      id: location.id,
      type: 'location',
      projectId: location.projectId,
      title: location.name,
      content: location.description,
      tags: location.tags,
      metadata: {
        type: location.type,
        importance: location.importance,
        mood: location.mood
      },
      wordCount: location.description.split(/\s+/).length,
      lastUpdated: location.updatedAt,
      searchableText: this.normalizeText(searchableText)
    });
  }

  private indexItem(item: Item): void {
    const searchableText = [
      item.name,
      item.description,
      item.type,
      item.significance,
      item.symbolism || '',
      item.notes || '',
      ...item.tags
    ].join(' ');

    this.searchIndex.set(item.id, {
      id: item.id,
      type: 'item',
      projectId: item.projectId,
      title: item.name,
      content: item.description,
      tags: item.tags,
      metadata: {
        type: item.type,
        significance: item.significance,
        currentOwner: item.currentOwner
      },
      wordCount: item.description.split(/\s+/).length,
      lastUpdated: item.updatedAt,
      searchableText: this.normalizeText(searchableText)
    });
  }

  private indexPlotThread(thread: PlotThread): void {
    const searchableText = [
      thread.name,
      thread.description,
      thread.type,
      thread.status,
      thread.notes || '',
      ...thread.tags
    ].join(' ');

    this.searchIndex.set(thread.id, {
      id: thread.id,
      type: 'plotthread',
      projectId: thread.projectId,
      storyId: thread.storyId,
      title: thread.name,
      content: thread.description,
      tags: thread.tags,
      metadata: {
        type: thread.type,
        status: thread.status,
        priority: thread.priority
      },
      wordCount: thread.description.split(/\s+/).length,
      lastUpdated: thread.updatedAt,
      searchableText: this.normalizeText(searchableText)
    });
  }

  private searchInItem(
    item: SearchIndex, 
    query: string, 
    options: { exactPhrase: boolean; fuzzySearch: boolean; includeContent: boolean }
  ): SearchResult | null {
    const { exactPhrase, fuzzySearch, includeContent } = options;
    let relevance = 0;
    const matches: SearchMatch[] = [];

    // Search in title (higher weight)
    const titleMatches = this.findMatches(item.title, query, exactPhrase, fuzzySearch);
    titleMatches.forEach(match => {
      matches.push({ ...match, field: 'title' });
      relevance += 10; // Title matches are worth more
    });

    // Search in content
    if (includeContent) {
      const contentMatches = this.findMatches(item.content, query, exactPhrase, fuzzySearch);
      contentMatches.forEach(match => {
        matches.push({ ...match, field: 'content' });
        relevance += 5;
      });
    }

    // Search in tags
    for (const tag of item.tags) {
      const tagMatches = this.findMatches(tag, query, exactPhrase, fuzzySearch);
      tagMatches.forEach(match => {
        matches.push({ ...match, field: 'tags' });
        relevance += 7; // Tags are important
      });
    }

    // Search in searchable text for general relevance
    if (item.searchableText.includes(query.toLowerCase())) {
      relevance += 1;
    }

    if (relevance === 0) {
      return null;
    }

    // Normalize relevance score (0-1)
    const normalizedRelevance = Math.min(relevance / 100, 1);

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      content: includeContent ? item.content : undefined,
      matches,
      relevance: normalizedRelevance,
      projectId: item.projectId,
      projectTitle: '', // Would need to fetch from project service
      storyId: item.storyId,
      storyTitle: '' // Would need to fetch from story service
    };
  }

  private findMatches(
    text: string, 
    query: string, 
    exactPhrase: boolean, 
    fuzzySearch: boolean
  ): Array<{ snippet: string; highlightStart: number; highlightEnd: number }> {
    const matches: Array<{ snippet: string; highlightStart: number; highlightEnd: number }> = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (exactPhrase) {
      // Exact phrase matching
      let index = lowerText.indexOf(lowerQuery);
      while (index !== -1) {
        const snippet = this.extractSnippet(text, index, query.length);
        matches.push({
          snippet,
          highlightStart: index,
          highlightEnd: index + query.length
        });
        index = lowerText.indexOf(lowerQuery, index + 1);
      }
    } else {
      // Word-based matching
      const queryWords = lowerQuery.split(/\s+/).filter(word => !this.stopWords.has(word));
      
      for (const word of queryWords) {
        let index = lowerText.indexOf(word);
        while (index !== -1) {
          const snippet = this.extractSnippet(text, index, word.length);
          matches.push({
            snippet,
            highlightStart: index,
            highlightEnd: index + word.length
          });
          index = lowerText.indexOf(word, index + 1);
        }
      }
    }

    return matches;
  }

  private extractSnippet(text: string, matchIndex: number, matchLength: number, contextLength: number = 100): string {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + matchLength + contextLength);
    return text.slice(start, end).trim();
  }

  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim();
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sortResults(results: SearchResult[], sortBy: string): void {
    switch (sortBy) {
      case 'relevance':
        results.sort((a, b) => b.relevance - a.relevance);
        break;
      case 'title':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'type':
        results.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
          }
          return b.relevance - a.relevance;
        });
        break;
      case 'date':
        results.sort((a, b) => b.id.localeCompare(a.id)); // Assuming ID contains timestamp
        break;
    }
  }

  private getIndexSize(projectId?: string): number {
    if (!projectId) return this.searchIndex.size;
    
    let count = 0;
    for (const item of this.searchIndex.values()) {
      if (item.projectId === projectId) count++;
    }
    return count;
  }

  // Mock data access methods (would be replaced with actual service calls)
  private getProjectCharacters(projectId: string): Character[] {
    return JSON.parse(localStorage.getItem(`characters_${projectId}`) || '[]');
  }

  private getProjectLocations(projectId: string): Location[] {
    return JSON.parse(localStorage.getItem(`locations_${projectId}`) || '[]');
  }

  private getProjectItems(projectId: string): Item[] {
    return JSON.parse(localStorage.getItem(`items_${projectId}`) || '[]');
  }

  private getProjectPlotThreads(projectId: string): PlotThread[] {
    return JSON.parse(localStorage.getItem(`plotthreads_${projectId}`) || '[]');
  }
}

export const searchService = SearchService.getInstance();