/**
 * Intelligent Auto-Linking Service - Phase 1C Advanced Feature
 * AI-powered entity detection and smart linking suggestions
 * Real-time analysis with context understanding and consistency checking
 */

import { aiProviderService } from './aiProviderService';
import { advancedCodexService } from './advancedCodexService';
import type {
  AdvancedCodexEntity,
  AdvancedEntityType,
  EntityMention,
  AISuggestion,
  ConsistencyFlag
} from '@/types/codex';

// Enhanced detection configuration
export interface IntelligentLinkingConfig {
  // Detection settings
  enableRealTimeDetection: boolean;
  enableContextualAnalysis: boolean;
  enableAIEnhancement: boolean;
  minimumConfidence: number; // 0.0-1.0
  
  // Entity detection
  enabledEntityTypes: AdvancedEntityType[];
  caseSensitive: boolean;
  fuzzyMatchThreshold: number;
  contextWindowSize: number; // characters before/after
  
  // AI enhancement
  aiProvider: 'openai' | 'anthropic' | 'local';
  enableNaturalLanguageProcessing: boolean;
  enableSemanticAnalysis: boolean;
  enableIntentionDetection: boolean;
  
  // Auto-creation settings
  autoCreateThreshold: number;
  enableAutoCreation: boolean;
  requireConfirmation: boolean;
  
  // Performance
  batchProcessingSize: number;
  debounceDelay: number; // ms
  maxSuggestionsPerDocument: number;
}

export interface DetectionResult {
  entityMentions: EntityMention[];
  newEntitySuggestions: NewEntitySuggestion[];
  relationshipSuggestions: RelationshipSuggestion[];
  consistencyWarnings: ConsistencyWarning[];
  contextualInsights: ContextualInsight[];
}

export interface NewEntitySuggestion {
  text: string;
  normalizedText: string;
  suggestedType: AdvancedEntityType;
  confidence: number;
  reasoning: string;
  context: string;
  frequency: number;
  positions: TextPosition[];
  aiAnalysis?: AIEntityAnalysis;
}

export interface RelationshipSuggestion {
  fromEntityId: string;
  toEntityId: string;
  fromText: string;
  toText: string;
  relationshipType: string;
  confidence: number;
  evidence: string[];
  context: string;
  reasoning: string;
}

export interface ConsistencyWarning {
  type: 'name_variation' | 'attribute_conflict' | 'timeline_issue' | 'context_mismatch';
  entityId: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  evidence: string[];
  suggestedResolution: string;
  affectedMentions: TextPosition[];
}

export interface ContextualInsight {
  type: 'character_development' | 'plot_advancement' | 'world_building' | 'theme_emergence';
  description: string;
  confidence: number;
  relatedEntities: string[];
  suggestedActions: string[];
}

export interface TextPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface AIEntityAnalysis {
  suggestedAttributes: Record<string, any>;
  potentialRelationships: string[];
  thematicSignificance: string;
  narrativeRole: string;
  developmentPotential: string;
}

export interface ProcessingStats {
  totalCharacters: number;
  totalWords: number;
  processingTime: number;
  entitiesFound: number;
  suggestionsGenerated: number;
  aiCallsMade: number;
  confidence: number;
}

