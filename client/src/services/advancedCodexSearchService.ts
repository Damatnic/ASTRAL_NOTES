/**
 * Advanced Codex Search Service - Phase 1C Feature
 * AI-powered search with consistency checking, semantic understanding, and intelligent suggestions
 */

import { aiProviderService } from './aiProviderService';
import { advancedCodexService } from './advancedCodexService';
import { intelligentAutoLinkingService } from './intelligentAutoLinkingService';
import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  AdvancedSearchFilters,
  SearchResult,
  ConsistencyFlag,
  AISuggestion
} from '@/types/codex';

// Enhanced search interfaces
export interface SmartSearchQuery {
  query: string;
  intent?: SearchIntent;
  context?: SearchContext;
  filters?: AdvancedSearchFilters;
  options?: SearchOptions;
}

export type SearchIntent = 
  | 'find_entity' | 'find_relationship' | 'check_consistency' 
  | 'explore_connections' | 'analyze_themes' | 'research_topic'
  | 'validate_timeline' | 'find_conflicts';

export interface SearchContext {
  currentEntity?: string;
  currentProject?: string;
  currentUniverse?: string;
  userGoal?: string;
  previousSearches?: string[];
  workingDocument?: string;
}

export interface SearchOptions {
  enableAI: boolean;
  enableSemanticSearch: boolean;
  enableConsistencyChecking: boolean;
  enableSuggestions: boolean;
  maxResults: number;
  relevanceThreshold: number;
  includeSimilar: boolean;
  includeRelated: boolean;
  includeConflicts: boolean;
  searchDepth: 'shallow' | 'medium' | 'deep';
  responseStyle: 'quick' | 'detailed' | 'comprehensive';
}

export interface EnhancedSearchResult extends SearchResult {
  aiAnalysis?: AISearchAnalysis;
  semanticSimilarity?: number;
  consistencyFlags?: ConsistencyFlag[];
  relatedEntities?: RelatedEntitySuggestion[];
  suggestions?: SearchSuggestion[];
  conflictWarnings?: ConflictWarning[];
}

export interface AISearchAnalysis {
  intentAnalysis: string;
  conceptExtraction: string[];
  thematicConnections: string[];
  narrativeSignificance: string;
  developmentPotential: string[];
  questionSuggestions: string[];
}

export interface RelatedEntitySuggestion {
  entity: AdvancedCodexEntity;
  relationshipType: string;
  relevanceScore: number;
  explanation: string;
}

export interface SearchSuggestion {
  type: 'refine_query' | 'explore_related' | 'check_consistency' | 'create_entity' | 'add_relationship';
  description: string;
  action: any;
  confidence: number;
  reasoning: string;
}

export interface ConflictWarning {
  type: 'inconsistency' | 'contradiction' | 'missing_info' | 'timeline_conflict';
  entities: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  suggestedResolution: string;
}

export interface SemanticSearchIndex {
  entityId: string;
  vectors: number[];
  concepts: string[];
  themes: string[];
  lastUpdated: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  mostSearchedTerms: Array<{ term: string; count: number }>;
  searchIntents: Record<SearchIntent, number>;
  aiUsageStats: {
    totalAICalls: number;
    averageConfidence: number;
    accuracyScore: number;
  };
  userSatisfaction: {
    averageRating: number;
    feedbackCount: number;
  };
}

export interface SearchIndex {
  textIndex: Map<string, Set<string>>; // term -> entity IDs
  semanticIndex: Map<string, SemanticSearchIndex>;
  conceptIndex: Map<string, Set<string>>; // concept -> entity IDs
  relationshipIndex: Map<string, Set<string>>; // relationship -> entity pairs
  lastUpdated: string;
}

class AdvancedCodexSearchService {
  private searchIndex: SearchIndex;
  private searchHistory: SmartSearchQuery[] = [];
  private analytics: SearchAnalytics;
  private defaultOptions: SearchOptions;

  constructor() {
    this.searchIndex = {
      textIndex: new Map(),
      semanticIndex: new Map(),
      conceptIndex: new Map(),
      relationshipIndex: new Map(),
      lastUpdated: new Date().toISOString()
    };

    this.analytics = this.initializeAnalytics();
    this.defaultOptions = this.getDefaultOptions();
    this.loadSearchIndex();
  }

  // MAIN SEARCH METHODS