class IntelligentAutoLinkingService {
  private config: IntelligentLinkingConfig;
  private processingQueue: Map<string, NodeJS.Timeout> = new Map();
  private entityCache: Map<string, AdvancedCodexEntity[]> = new Map();
  private processingHistory: Map<string, ProcessingStats> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfig();
  }

  // MAIN PROCESSING METHODS

  async analyzeDocument(
    documentId: string,
    content: string,
    projectId: string,
    options: Partial<IntelligentLinkingConfig> = {}
  ): Promise<DetectionResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...options };
    
    try {
      // Clear any existing processing for this document
      this.cancelProcessing(documentId);
      
      // Pre-process content
      const preprocessedContent = this.preprocessContent(content);
      
      // Get project entities (with caching)
      const entities = await this.getProjectEntities(projectId);
      
      // Phase 1: Basic entity detection
      const basicMentions = await this.detectBasicEntityMentions(
        preprocessedContent,
        entities,
        config
      );
      
      // Phase 2: AI-enhanced analysis
      let aiResults: Partial<DetectionResult> = {};
      if (config.enableAIEnhancement) {
        aiResults = await this.performAIAnalysis(
          preprocessedContent,
          basicMentions,
          entities,
          projectId,
          config
        );
      }
      
      // Phase 3: Relationship detection
      const relationshipSuggestions = await this.detectRelationships(
        preprocessedContent,
        [...basicMentions, ...(aiResults.entityMentions || [])],
        entities,
        config
      );
      
      // Phase 4: Consistency checking
      const consistencyWarnings = await this.checkConsistency(
        [...basicMentions, ...(aiResults.entityMentions || [])],
        entities,
        config
      );
      
      // Phase 5: Contextual analysis
      const contextualInsights = config.enableContextualAnalysis
        ? await this.generateContextualInsights(
            preprocessedContent,
            [...basicMentions, ...(aiResults.entityMentions || [])],
            entities,
            projectId
          )
        : [];
      
      // Compile results
      const result: DetectionResult = {
        entityMentions: [...basicMentions, ...(aiResults.entityMentions || [])],
        newEntitySuggestions: aiResults.newEntitySuggestions || [],
        relationshipSuggestions,
        consistencyWarnings,
        contextualInsights
      };
      
      // Store processing stats
      this.processingHistory.set(documentId, {
        totalCharacters: content.length,
        totalWords: content.split(/\s+/).length,
        processingTime: Date.now() - startTime,
        entitiesFound: result.entityMentions.length,
        suggestionsGenerated: result.newEntitySuggestions.length,
        aiCallsMade: config.enableAIEnhancement ? 1 : 0,
        confidence: this.calculateOverallConfidence(result)
      });
      
      return result;
      
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  async analyzeRealTime(
    documentId: string,
    content: string,
    projectId: string,
    cursorPosition?: number
  ): Promise<DetectionResult> {
    // Debounce processing to avoid excessive API calls
    if (this.processingQueue.has(documentId)) {
      clearTimeout(this.processingQueue.get(documentId)!);
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          // Analyze only around cursor position for real-time performance
          const contextRange = this.getContextRange(content, cursorPosition, 500);
          const contextContent = content.slice(contextRange.start, contextRange.end);
          
          const result = await this.analyzeDocument(
            documentId,
            contextContent,
            projectId,
            {
              ...this.config,
              maxSuggestionsPerDocument: 5, // Limit for real-time
              batchProcessingSize: 10
            }
          );
          
          this.processingQueue.delete(documentId);
          resolve(result);
        } catch (error) {
          this.processingQueue.delete(documentId);
          reject(error);
        }
      }, this.config.debounceDelay);
      
      this.processingQueue.set(documentId, timeout);
    });
  }

  // ENTITY DETECTION METHODS

  private async detectBasicEntityMentions(
    content: string,
    entities: AdvancedCodexEntity[],
    config: IntelligentLinkingConfig
  ): Promise<EntityMention[]> {
    const mentions: EntityMention[] = [];
    
    for (const entity of entities) {
      if (!config.enabledEntityTypes.includes(entity.type)) continue;
      
      // Create search terms (name + aliases)
      const searchTerms = [entity.name, ...entity.aliases].filter(Boolean);
      
      for (const term of searchTerms) {
        const matches = this.findTextMatches(content, term, config);
        
        for (const match of matches) {
          const context = this.extractContext(content, match.start, match.end, config.contextWindowSize);
          
          mentions.push({
            sourceType: 'document',
            sourceId: 'current',
            text: match.text,
            context: context.full,
            confidence: match.confidence,
            verified: false,
            entityId: entity.id,
            position: match,
            matchType: match.type
          });
        }
      }
    }
    
    // Remove overlapping mentions (keep highest confidence)
    return this.deduplicateMentions(mentions);
  }

  private async performAIAnalysis(
    content: string,
    existingMentions: EntityMention[],
    entities: AdvancedCodexEntity[],
    projectId: string,
    config: IntelligentLinkingConfig
  ): Promise<Partial<DetectionResult>> {
    if (!config.enableAIEnhancement) {
      return { entityMentions: [], newEntitySuggestions: [] };
    }
    
    try {
      // Prepare AI prompt
      const prompt = this.buildAIAnalysisPrompt(content, existingMentions, entities);
      
      // Call AI service
      const aiResponse = await aiProviderService.analyzeText(prompt, {
        provider: config.aiProvider,
        task: 'entity_extraction',
        options: {
          includeReasons: true,
          includeConfidence: true,
          maxSuggestions: config.maxSuggestionsPerDocument
        }
      });
      
      // Parse AI response
      return this.parseAIResponse(aiResponse, content, entities);
      
    } catch (error) {
      console.warn('AI analysis failed, falling back to basic detection:', error);
      return { entityMentions: [], newEntitySuggestions: [] };
    }
  }

  private async detectRelationships(
    content: string,
    mentions: EntityMention[],
    entities: AdvancedCodexEntity[],
    config: IntelligentLinkingConfig
  ): Promise<RelationshipSuggestion[]> {
    const suggestions: RelationshipSuggestion[] = [];
    
    // Group mentions by proximity
    const proximityGroups = this.groupMentionsByProximity(mentions, 100); // 100 characters
    
    for (const group of proximityGroups) {
      if (group.length < 2) continue;
      
      // Analyze relationships within each group
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const mention1 = group[i];
          const mention2 = group[j];
          
          const relationship = await this.analyzeRelationshipBetweenMentions(
            mention1,
            mention2,
            content,
            entities,
            config
          );
          
          if (relationship && relationship.confidence >= config.minimumConfidence) {
            suggestions.push(relationship);
          }
        }
      }
    }
    
    return suggestions;
  }

  private async checkConsistency(
    mentions: EntityMention[],
    entities: AdvancedCodexEntity[],
    config: IntelligentLinkingConfig
  ): Promise<ConsistencyWarning[]> {
    const warnings: ConsistencyWarning[] = [];
    
    // Group mentions by entity
    const mentionsByEntity = this.groupMentionsByEntity(mentions);
    
    for (const [entityId, entityMentions] of mentionsByEntity) {
      const entity = entities.find(e => e.id === entityId);
      if (!entity) continue;
      
      // Check for name variations
      const nameVariations = this.detectNameVariations(entityMentions, entity);
      warnings.push(...nameVariations);
      
      // Check for context mismatches
      const contextMismatches = await this.detectContextMismatches(entityMentions, entity);
      warnings.push(...contextMismatches);
      
      // Check for attribute conflicts
      const attributeConflicts = await this.detectAttributeConflicts(entityMentions, entity);
      warnings.push(...attributeConflicts);
    }
    
    return warnings;
  }

  private async generateContextualInsights(
    content: string,
    mentions: EntityMention[],
    entities: AdvancedCodexEntity[],
    projectId: string
  ): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];
    
    try {
      // Analyze character development
      const characterInsights = await this.analyzeCharacterDevelopment(content, mentions, entities);
      insights.push(...characterInsights);
      
      // Analyze plot advancement
      const plotInsights = await this.analyzePlotAdvancement(content, mentions, entities);
      insights.push(...plotInsights);
      
      // Analyze world building
      const worldInsights = await this.analyzeWorldBuilding(content, mentions, entities);
      insights.push(...worldInsights);
      
      // Analyze theme emergence
      const themeInsights = await this.analyzeThemeEmergence(content, mentions, entities);
      insights.push(...themeInsights);
      
    } catch (error) {
      console.warn('Failed to generate contextual insights:', error);
    }
    
    return insights;
  }

  // TEXT PROCESSING UTILITIES

  private preprocessContent(content: string): string {
    // Remove excessive whitespace
    content = content.replace(/\s+/g, ' ');
    
    // Normalize quotes
    content = content.replace(/[""]/g, '"');
    content = content.replace(/['']/g, "'");
    
    // Normalize dashes
    content = content.replace(/[—–]/g, '-');
    
    return content.trim();
  }

  private findTextMatches(
    content: string,
    searchTerm: string,
    config: IntelligentLinkingConfig
  ): Array<{ text: string; start: number; end: number; confidence: number; type: 'exact' | 'fuzzy' | 'partial' }> {
    const matches = [];
    const flags = config.caseSensitive ? 'g' : 'gi';
    
    // Exact matches first
    const exactRegex = new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`, flags);
    let match;
    
    while ((match = exactRegex.exec(content)) !== null) {
      matches.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.95,
        type: 'exact' as const
      });
    }
    
    // Fuzzy matches if enabled
    if (config.fuzzyMatchThreshold > 0) {
      const fuzzyMatches = this.findFuzzyMatches(content, searchTerm, config);
      matches.push(...fuzzyMatches);
    }
    
    return matches;
  }

  private findFuzzyMatches(
    content: string,
    searchTerm: string,
    config: IntelligentLinkingConfig
  ): Array<{ text: string; start: number; end: number; confidence: number; type: 'fuzzy' }> {
    const matches = [];
    const words = content.split(/\s+/);
    let position = 0;
    
    for (const word of words) {
      const similarity = this.calculateStringSimilarity(word.toLowerCase(), searchTerm.toLowerCase());
      
      if (similarity >= config.fuzzyMatchThreshold) {
        const start = content.indexOf(word, position);
        matches.push({
          text: word,
          start,
          end: start + word.length,
          confidence: similarity * 0.8, // Reduce confidence for fuzzy matches
          type: 'fuzzy' as const
        });
      }
      
      position += word.length + 1;
    }
    
    return matches;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Levenshtein distance-based similarity
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
  }

  private extractContext(
    content: string,
    start: number,
    end: number,
    windowSize: number
  ): { before: string; after: string; full: string } {
    const contextStart = Math.max(0, start - windowSize);
    const contextEnd = Math.min(content.length, end + windowSize);
    
    const before = content.slice(contextStart, start);
    const after = content.slice(end, contextEnd);
    const full = content.slice(contextStart, contextEnd);
    
    return { before, after, full };
  }

  private getContextRange(content: string, position?: number, size = 500): { start: number; end: number } {
    if (!position) {
      return { start: 0, end: Math.min(content.length, size) };
    }
    
    const start = Math.max(0, position - size / 2);
    const end = Math.min(content.length, position + size / 2);
    
    return { start, end };
  }

  // AI INTEGRATION METHODS

  private buildAIAnalysisPrompt(
    content: string,
    existingMentions: EntityMention[],
    entities: AdvancedCodexEntity[]
  ): string {
    const entityTypes = [...new Set(entities.map(e => e.type))];
    const existingEntityNames = existingMentions.map(m => m.text);
    
    return `
Analyze this text for story entities that might have been missed:

TEXT:
${content}

EXISTING ENTITIES FOUND:
${existingEntityNames.join(', ')}

ENTITY TYPES TO LOOK FOR:
${entityTypes.join(', ')}

Please identify:
1. New potential entities not in the existing list
2. Suggest entity types for each
3. Provide confidence scores (0-1)
4. Give reasoning for each suggestion
5. Identify potential relationships between entities

Format your response as JSON with entities and relationships arrays.
    `.trim();
  }

  private parseAIResponse(
    aiResponse: any,
    content: string,
    entities: AdvancedCodexEntity[]
  ): Partial<DetectionResult> {
    try {
      const parsed = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
      
      const newEntitySuggestions: NewEntitySuggestion[] = [];
      const entityMentions: EntityMention[] = [];
      
      if (parsed.entities) {
        for (const entity of parsed.entities) {
          // Find positions of the entity text in content
          const positions = this.findAllOccurrences(content, entity.text);
          
          newEntitySuggestions.push({
            text: entity.text,
            normalizedText: entity.text.toLowerCase().trim(),
            suggestedType: entity.type,
            confidence: entity.confidence || 0.7,
            reasoning: entity.reasoning || 'AI suggestion',
            context: entity.context || '',
            frequency: positions.length,
            positions,
            aiAnalysis: entity.analysis
          });
        }
      }
      
      return { entityMentions, newEntitySuggestions };
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { entityMentions: [], newEntitySuggestions: [] };
    }
  }

  // UTILITY METHODS

  private async getProjectEntities(projectId: string): Promise<AdvancedCodexEntity[]> {
    // Check cache first
    if (this.entityCache.has(projectId)) {
      const cached = this.entityCache.get(projectId)!;
      // Return cached if less than 5 minutes old
      if (cached.length > 0 && Date.now() - cached[0].updatedAt < 300000) {
        return cached;
      }
    }
    
    // Fetch fresh data
    const entities = await advancedCodexService.searchEntities({
      projectId,
      types: this.config.enabledEntityTypes
    });
    
    this.entityCache.set(projectId, entities.results.map(r => r.entity));
    return entities.results.map(r => r.entity);
  }

  private deduplicateMentions(mentions: EntityMention[]): EntityMention[] {
    // Sort by confidence descending
    mentions.sort((a, b) => b.confidence - a.confidence);
    
    const result: EntityMention[] = [];
    const positions = new Set<string>();
    
    for (const mention of mentions) {
      const posKey = `${mention.position?.start}-${mention.position?.end}`;
      if (!positions.has(posKey)) {
        positions.add(posKey);
        result.push(mention);
      }
    }
    
    return result;
  }

  private groupMentionsByProximity(mentions: EntityMention[], maxDistance: number): EntityMention[][] {
    const groups: EntityMention[][] = [];
    const processed = new Set<EntityMention>();
    
    for (const mention of mentions) {
      if (processed.has(mention)) continue;
      
      const group = [mention];
      processed.add(mention);
      
      for (const other of mentions) {
        if (processed.has(other)) continue;
        
        const distance = Math.abs((mention.position?.start || 0) - (other.position?.start || 0));
        if (distance <= maxDistance) {
          group.push(other);
          processed.add(other);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  private groupMentionsByEntity(mentions: EntityMention[]): Map<string, EntityMention[]> {
    const groups = new Map<string, EntityMention[]>();
    
    for (const mention of mentions) {
      if (!mention.entityId) continue;
      
      if (!groups.has(mention.entityId)) {
        groups.set(mention.entityId, []);
      }
      groups.get(mention.entityId)!.push(mention);
    }
    
    return groups;
  }

  private findAllOccurrences(text: string, search: string): TextPosition[] {
    const positions: TextPosition[] = [];
    let index = 0;
    
    while ((index = text.indexOf(search, index)) !== -1) {
      positions.push({
        start: index,
        end: index + search.length
      });
      index += search.length;
    }
    
    return positions;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private calculateOverallConfidence(result: DetectionResult): number {
    const allConfidences = [
      ...result.entityMentions.map(m => m.confidence),
      ...result.newEntitySuggestions.map(s => s.confidence),
      ...result.relationshipSuggestions.map(r => r.confidence)
    ];
    
    if (allConfidences.length === 0) return 0;
    
    return allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length;
  }

  // CONFIGURATION MANAGEMENT

  private getDefaultConfig(): IntelligentLinkingConfig {
    return {
      enableRealTimeDetection: true,
      enableContextualAnalysis: true,
      enableAIEnhancement: true,
      minimumConfidence: 0.6,
      enabledEntityTypes: ['character', 'location', 'object', 'organization'],
      caseSensitive: false,
      fuzzyMatchThreshold: 0.8,
      contextWindowSize: 100,
      aiProvider: 'openai',
      enableNaturalLanguageProcessing: true,
      enableSemanticAnalysis: true,
      enableIntentionDetection: true,
      autoCreateThreshold: 0.8,
      enableAutoCreation: false,
      requireConfirmation: true,
      batchProcessingSize: 50,
      debounceDelay: 500,
      maxSuggestionsPerDocument: 20
    };
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('intelligentLinking_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load intelligent linking config:', error);
    }
  }

  public updateConfig(updates: Partial<IntelligentLinkingConfig>): void {
    this.config = { ...this.config, ...updates };
    
    try {
      localStorage.setItem('intelligentLinking_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save intelligent linking config:', error);
    }
  }

  public getConfig(): IntelligentLinkingConfig {
    return { ...this.config };
  }

  private cancelProcessing(documentId: string): void {
    const timeout = this.processingQueue.get(documentId);
    if (timeout) {
      clearTimeout(timeout);
      this.processingQueue.delete(documentId);
    }
  }

  // Placeholder methods for complex analysis (to be implemented based on specific AI models)
  private async analyzeRelationshipBetweenMentions(
    mention1: EntityMention,
    mention2: EntityMention,
    content: string,
    entities: AdvancedCodexEntity[],
    config: IntelligentLinkingConfig
  ): Promise<RelationshipSuggestion | null> {
    // Implementation would analyze context around both mentions to suggest relationships
    return null;
  }

  private detectNameVariations(mentions: EntityMention[], entity: AdvancedCodexEntity): ConsistencyWarning[] {
    // Implementation would detect variations in how an entity is named
    return [];
  }

  private async detectContextMismatches(mentions: EntityMention[], entity: AdvancedCodexEntity): Promise<ConsistencyWarning[]> {
    // Implementation would detect when entity is used in inconsistent contexts
    return [];
  }

  private async detectAttributeConflicts(mentions: EntityMention[], entity: AdvancedCodexEntity): Promise<ConsistencyWarning[]> {
    // Implementation would detect when mentions suggest conflicting attributes
    return [];
  }

  private async analyzeCharacterDevelopment(content: string, mentions: EntityMention[], entities: AdvancedCodexEntity[]): Promise<ContextualInsight[]> {
    // Implementation would analyze how characters develop in the text
    return [];
  }

  private async analyzePlotAdvancement(content: string, mentions: EntityMention[], entities: AdvancedCodexEntity[]): Promise<ContextualInsight[]> {
    // Implementation would analyze how the plot advances
    return [];
  }

  private async analyzeWorldBuilding(content: string, mentions: EntityMention[], entities: AdvancedCodexEntity[]): Promise<ContextualInsight[]> {
    // Implementation would analyze world-building elements
    return [];
  }

  private async analyzeThemeEmergence(content: string, mentions: EntityMention[], entities: AdvancedCodexEntity[]): Promise<ContextualInsight[]> {
    // Implementation would analyze emerging themes
    return [];
  }

  // PUBLIC API

  public getProcessingStats(documentId: string): ProcessingStats | null {
    return this.processingHistory.get(documentId) || null;
  }

  public clearCache(): void {
    this.entityCache.clear();
    this.processingHistory.clear();
  }

  public dispose(): void {
    // Clear all timeouts
    this.processingQueue.forEach(timeout => clearTimeout(timeout));
    this.processingQueue.clear();
    this.clearCache();
  }
}

// Export singleton instance
export const intelligentAutoLinkingService = new IntelligentAutoLinkingService();
export default intelligentAutoLinkingService;