  async smartSearch(searchQuery: SmartSearchQuery): Promise<EnhancedSearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Record search
      this.recordSearch(searchQuery);
      
      // Analyze search intent if not provided
      if (!searchQuery.intent && searchQuery.options?.enableAI) {
        searchQuery.intent = await this.analyzeSearchIntent(searchQuery.query, searchQuery.context);
      }
      
      // Perform multi-layered search
      const results = await this.performMultiLayeredSearch(searchQuery);
      
      // Enhance results with AI analysis
      if (searchQuery.options?.enableAI) {
        await this.enhanceResultsWithAI(results, searchQuery);
      }
      
      // Add consistency checking
      if (searchQuery.options?.enableConsistencyChecking) {
        await this.addConsistencyChecking(results, searchQuery);
      }
      
      // Generate suggestions
      if (searchQuery.options?.enableSuggestions) {
        await this.addSearchSuggestions(results, searchQuery);
      }
      
      // Update analytics
      this.updateAnalytics(searchQuery, results, Date.now() - startTime);
      
      return results;
      
    } catch (error) {
      console.error('Smart search failed:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async semanticSearch(
    query: string,
    projectId: string,
    options: Partial<SearchOptions> = {}
  ): Promise<EnhancedSearchResult[]> {
    const searchOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Find similar entities using semantic similarity
      const semanticMatches = await this.findSemanticMatches(
        queryEmbedding,
        projectId,
        searchOptions.maxResults
      );
      
      // Convert to enhanced search results
      const results = await this.convertToSearchResults(semanticMatches, query);
      
      return results;
      
    } catch (error) {
      console.error('Semantic search failed:', error);
      // Fallback to text search
      return this.textSearch(query, projectId, options);
    }
  }

  async conceptualSearch(
    concepts: string[],
    projectId: string,
    options: Partial<SearchOptions> = {}
  ): Promise<EnhancedSearchResult[]> {
    const searchOptions = { ...this.defaultOptions, ...options };
    const results: EnhancedSearchResult[] = [];
    
    for (const concept of concepts) {
      const entityIds = this.searchIndex.conceptIndex.get(concept.toLowerCase()) || new Set();
      
      for (const entityId of entityIds) {
        try {
          const entity = await advancedCodexService.getEntity(entityId);
          const result = await this.createSearchResult(entity, concept, 'conceptual');
          results.push(result);
        } catch (error) {
          console.warn(`Failed to load entity ${entityId}:`, error);
        }
      }
    }
    
    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, searchOptions.maxResults);
  }

  async relationshipSearch(
    fromEntityId: string,
    relationshipType?: string,
    options: Partial<SearchOptions> = {}
  ): Promise<{
    directRelationships: EnhancedSearchResult[];
    indirectRelationships: EnhancedSearchResult[];
    suggestedRelationships: RelatedEntitySuggestion[];
  }> {
    const searchOptions = { ...this.defaultOptions, ...options };
    
    // Get direct relationships
    const directLinks = await advancedCodexService.getEntityRelationships(fromEntityId);
    const directRelationships = await Promise.all(
      directLinks
        .filter(link => !relationshipType || link.type === relationshipType)
        .map(async link => {
          const targetEntity = await advancedCodexService.getEntity(link.targetEntityId);
          return this.createSearchResult(targetEntity, relationshipType || 'relationship', 'relationship');
        })
    );
    
    // Get indirect relationships (2 degrees)
    const indirectRelationships: EnhancedSearchResult[] = [];
    if (searchOptions.searchDepth !== 'shallow') {
      for (const directLink of directLinks) {
        const secondDegreeLinks = await advancedCodexService.getEntityRelationships(directLink.targetEntityId);
        for (const secondLink of secondDegreeLinks.slice(0, 5)) { // Limit to avoid explosion
          if (secondLink.targetEntityId !== fromEntityId) {
            try {
              const entity = await advancedCodexService.getEntity(secondLink.targetEntityId);
              const result = await this.createSearchResult(entity, 'indirect_relationship', 'relationship');
              result.relevance *= 0.7; // Reduce relevance for indirect relationships
              indirectRelationships.push(result);
            } catch (error) {
              console.warn(`Failed to load indirect relationship entity:`, error);
            }
          }
        }
      }
    }
    
    // Generate suggested relationships using AI
    const suggestedRelationships = searchOptions.enableAI
      ? await this.generateRelationshipSuggestions(fromEntityId)
      : [];
    
    return {
      directRelationships: directRelationships.slice(0, searchOptions.maxResults),
      indirectRelationships: indirectRelationships.slice(0, searchOptions.maxResults),
      suggestedRelationships
    };
  }

  // CONSISTENCY CHECKING

  async checkEntityConsistency(entityId: string): Promise<{
    consistencyScore: number;
    flags: ConsistencyFlag[];
    suggestions: AISuggestion[];
    conflicts: ConflictWarning[];
  }> {
    try {
      const entity = await advancedCodexService.getEntity(entityId);
      const flags: ConsistencyFlag[] = [];
      const suggestions: AISuggestion[] = [];
      const conflicts: ConflictWarning[] = [];
      
      // Run consistency checks
      const consistencyResult = await advancedCodexService.runConsistencyCheck(entityId);
      flags.push(...this.convertToConsistencyFlags(consistencyResult.issues));
      
      // Check for cross-reference inconsistencies
      const crossRefConflicts = await this.checkCrossReferenceConsistency(entityId);
      conflicts.push(...crossRefConflicts);
      
      // Get AI-powered suggestions
      if (this.defaultOptions.enableAI) {
        const aiSuggestions = await advancedCodexService.getAISuggestions(entityId, 'consistency');
        suggestions.push(...aiSuggestions);
      }
      
      // Calculate overall consistency score
      const consistencyScore = this.calculateConsistencyScore(flags, conflicts);
      
      return { consistencyScore, flags, suggestions, conflicts };
      
    } catch (error) {
      console.error('Consistency check failed:', error);
      throw error;
    }
  }

  async checkProjectConsistency(projectId: string): Promise<{
    overallScore: number;
    entityScores: Array<{ entityId: string; score: number; issueCount: number }>;
    globalIssues: ConsistencyFlag[];
    recommendations: string[];
  }> {
    try {
      const projectEntities = await advancedCodexService.searchEntities({ projectId });
      const entityScores: Array<{ entityId: string; score: number; issueCount: number }> = [];
      const globalIssues: ConsistencyFlag[] = [];
      
      // Check each entity
      for (const result of projectEntities.results) {
        const entityCheck = await this.checkEntityConsistency(result.entity.id);
        entityScores.push({
          entityId: result.entity.id,
          score: entityCheck.consistencyScore,
          issueCount: entityCheck.flags.length + entityCheck.conflicts.length
        });
        
        // Collect critical issues for global view
        const criticalFlags = entityCheck.flags.filter(flag => flag.severity === 'critical');
        globalIssues.push(...criticalFlags);
      }
      
      // Calculate overall score
      const overallScore = entityScores.length > 0
        ? entityScores.reduce((sum, entity) => sum + entity.score, 0) / entityScores.length
        : 100;
      
      // Generate recommendations
      const recommendations = await this.generateConsistencyRecommendations(entityScores, globalIssues);
      
      return { overallScore, entityScores, globalIssues, recommendations };
      
    } catch (error) {
      console.error('Project consistency check failed:', error);
      throw error;
    }
  }

  // SEARCH INDEX MANAGEMENT

  async rebuildSearchIndex(projectId: string): Promise<void> {
    try {
      console.log('Rebuilding search index...');
      
      // Clear existing index
      this.searchIndex.textIndex.clear();
      this.searchIndex.semanticIndex.clear();
      this.searchIndex.conceptIndex.clear();
      this.searchIndex.relationshipIndex.clear();
      
      // Get all entities
      const entities = await advancedCodexService.searchEntities({ projectId });
      
      // Build text index
      for (const result of entities.results) {
        await this.indexEntity(result.entity);
      }
      
      // Build semantic index if AI is enabled
      if (this.defaultOptions.enableAI) {
        await this.buildSemanticIndex(entities.results.map(r => r.entity));
      }
      
      // Update timestamp
      this.searchIndex.lastUpdated = new Date().toISOString();
      
      // Save index
      this.saveSearchIndex();
      
      console.log('Search index rebuilt successfully');
      
    } catch (error) {
      console.error('Failed to rebuild search index:', error);
      throw error;
    }
  }

  async updateEntityInIndex(entity: AdvancedCodexEntity): Promise<void> {
    try {
      // Remove existing entries
      await this.removeEntityFromIndex(entity.id);
      
      // Add updated entity
      await this.indexEntity(entity);
      
      // Update semantic index if AI is enabled
      if (this.defaultOptions.enableAI) {
        await this.updateEntitySemanticIndex(entity);
      }
      
    } catch (error) {
      console.error('Failed to update entity in search index:', error);
    }
  }

  private async indexEntity(entity: AdvancedCodexEntity): Promise<void> {
    // Index text content
    const textContent = this.extractTextContent(entity);
    const terms = this.tokenizeText(textContent);
    
    for (const term of terms) {
      if (!this.searchIndex.textIndex.has(term)) {
        this.searchIndex.textIndex.set(term, new Set());
      }
      this.searchIndex.textIndex.get(term)!.add(entity.id);
    }
    
    // Index concepts
    const concepts = this.extractConcepts(entity);
    for (const concept of concepts) {
      if (!this.searchIndex.conceptIndex.has(concept)) {
        this.searchIndex.conceptIndex.set(concept, new Set());
      }
      this.searchIndex.conceptIndex.get(concept)!.add(entity.id);
    }
  }

  private async buildSemanticIndex(entities: AdvancedCodexEntity[]): Promise<void> {
    for (const entity of entities) {
      try {
        await this.updateEntitySemanticIndex(entity);
      } catch (error) {
        console.warn(`Failed to build semantic index for entity ${entity.id}:`, error);
      }
    }
  }

  private async updateEntitySemanticIndex(entity: AdvancedCodexEntity): Promise<void> {
    try {
      const textContent = this.extractTextContent(entity);
      const embedding = await this.generateEmbedding(textContent);
      const concepts = this.extractConcepts(entity);
      const themes = this.extractThemes(entity);
      
      const semanticIndex: SemanticSearchIndex = {
        entityId: entity.id,
        vectors: embedding,
        concepts,
        themes,
        lastUpdated: new Date().toISOString()
      };
      
      this.searchIndex.semanticIndex.set(entity.id, semanticIndex);
      
    } catch (error) {
      console.warn(`Failed to update semantic index for entity ${entity.id}:`, error);
    }
  }

  // AI-POWERED FEATURES

  private async analyzeSearchIntent(query: string, context?: SearchContext): Promise<SearchIntent> {
    try {
      const prompt = this.buildIntentAnalysisPrompt(query, context);
      const response = await aiProviderService.analyzeText(prompt, {
        task: 'classification',
        options: {
          categories: [
            'find_entity', 'find_relationship', 'check_consistency',
            'explore_connections', 'analyze_themes', 'research_topic',
            'validate_timeline', 'find_conflicts'
          ]
        }
      });
      
      return this.parseIntentResponse(response) || 'find_entity';
      
    } catch (error) {
      console.warn('Intent analysis failed, defaulting to find_entity:', error);
      return 'find_entity';
    }
  }

  private async enhanceResultsWithAI(
    results: EnhancedSearchResult[],
    searchQuery: SmartSearchQuery
  ): Promise<void> {
    for (const result of results) {
      try {
        const analysis = await this.generateAIAnalysis(result.entity, searchQuery.query);
        result.aiAnalysis = analysis;
      } catch (error) {
        console.warn(`Failed to generate AI analysis for entity ${result.entity.id}:`, error);
      }
    }
  }

  private async generateAIAnalysis(
    entity: AdvancedCodexEntity,
    query: string
  ): Promise<AISearchAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(entity, query);
      const response = await aiProviderService.analyzeText(prompt, {
        task: 'analysis',
        options: {
          includeReasons: true,
          includeConfidence: true
        }
      });
      
      return this.parseAnalysisResponse(response);
      
    } catch (error) {
      console.warn('AI analysis failed:', error);
      return {
        intentAnalysis: 'Analysis unavailable',
        conceptExtraction: [],
        thematicConnections: [],
        narrativeSignificance: 'Unknown',
        developmentPotential: [],
        questionSuggestions: []
      };
    }
  }

  private async generateRelationshipSuggestions(entityId: string): Promise<RelatedEntitySuggestion[]> {
    try {
      const suggestions = await advancedCodexService.suggestRelationships(entityId);
      
      return suggestions.map(suggestion => ({
        entity: { id: suggestion.toEntityId } as AdvancedCodexEntity, // Would need to fetch full entity
        relationshipType: suggestion.suggestedLinkType,
        relevanceScore: suggestion.confidence,
        explanation: suggestion.reasoning
      }));
      
    } catch (error) {
      console.warn('Failed to generate relationship suggestions:', error);
      return [];
    }
  }

  // HELPER METHODS

  private async performMultiLayeredSearch(searchQuery: SmartSearchQuery): Promise<EnhancedSearchResult[]> {
    const allResults: EnhancedSearchResult[] = [];
    const searchOptions = { ...this.defaultOptions, ...searchQuery.options };
    
    // Layer 1: Exact text matches
    const textResults = await this.textSearch(
      searchQuery.query,
      searchQuery.context?.currentProject || '',
      searchOptions
    );
    allResults.push(...textResults);
    
    // Layer 2: Semantic search (if enabled)
    if (searchOptions.enableSemanticSearch) {
      const semanticResults = await this.semanticSearch(
        searchQuery.query,
        searchQuery.context?.currentProject || '',
        searchOptions
      );
      allResults.push(...semanticResults);
    }
    
    // Layer 3: Conceptual search
    const concepts = this.extractConceptsFromQuery(searchQuery.query);
    if (concepts.length > 0) {
      const conceptResults = await this.conceptualSearch(
        concepts,
        searchQuery.context?.currentProject || '',
        searchOptions
      );
      allResults.push(...conceptResults);
    }
    
    // Deduplicate and sort by relevance
    const uniqueResults = this.deduplicateResults(allResults);
    return uniqueResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, searchOptions.maxResults);
  }

  private async textSearch(
    query: string,
    projectId: string,
    options: Partial<SearchOptions>
  ): Promise<EnhancedSearchResult[]> {
    try {
      const basicResults = await advancedCodexService.searchEntities({
        projectId,
        searchQuery: query
      });
      
      return basicResults.results.map(result => ({
        ...result,
        aiAnalysis: undefined,
        semanticSimilarity: undefined,
        consistencyFlags: [],
        relatedEntities: [],
        suggestions: [],
        conflictWarnings: []
      }));
      
    } catch (error) {
      console.error('Text search failed:', error);
      return [];
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // This would typically call an embedding service
      // For now, return a mock embedding
      return Array(768).fill(0).map(() => Math.random());
    } catch (error) {
      console.warn('Embedding generation failed:', error);
      return [];
    }
  }

  private async findSemanticMatches(
    queryEmbedding: number[],
    projectId: string,
    maxResults: number
  ): Promise<Array<{ entity: AdvancedCodexEntity; similarity: number }>> {
    const matches: Array<{ entity: AdvancedCodexEntity; similarity: number }> = [];
    
    for (const [entityId, semanticIndex] of this.searchIndex.semanticIndex) {
      try {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, semanticIndex.vectors);
        
        if (similarity > 0.5) { // Threshold for relevance
          const entity = await advancedCodexService.getEntity(entityId);
          matches.push({ entity, similarity });
        }
      } catch (error) {
        console.warn(`Failed to calculate similarity for entity ${entityId}:`, error);
      }
    }
    
    return matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async convertToSearchResults(
    matches: Array<{ entity: AdvancedCodexEntity; similarity: number }>,
    query: string
  ): Promise<EnhancedSearchResult[]> {
    return matches.map(match => ({
      entity: match.entity,
      relevance: match.similarity,
      matchedFields: ['semantic'],
      snippet: this.generateSnippet(match.entity, query),
      highlightedText: '',
      semanticSimilarity: match.similarity,
      consistencyFlags: [],
      relatedEntities: [],
      suggestions: [],
      conflictWarnings: []
    }));
  }

  private async createSearchResult(
    entity: AdvancedCodexEntity,
    query: string,
    searchType: string
  ): Promise<EnhancedSearchResult> {
    return {
      entity,
      relevance: this.calculateRelevance(entity, query, searchType),
      matchedFields: this.findMatchedFields(entity, query),
      snippet: this.generateSnippet(entity, query),
      highlightedText: this.highlightMatches(entity, query),
      consistencyFlags: [],
      relatedEntities: [],
      suggestions: [],
      conflictWarnings: []
    };
  }

  // TEXT PROCESSING UTILITIES

  private extractTextContent(entity: AdvancedCodexEntity): string {
    const parts = [
      entity.name,
      entity.summary,
      entity.description,
      ...entity.aliases,
      ...entity.tags
    ];
    
    return parts.filter(Boolean).join(' ');
  }

  private tokenizeText(text: string): Set<string> {
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Filter short words
    
    return new Set(tokens);
  }

  private extractConcepts(entity: AdvancedCodexEntity): string[] {
    const concepts: string[] = [];
    
    // Add entity type as concept
    concepts.push(entity.type);
    
    // Add tags as concepts
    concepts.push(...entity.tags);
    
    // Extract concepts from description using simple keyword extraction
    // In a real implementation, this would use NLP techniques
    const keywords = this.extractKeywords(entity.description);
    concepts.push(...keywords);
    
    return [...new Set(concepts.map(c => c.toLowerCase()))];
  }

  private extractThemes(entity: AdvancedCodexEntity): string[] {
    // This would analyze the entity's content for thematic elements
    // For now, return entity tags as themes
    return entity.tags.map(tag => tag.toLowerCase());
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in practice would use NLP
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private extractConceptsFromQuery(query: string): string[] {
    // Extract potential concepts from the search query
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3);
  }

  // UTILITY METHODS

  private deduplicateResults(results: EnhancedSearchResult[]): EnhancedSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.entity.id)) {
        return false;
      }
      seen.add(result.entity.id);
      return true;
    });
  }

  private calculateRelevance(entity: AdvancedCodexEntity, query: string, searchType: string): number {
    let relevance = 0;
    
    const queryLower = query.toLowerCase();
    const entityText = this.extractTextContent(entity).toLowerCase();
    
    // Exact name match
    if (entity.name.toLowerCase() === queryLower) {
      relevance += 1.0;
    } else if (entity.name.toLowerCase().includes(queryLower)) {
      relevance += 0.8;
    }
    
    // Alias matches
    for (const alias of entity.aliases) {
      if (alias.toLowerCase().includes(queryLower)) {
        relevance += 0.6;
      }
    }
    
    // Description match
    if (entityText.includes(queryLower)) {
      relevance += 0.4;
    }
    
    // Tag matches
    for (const tag of entity.tags) {
      if (tag.toLowerCase().includes(queryLower)) {
        relevance += 0.3;
      }
    }
    
    // Boost based on entity importance
    relevance += entity.importance * 0.1;
    
    return Math.min(1.0, relevance);
  }

  private findMatchedFields(entity: AdvancedCodexEntity, query: string): string[] {
    const fields: string[] = [];
    const queryLower = query.toLowerCase();
    
    if (entity.name.toLowerCase().includes(queryLower)) fields.push('name');
    if (entity.description.toLowerCase().includes(queryLower)) fields.push('description');
    if (entity.summary.toLowerCase().includes(queryLower)) fields.push('summary');
    if (entity.aliases.some(alias => alias.toLowerCase().includes(queryLower))) fields.push('aliases');
    if (entity.tags.some(tag => tag.toLowerCase().includes(queryLower))) fields.push('tags');
    
    return fields;
  }

  private generateSnippet(entity: AdvancedCodexEntity, query: string): string {
    const text = entity.description || entity.summary;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    const index = textLower.indexOf(queryLower);
    if (index === -1) {
      return text.substring(0, 150) + '...';
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  }

  private highlightMatches(entity: AdvancedCodexEntity, query: string): string {
    const text = this.generateSnippet(entity, query);
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // CONSISTENCY CHECKING HELPERS

  private convertToConsistencyFlags(issues: any[]): ConsistencyFlag[] {
    return issues.map(issue => ({
      id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: issue.type,
      description: issue.description,
      severity: issue.severity,
      affectedEntities: issue.affectedFields || [],
      suggestions: issue.suggestedFix ? [issue.suggestedFix] : [],
      status: 'open'
    }));
  }

  private async checkCrossReferenceConsistency(entityId: string): Promise<ConflictWarning[]> {
    // This would check for inconsistencies in how an entity is referenced across different contexts
    // Implementation would depend on the specific consistency rules
    return [];
  }

  private calculateConsistencyScore(flags: ConsistencyFlag[], conflicts: ConflictWarning[]): number {
    let score = 100;
    
    // Deduct points based on severity
    for (const flag of flags) {
      switch (flag.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }
    
    for (const conflict of conflicts) {
      switch (conflict.severity) {
        case 'critical': score -= 15; break;
        case 'high': score -= 8; break;
        case 'medium': score -= 4; break;
        case 'low': score -= 1; break;
      }
    }
    
    return Math.max(0, score);
  }

  private async generateConsistencyRecommendations(
    entityScores: Array<{ entityId: string; score: number; issueCount: number }>,
    globalIssues: ConsistencyFlag[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Identify entities needing attention
    const problematicEntities = entityScores.filter(entity => entity.score < 70);
    if (problematicEntities.length > 0) {
      recommendations.push(`Review ${problematicEntities.length} entities with low consistency scores`);
    }
    
    // Analyze global issues
    const criticalIssues = globalIssues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical consistency issues immediately`);
    }
    
    // Suggest specific actions based on issue types
    const issueTypes = globalIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [type, count] of Object.entries(issueTypes)) {
      if (count > 2) {
        recommendations.push(`Review ${type} patterns across ${count} entities`);
      }
    }
    
    return recommendations;
  }

  // AI PROMPT BUILDERS

  private buildIntentAnalysisPrompt(query: string, context?: SearchContext): string {
    return `
Analyze the search intent for this query: "${query}"

Context:
${context?.userGoal ? `User goal: ${context.userGoal}` : ''}
${context?.currentEntity ? `Current entity: ${context.currentEntity}` : ''}
${context?.previousSearches ? `Previous searches: ${context.previousSearches.join(', ')}` : ''}

Available intents:
- find_entity: Looking for a specific character, location, or object
- find_relationship: Exploring connections between entities
- check_consistency: Verifying information consistency
- explore_connections: Understanding entity networks
- analyze_themes: Examining thematic elements
- research_topic: Gathering information about a topic
- validate_timeline: Checking chronological consistency
- find_conflicts: Identifying story conflicts or contradictions

Return only the most likely intent.
    `.trim();
  }

  private buildAnalysisPrompt(entity: AdvancedCodexEntity, query: string): string {
    return `
Analyze this entity in relation to the search query: "${query}"

Entity: ${entity.name} (${entity.type})
Description: ${entity.description}
Tags: ${entity.tags.join(', ')}

Provide analysis for:
1. Intent analysis: Why was this entity found for this query?
2. Concept extraction: Key concepts related to this entity
3. Thematic connections: Themes this entity represents or connects to
4. Narrative significance: Role in the story
5. Development potential: How this entity could be developed further
6. Question suggestions: What questions might the user have about this entity?

Format as JSON.
    `.trim();
  }

  private parseIntentResponse(response: any): SearchIntent | null {
    try {
      const intentMap: Record<string, SearchIntent> = {
        'find_entity': 'find_entity',
        'find_relationship': 'find_relationship',
        'check_consistency': 'check_consistency',
        'explore_connections': 'explore_connections',
        'analyze_themes': 'analyze_themes',
        'research_topic': 'research_topic',
        'validate_timeline': 'validate_timeline',
        'find_conflicts': 'find_conflicts'
      };
      
      const text = typeof response === 'string' ? response : response.text || '';
      const lowerText = text.toLowerCase();
      
      for (const [key, intent] of Object.entries(intentMap)) {
        if (lowerText.includes(key)) {
          return intent;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to parse intent response:', error);
      return null;
    }
  }

  private parseAnalysisResponse(response: any): AISearchAnalysis {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      return {
        intentAnalysis: parsed.intentAnalysis || 'No analysis available',
        conceptExtraction: parsed.conceptExtraction || [],
        thematicConnections: parsed.thematicConnections || [],
        narrativeSignificance: parsed.narrativeSignificance || 'Unknown',
        developmentPotential: parsed.developmentPotential || [],
        questionSuggestions: parsed.questionSuggestions || []
      };
    } catch (error) {
      console.warn('Failed to parse analysis response:', error);
      return {
        intentAnalysis: 'Analysis parsing failed',
        conceptExtraction: [],
        thematicConnections: [],
        narrativeSignificence: 'Unknown',
        developmentPotential: [],
        questionSuggestions: []
      };
    }
  }

  // ANALYTICS AND TRACKING

  private recordSearch(searchQuery: SmartSearchQuery): void {
    this.searchHistory.push(searchQuery);
    
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }
    
    this.analytics.totalSearches++;
    
    if (searchQuery.intent) {
      this.analytics.searchIntents[searchQuery.intent] = 
        (this.analytics.searchIntents[searchQuery.intent] || 0) + 1;
    }
  }

  private updateAnalytics(
    searchQuery: SmartSearchQuery,
    results: EnhancedSearchResult[],
    responseTime: number
  ): void {
    // Update response time
    this.analytics.averageResponseTime = 
      (this.analytics.averageResponseTime * (this.analytics.totalSearches - 1) + responseTime) / 
      this.analytics.totalSearches;
    
    // Track search terms
    const terms = searchQuery.query.toLowerCase().split(/\s+/);
    for (const term of terms) {
      if (term.length > 2) {
        const existing = this.analytics.mostSearchedTerms.find(t => t.term === term);
        if (existing) {
          existing.count++;
        } else {
          this.analytics.mostSearchedTerms.push({ term, count: 1 });
        }
      }
    }
    
    // Sort and limit search terms
    this.analytics.mostSearchedTerms = this.analytics.mostSearchedTerms
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    
    // Update AI usage stats
    if (searchQuery.options?.enableAI) {
      this.analytics.aiUsageStats.totalAICalls++;
      
      const avgConfidence = results
        .filter(r => r.aiAnalysis)
        .reduce((sum, r, _, arr) => sum + (1 / arr.length), 0); // Mock confidence
      
      this.analytics.aiUsageStats.averageConfidence = 
        (this.analytics.aiUsageStats.averageConfidence + avgConfidence) / 2;
    }
  }

  // PERSISTENCE

  private loadSearchIndex(): void {
    try {
      const stored = localStorage.getItem('codex_search_index');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore Maps from stored arrays
        this.searchIndex.textIndex = new Map(data.textIndex || []);
        this.searchIndex.semanticIndex = new Map(data.semanticIndex || []);
        this.searchIndex.conceptIndex = new Map(data.conceptIndex || []);
        this.searchIndex.relationshipIndex = new Map(data.relationshipIndex || []);
        this.searchIndex.lastUpdated = data.lastUpdated || new Date().toISOString();
      }
    } catch (error) {
      console.warn('Failed to load search index:', error);
    }
  }

  private saveSearchIndex(): void {
    try {
      const data = {
        textIndex: Array.from(this.searchIndex.textIndex.entries()),
        semanticIndex: Array.from(this.searchIndex.semanticIndex.entries()),
        conceptIndex: Array.from(this.searchIndex.conceptIndex.entries()),
        relationshipIndex: Array.from(this.searchIndex.relationshipIndex.entries()),
        lastUpdated: this.searchIndex.lastUpdated
      };
      
      localStorage.setItem('codex_search_index', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save search index:', error);
    }
  }

  private async removeEntityFromIndex(entityId: string): Promise<void> {
    // Remove from text index
    for (const [term, entityIds] of this.searchIndex.textIndex) {
      entityIds.delete(entityId);
      if (entityIds.size === 0) {
        this.searchIndex.textIndex.delete(term);
      }
    }
    
    // Remove from semantic index
    this.searchIndex.semanticIndex.delete(entityId);
    
    // Remove from concept index
    for (const [concept, entityIds] of this.searchIndex.conceptIndex) {
      entityIds.delete(entityId);
      if (entityIds.size === 0) {
        this.searchIndex.conceptIndex.delete(concept);
      }
    }
  }

  // CONFIGURATION

  private getDefaultOptions(): SearchOptions {
    return {
      enableAI: true,
      enableSemanticSearch: true,
      enableConsistencyChecking: true,
      enableSuggestions: true,
      maxResults: 20,
      relevanceThreshold: 0.3,
      includeSimilar: true,
      includeRelated: true,
      includeConflicts: true,
      searchDepth: 'medium',
      responseStyle: 'detailed'
    };
  }

  private initializeAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      averageResponseTime: 0,
      mostSearchedTerms: [],
      searchIntents: {} as Record<SearchIntent, number>,
      aiUsageStats: {
        totalAICalls: 0,
        averageConfidence: 0,
        accuracyScore: 0
      },
      userSatisfaction: {
        averageRating: 0,
        feedbackCount: 0
      }
    };
  }

  // PUBLIC API

  getSearchAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }

  getSearchHistory(): SmartSearchQuery[] {
    return [...this.searchHistory];
  }

  updateSearchOptions(options: Partial<SearchOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  // CLEANUP

  dispose(): void {
    this.saveSearchIndex();
    this.searchHistory = [];
    this.searchIndex.textIndex.clear();
    this.searchIndex.semanticIndex.clear();
    this.searchIndex.conceptIndex.clear();
    this.searchIndex.relationshipIndex.clear();
  }
}

// Export singleton instance
export const advancedCodexSearchService = new AdvancedCodexSearchService();
export default advancedCodexSearchService;